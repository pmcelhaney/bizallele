/// <reference types="node" />
import { Record } from 'bizallele';
import { fieldsFromOpenAPI, OpenAPIFieldSelection } from 'bizallele/openapi';
import { readFileSync } from 'fs';
import { resolve } from 'path';

type Property = { [key: string]: unknown };

function documentFor(property: unknown, required = true, version = '3.1.0') {
    return {
        openapi: version,
        info: { title: 'Test', version: '1' },
        paths: {},
        components: {
            schemas: {
                Product: {
                    type: 'object',
                    properties: { value: property },
                    required: required ? ['value'] : [],
                },
            },
        },
    };
}

function recordFor(property: unknown, value: unknown, required = true, version = '3.1.0') {
    const fields = fieldsFromOpenAPI(documentFor(property, required, version), {
        schema: 'Product',
        fields: ['value'],
    });
    return new Record(fields, { value });
}

describe('fieldsFromOpenAPI', () => {
    it.each([
        [{ type: 'string' }, '', true],
        [{ type: 'string' }, 'Coffee', true],
        [{ type: 'string' }, 12, false],
        [{ type: 'string' }, null, false],
        [{ type: 'string' }, undefined, false],
        [{ type: 'integer' }, 0, true],
        [{ type: 'integer' }, -3, true],
        [{ type: 'integer' }, Number.MAX_SAFE_INTEGER, true],
        [{ type: 'integer' }, Number.MAX_SAFE_INTEGER + 1, false],
        [{ type: 'integer' }, 1.5, false],
        [{ type: 'integer' }, '12', false],
        [{ type: 'number' }, 1.5, true],
        [{ type: 'number' }, NaN, false],
        [{ type: 'number' }, Infinity, false],
        [{ type: 'number' }, '1.5', false],
        [{ type: 'boolean' }, false, true],
        [{ type: 'boolean' }, true, true],
        [{ type: 'boolean' }, 'true', false],
        [{ type: 'boolean' }, 0, false],
        [{ type: 'string', minLength: 1 }, '', false],
        [{ type: 'string', minLength: 2 }, 'ab', true],
        [{ type: 'string', minLength: 2 }, '😀', false],
        [{ type: 'string', maxLength: 1 }, '😀', true],
        [{ type: 'string', maxLength: 1 }, 'ab', false],
        [{ type: 'string', pattern: 'tea' }, 'green tea', true],
        [{ type: 'string', pattern: '^tea$' }, 'green tea', false],
        [{ type: 'number', minimum: 2 }, 2, true],
        [{ type: 'number', minimum: 2 }, 1, false],
        [{ type: 'number', maximum: 2 }, 2, true],
        [{ type: 'number', maximum: 2 }, 3, false],
        [{ type: 'number', exclusiveMinimum: 2 }, 2, false],
        [{ type: 'number', exclusiveMinimum: 2 }, 2.1, true],
        [{ type: 'number', exclusiveMaximum: 2 }, 2, false],
        [{ type: 'number', exclusiveMaximum: 2 }, 1.9, true],
        [{ type: 'number', minimum: 3, exclusiveMinimum: 2 }, 2.5, false],
        [{ type: 'number', multipleOf: 0.1 }, 0.3, true],
        [{ type: 'number', multipleOf: 0.1 }, 0.30000000000000004, false],
        [{ type: 'number', multipleOf: 0.1 }, 1e-18, false],
        [{ type: 'number', multipleOf: 0.1 }, 0, true],
        [{ type: 'number', multipleOf: 0.1 }, -0.3, true],
        [{ type: 'number', multipleOf: 1e-7 }, 3e-7, true],
        [{ type: 'number', multipleOf: 1e100 }, 3e100, true],
        [{ type: 'number', multipleOf: 2 }, 3, false],
        [{ type: 'string', enum: ['TEA', 'COFFEE'] }, 'TEA', true],
        [{ type: 'string', enum: ['TEA', 'COFFEE'] }, 'tea', false],
        [{ type: 'number', enum: [0, 1.5] }, 0, true],
        [{ type: 'boolean', enum: [false] }, false, true],
        [{ type: 'boolean', enum: [false] }, true, false],
        [{ type: 'string', const: 'TEA' }, 'TEA', true],
        [{ type: 'string', const: 'TEA' }, 'COFFEE', false],
        [{ type: ['string', 'null'] }, null, true],
        [{ type: ['null', 'string'] }, '', true],
        [{ type: ['string', 'null'], minLength: 2 }, null, true],
        [{ type: ['string', 'null'], enum: ['TEA'] }, null, false],
        [{ type: ['string', 'null'], enum: ['TEA', null] }, null, true],
        [{ type: ['string', 'null'], const: null }, null, true],
        [{ type: ['string', 'null'], const: null }, 'TEA', false],
    ])('validates %p with %p as %p', (property, value, expected) => {
        expect(recordFor(property, value).isValid()).toBe(expected);
    });

    it.each(['string', 'number', 'integer', 'boolean'])(
        'separates optionality and nullability for %s',
        type => {
            expect(recordFor({ type }, undefined, false).isValid()).toBe(true);
            expect(recordFor({ type }, null, false).isValid()).toBe(false);
            expect(recordFor({ type: [type, 'null'] }, undefined).isValid()).toBe(false);
            expect(recordFor({ type: [type, 'null'] }, null).isValid()).toBe(true);
        }
    );

    it.each([
        [{ type: 'string', nullable: true }, null, true],
        [{ type: 'string', nullable: false }, null, false],
        [{ type: 'string', nullable: true, enum: ['TEA'] }, null, false],
        [{ type: 'string', nullable: true, enum: ['TEA', null] }, null, true],
        [{ type: 'number', minimum: 2, exclusiveMinimum: true }, 2, false],
        [{ type: 'number', minimum: 2, exclusiveMinimum: false }, 2, true],
        [{ type: 'number', maximum: 2, exclusiveMaximum: true }, 2, false],
        [{ type: 'number', maximum: 2, exclusiveMaximum: false }, 2, true],
    ])('supports OpenAPI 3.0 semantics for %p', (property, value, expected) => {
        expect(recordFor(property, value, true, '3.0.3').isValid()).toBe(expected);
    });

    it('reads YAML, JSON, or a parsed document without mutating it', () => {
        const yaml = `openapi: 3.1.0
components:
  schemas:
    Product:
      type: object
      required: [name]
      properties:
        name:
          type: string
          title: Product name
          minLength: 1
        stock: {type: integer, minimum: 0}
        ignored: {type: array, items: {type: string}}
`;
        const parsed = documentFor({ type: 'integer' });
        const snapshot = JSON.stringify(parsed);
        const selection: OpenAPIFieldSelection = {
            schema: 'Product',
            fields: Object.freeze(['stock', 'name']),
        };
        const fields = fieldsFromOpenAPI(yaml, selection);
        expect(Object.keys(fields)).toEqual(['stock', 'name']);
        expect(new Record(fields, { name: 'Coffee', stock: 0 }).field('name').label).toBe(
            'Product name'
        );
        for (const source of [parsed, JSON.stringify(parsed)]) {
            expect(
                new Record(fieldsFromOpenAPI(source, { schema: 'Product', fields: ['value'] }), {
                    value: 12,
                }).isValid()
            ).toBe(true);
        }
        expect(JSON.stringify(parsed)).toBe(snapshot);
    });

    it('resolves local component aliases, property references, and escaped JSON Pointers', () => {
        const document = documentFor({ $ref: '#/components/schemas/Alias' });
        Object.assign(document.components.schemas, {
            Alias: { $ref: '#/components/schemas/Tea~1Coffee~0Kind' },
            'Tea/Coffee~Kind': { type: 'string', enum: ['TEA'] },
            Selected: { $ref: '#/components/schemas/Product' },
        });
        const fields = fieldsFromOpenAPI(document, { schema: 'Selected', fields: ['value'] });
        expect(new Record(fields, { value: 'TEA' }).isValid()).toBe(true);
        expect(new Record(fields, { value: 'COFFEE' }).isValid()).toBe(false);
    });

    it('preserves enum choices and immutable specialization', async () => {
        const property = { type: 'string', enum: ['TEA', 'COFFEE'] };
        const fields = fieldsFromOpenAPI(documentFor(property), {
            schema: 'Product',
            fields: ['value'],
        });
        property.enum.push('OTHER');
        const specialized = { value: fields.value.label('Drink') };
        const record = new Record(specialized, { value: 'TEA' });
        expect(await record.field('value').options()).toEqual([
            { text: 'TEA', value: 'TEA' },
            { text: 'COFFEE', value: 'COFFEE' },
        ]);
        expect(record.isValid('value', 'OTHER')).toBe(false);
        expect(await record.isValidAsync('value', 'OTHER')).toBe(false);
        expect(new Record(fields, { value: 'TEA' }).field('value').label).not.toBe('Drink');
    });

    it('does not confuse required presence with nonempty Bizallele values', () => {
        const fields = fieldsFromOpenAPI(documentFor({ type: 'string' }), {
            schema: 'Product',
            fields: ['value'],
        });
        expect(new Record(fields, { value: '' }).isValid()).toBe(true);
        expect(new Record({ value: fields.value.required() }, { value: '' }).isValid()).toBe(false);
    });

    it('leaves annotation formats, access flags, defaults, and extensions to applications', () => {
        const property = {
            type: 'string',
            format: 'email',
            default: 'test@example.com',
            readOnly: true,
            'x-ui': { widget: 'custom' },
        };
        const record = recordFor(property, 'not an email');
        expect(record.isValid()).toBe(true);
        expect(record.field('value').readOnly).toBe(false);
        record.clear();
        expect(record.values.value).toBe('');
    });

    it.each([
        { type: 'string', allOf: [] },
        { type: 'string', anyOf: [] },
        { type: 'string', oneOf: [] },
        { type: 'string', minLength: -1 },
        { type: 'string', minLength: 1.5 },
        { type: 'string', maxLength: '2' },
        { type: 'string', pattern: '[' },
        { type: 'string', pattern: 1 },
        { type: 'string', title: 1 },
        { type: 'number', minimum: NaN },
        { type: 'number', maximum: Infinity },
        { type: 'number', multipleOf: 0 },
        { type: 'number', multipleOf: -1 },
        { type: 'string', nullable: true },
        { type: 'number', exclusiveMinimum: true },
        { $ref: 'https://example.com/schema.json' },
        { $ref: '#/components/schemas/Missing' },
        { $ref: '#/components/schemas/~2' },
        { $ref: '#/components/schemas/%ZZ' },
        { $ref: '#/components/schemas/toString' },
    ])('rejects unsupported or malformed property %p', property => {
        expect(() => recordFor(property, '')).toThrow(/fieldsFromOpenAPI:/);
    });

    it.each([
        { type: 'string', nullable: 'true' },
        { type: 'string', const: 'A' },
        { type: ['string', 'null'] },
        { type: 'number', exclusiveMinimum: 2 },
        { type: 'number', exclusiveMinimum: true },
    ])('rejects invalid OpenAPI 3.0 property %p', property => {
        expect(() => recordFor(property, '', true, '3.0.4')).toThrow();
    });

    it('rejects cycles and constraints on the containing object', () => {
        const document = documentFor({ $ref: '#/components/schemas/A' });
        Object.assign(document.components.schemas, {
            A: { $ref: '#/components/schemas/B' },
            B: { $ref: '#/components/schemas/A' },
        });
        expect(() => fieldsFromOpenAPI(document, { schema: 'Product', fields: ['value'] })).toThrow(
            /cyclic reference|call stack/
        );
        for (const keyword of ['allOf', 'dependentRequired', 'minProperties']) {
            const source = documentFor({ type: 'string' });
            Object.assign(source.components.schemas.Product, { [keyword]: [] });
            expect(() =>
                fieldsFromOpenAPI(source, { schema: 'Product', fields: ['value'] })
            ).toThrow(keyword);
        }
    });

    it.each([
        null,
        {},
        { swagger: '2.0' },
        { openapi: '3.2.0' },
        { openapi: '3.1.0', jsonSchemaDialect: 'custom' },
        'openapi: [',
        'openapi: 3.1.0\nopenapi: 3.0.3',
    ])('rejects invalid or unsupported documents %p', source => {
        expect(() =>
            fieldsFromOpenAPI(source as any, { schema: 'Product', fields: ['value'] })
        ).toThrow();
    });

    it.each([
        null,
        { schema: 'Product' },
        { schema: 'Product', fields: [] },
        { schema: '', fields: ['value'] },
        { schema: 'Missing', fields: ['value'] },
        { schema: 'Product', fields: ['missing'] },
        { schema: 'Product', fields: [42] },
        { schema: 'Product', fields: ['value', 'value'] },
    ])('rejects invalid selections %p', selection => {
        expect(() =>
            fieldsFromOpenAPI(documentFor({ type: 'string' }), selection as any)
        ).toThrow();
    });

    it('runs the documented quickstart', () => {
        const text = readFileSync(resolve(__dirname, '../docs/openapi.md'), 'utf8');
        const example = text
            .match(/```javascript\n([\s\S]*?)\n```/)![1]
            .replace(/^import .*;\n/gm, '');
        const product = new Function('Record', 'fieldsFromOpenAPI', `${example}\nreturn product;`)(
            Record,
            fieldsFromOpenAPI
        );
        expect(product.isValid()).toBe(true);
        expect(product.isValid('stock', -1)).toBe(false);
    });
});
