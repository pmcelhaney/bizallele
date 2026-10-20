import * as z from 'zod/v4';
import * as mini from 'zod/v4/mini';
import { Record, Recordset } from 'bizallele';
import { fieldsFromZod } from 'bizallele/zod';

const schema = z.object({
    name: z.string().min(1),
    stock: z.number().int().nonnegative(),
    category: z.enum(['COFFEE', 'TEA']),
    note: z.string().nullable().optional(),
    items: z.array(z.object({ quantity: z.number().positive() })),
});

function recordFor(name: keyof typeof schema.shape, value: unknown) {
    return new Record(fieldsFromZod(schema, { fields: [name] }), { [name]: value });
}

describe('fieldsFromZod', () => {
    it('preserves selection order and returns ordinary immutable builders', () => {
        const fields = fieldsFromZod(schema, { fields: Object.freeze(['stock', 'name'] as const) });
        expect(Object.keys(fields)).toEqual(['stock', 'name']);
        expect(fields.stock.label('Units')).not.toBe(fields.stock);
        expect(new Record(fields, { stock: 2, name: 'Coffee' }).isValid()).toBe(true);
        expect(new Recordset(fields, [{ stock: 2, name: 'Coffee' }])).toBeDefined();
        // @ts-expect-error only selected names exist in the return type
        fields.category;
        if (false) {
            // @ts-expect-error selected builders retain their schema input types
            fields.stock.defaultValue('not a number');
            // @ts-expect-error selections are checked against schema property names
            fieldsFromZod(schema, { fields: ['missing'] });
            // @ts-expect-error the root must be an object schema
            fieldsFromZod(z.string(), { fields: ['name'] });
        }
    });

    it.each([
        ['name', 'Coffee', true],
        ['name', '', false],
        ['name', 2, false],
        ['stock', 0, true],
        ['stock', -1, false],
        ['stock', 1.5, false],
        ['stock', '2', false],
        ['stock', undefined, false],
        ['category', 'TEA', true],
        ['category', 'OTHER', false],
        ['note', undefined, true],
        ['note', null, true],
        ['note', 1, false],
        ['items', [{ quantity: 2 }], true],
        ['items', [{ quantity: 0 }], false],
    ] as const)('validates %s = %p', (name, value, expected) => {
        expect(recordFor(name, value).isValid()).toBe(expected);
    });

    it('provides enum choices and retains Zod validation after specialization', async () => {
        const fields = fieldsFromZod(schema, { fields: ['category'] });
        const record = new Record(
            { category: fields.category.label('Category') },
            { category: 'TEA' }
        );
        expect(await record.field('category').options()).toEqual([
            { value: 'COFFEE', text: 'COFFEE' },
            { value: 'TEA', text: 'TEA' },
        ]);
        expect(record.isValid('category', 'OTHER')).toBe(false);
        expect(await record.isValidAsync()).toBe(true);
    });

    it('validates refinements with sibling values and candidate substitution without mutation', () => {
        const pair = z.object({ password: z.string(), confirm: z.string() }).refine(
            function matches(values) {
                return values.password === values.confirm;
            },
            { path: ['confirm'] }
        );
        const record = new Record(fieldsFromZod(pair, { fields: ['password', 'confirm'] }), {
            password: 'secret',
            confirm: 'secret',
        });
        expect(record.isValid()).toBe(true);
        expect(record.isValid('confirm', 'other')).toBe(false);
        expect(record.values.confirm).toBe('secret');
        record.values.password = 'new';
        expect(record.isValid('confirm')).toBe(false);
    });

    it('applies root issues to each selected field and strict unknown-key errors to the record', () => {
        const root = z.strictObject({ name: z.string() }).refine(function noBad(values) {
            return values.name !== 'bad';
        });
        const record = new Record(fieldsFromZod(root, { fields: ['name'] }), { name: 'bad' });
        expect(record.isValid()).toBe(false);
        record.values.name = 'good';
        expect(record.isValid()).toBe(true);
        (record.values as any).extra = true;
        expect(record.isValid('name')).toBe(false);
    });

    it('uses Zod parsing only to validate, retaining stored values and explicit defaults', () => {
        const input = z.object({
            stock: z.coerce.number().positive(),
            name: z.string().transform(function uppercase(value) {
                return value.toUpperCase();
            }),
            note: z.string().default('default'),
        });
        const record = new Record(fieldsFromZod(input, { fields: ['stock', 'name', 'note'] }), {
            stock: '2',
            name: 'coffee',
            note: undefined,
        });
        expect(record.isValid()).toBe(true);
        expect(record.values).toEqual({ stock: '2', name: 'coffee', note: undefined });
        record.clear();
        expect(record.values.stock).not.toBe(0);
    });

    it('supports Zod Mini using shared Core schemas', () => {
        const input = mini.object({ enabled: mini.boolean(), name: mini.string() });
        const record = new Record(fieldsFromZod(input, { fields: ['enabled', 'name'] }), {
            enabled: true,
            name: 'Coffee',
        });
        expect(record.isValid()).toBe(true);
        expect(record.isValid('enabled', 'true')).toBe(false);
    });

    it('retains unions, lazy nested schemas, dates, and wrapper validation', () => {
        const input = z.object({
            choice: z.union([z.string().min(2), z.number().positive()]),
            nested: z.lazy(function nestedSchema() {
                return z.object({ count: z.number().int() });
            }),
            created: z.date().nullable(),
            enabled: z.boolean().optional(),
            note: z.string().readonly(),
        });
        const record = new Record(
            fieldsFromZod(input, {
                fields: ['choice', 'nested', 'created', 'enabled', 'note'],
            }),
            { choice: 'ok', nested: { count: 2 }, created: new Date(), enabled: false, note: 'ok' }
        );
        expect(record.isValid()).toBe(true);
        expect(record.isValid('choice', 2)).toBe(true);
        expect(record.isValid('choice', 'x')).toBe(false);
        expect(record.isValid('nested', { count: 1.5 })).toBe(false);
        expect(record.isValid('created', null)).toBe(true);
        expect(record.isValid('created', new Date('invalid'))).toBe(false);
        expect(record.isValid('created', '2026-10-19')).toBe(false);
        expect(record.isValid('enabled', undefined)).toBe(true);
        expect(record.isValid('note', 2)).toBe(false);
    });

    it('does not execute defaults during field generation or materialize parsing output', () => {
        const makeDefault = jest.fn(function makeDefault() {
            return 'from Zod';
        });
        const input = z.object({ name: z.string().default(makeDefault) });
        const fields = fieldsFromZod(input, { fields: ['name'] });
        expect(makeDefault).not.toHaveBeenCalled();
        const record = new Record(fields, { name: undefined });
        expect(makeDefault).not.toHaveBeenCalled();
        record.clear();
        expect(record.values.name).toBe('');
        record.reset();
        expect(record.values.name).toBeUndefined();
        expect(record.isValid()).toBe(true);
        expect(makeDefault).toHaveBeenCalled();
        expect(record.values.name).toBeUndefined();
    });

    it('supports asynchronous refinements through explicit async validation', async () => {
        const input = z.object({
            name: z.string().refine(async function available(value) {
                return value !== 'taken';
            }),
        });
        const fields = fieldsFromZod(input, { fields: ['name'], async: true });
        const record = new Record(fields, { name: 'free' });
        expect(await record.isValidAsync()).toBe(true);
        expect(await record.isValidAsync('name', 'taken')).toBe(false);
        expect(record.values.name).toBe('free');
        expect(function syncValidation() {
            record.isValid();
        }).toThrow(/async validators/);
        const syncRecord = new Record(fieldsFromZod(input, { fields: ['name'] }), { name: 'free' });
        expect(function missingOptIn() {
            syncRecord.isValid();
        }).toThrow(/async: true/);
    });

    it('rejects invalid roots, selections, and options with actionable errors', () => {
        expect(function invalidRoot() {
            fieldsFromZod(z.string() as any, { fields: ['name'] });
        }).toThrow(/object schema/);
        expect(function empty() {
            fieldsFromZod(schema, { fields: [] });
        }).toThrow(/nonempty/);
        expect(function duplicate() {
            fieldsFromZod(schema, { fields: ['name', 'name'] });
        }).toThrow(/distinct/);
        expect(function missing() {
            fieldsFromZod(schema, { fields: ['missing'] } as any);
        }).toThrow(/unknown field missing/);
        expect(function inherited() {
            fieldsFromZod(schema, { fields: ['toString'] } as any);
        }).toThrow(/unknown field/);
        expect(function invalidAsync() {
            fieldsFromZod(schema, { fields: ['name'], async: 'yes' } as any);
        }).toThrow(/async boolean/);
    });
});
