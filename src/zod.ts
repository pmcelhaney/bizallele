import * as z from 'zod/v4/core';
import FieldTypeBuilder from './field-type-builder';
import { boolean, date, field, number, string } from './primitives.js';

/** Select exact object properties; opt into asynchronous Zod checks explicitly. */
export interface ZodFieldSelection<K extends string = string> {
    fields: readonly K[];
    async?: boolean;
}

function definitionFor(schema: z.$ZodType): FieldTypeBuilder<any> {
    const definition = (schema as z.$ZodTypes)._zod.def;
    switch (definition.type) {
        case 'optional':
        case 'nullable':
        case 'default':
        case 'prefault':
        case 'catch':
        case 'readonly':
        case 'nonoptional':
            return definitionFor(definition.innerType);
        case 'pipe':
            return definitionFor(definition.in);
        case 'string':
            return string;
        case 'number':
            return number;
        case 'boolean':
            return boolean;
        case 'date':
            return date;
        case 'enum': {
            const values = z.util.getEnumValues(definition.entries);
            return field.options(
                values.map(function option(value) {
                    return { value, text: String(value) };
                })
            );
        }
        default:
            return field;
    }
}

/**
 * Create immutable field definitions from a Zod 4 object, retaining the original
 * schema for validation. Parsing output is never written back to the record.
 */
export function fieldsFromZod<
    S extends z.$ZodObject,
    K extends Extract<keyof S['_zod']['def']['shape'], string>,
>(
    schema: S,
    selection: ZodFieldSelection<K>
): {
    [P in K]: FieldTypeBuilder<z.input<S['_zod']['def']['shape'][P]>>;
} {
    if (!schema || schema._zod?.def.type !== 'object') {
        throw new TypeError('fieldsFromZod requires a Zod 4 object schema.');
    }
    if (
        !selection ||
        !Array.isArray(selection.fields) ||
        !selection.fields.length ||
        selection.fields.some(function invalidName(name) {
            return typeof name !== 'string' || !name;
        }) ||
        (selection.async !== undefined && typeof selection.async !== 'boolean')
    ) {
        throw new TypeError(
            'fieldsFromZod requires a nonempty fields array and optional async boolean.'
        );
    }
    if (new Set(selection.fields).size !== selection.fields.length) {
        throw new Error('fieldsFromZod: selected field names must be distinct.');
    }
    const shape = schema._zod.def.shape;
    const useAsync = selection.async === true;
    return Object.fromEntries(
        selection.fields.map(function translate(name) {
            if (!Object.prototype.hasOwnProperty.call(shape, name)) {
                throw new Error(`fieldsFromZod: unknown field ${name}.`);
            }
            function relevant(result: ReturnType<typeof z.safeParse>): boolean {
                return (
                    result.success ||
                    !result.error.issues.some(function affectsField(issue) {
                        return issue.path.length === 0 || issue.path[0] === name;
                    })
                );
            }
            return [
                name,
                definitionFor(shape[name])
                    .defaultValue(undefined)
                    .validator({
                        name: `must match Zod schema field ${name}`,
                        validate: function validateZod(value, _view, record) {
                            const values = { ...record?.values, [name]: value };
                            if (useAsync) return z.safeParseAsync(schema, values).then(relevant);
                            try {
                                return relevant(z.safeParse(schema, values));
                            } catch (error) {
                                if (error instanceof z.$ZodAsyncError) {
                                    throw new Error(
                                        'fieldsFromZod: async Zod checks require { async: true } and Bizallele async validation.'
                                    );
                                }
                                throw error;
                            }
                        },
                    }),
            ];
        })
    ) as { [P in K]: FieldTypeBuilder<z.input<S['_zod']['def']['shape'][P]>> };
}
