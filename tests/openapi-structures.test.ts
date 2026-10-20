/// <reference types="node" />
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Record } from 'bizallele';
import { fieldsFromOpenAPI } from 'bizallele/openapi';

function recordFor(schema: any, value: any, options: any = {}) {
    return new Record(
        fieldsFromOpenAPI(
            {
                openapi: '3.1.0',
                components: {
                    schemas: {
                        Model: {
                            type: 'object',
                            required: ['value'],
                            properties: { value: schema },
                        },
                    },
                },
            },
            { schema: 'Model', fields: ['value'], ...options }
        ),
        { value }
    );
}

function model(schema: any, values: any, options: any = {}) {
    return new Record(
        fieldsFromOpenAPI(
            { openapi: '3.1.0', components: { schemas: { Model: schema } } },
            { schema: 'Model', fields: Object.keys(values), ...options }
        ),
        values
    );
}

it.each([
    [{ type: 'array', items: { type: 'integer' } }, [1, 2], true],
    [{ type: 'array', items: { type: 'integer' } }, [1, '2'], false],
    [{ type: 'array', minItems: 1 }, [], false],
    [{ type: 'array', maxItems: 1 }, [1, 2], false],
    [{ type: 'array', uniqueItems: true }, [{ a: 1 }, { a: 1 }], false],
    [{ type: 'array', contains: { const: 'TEA' }, minContains: 2 }, ['TEA'], false],
    [{ type: 'array', contains: { const: 'TEA' }, minContains: 2 }, ['TEA', 'TEA'], true],
    [
        { type: 'array', prefixItems: [{ type: 'string' }, { type: 'integer' }], items: false },
        ['A', 1],
        true,
    ],
    [{ type: 'array', prefixItems: [{ type: 'string' }], items: false }, ['A', 1], false],
    [
        {
            type: 'object',
            required: ['zip'],
            properties: { zip: { type: 'string', pattern: '^\\d{5}$' } },
        },
        { zip: '28202' },
        true,
    ],
    [{ type: 'object', required: ['zip'], properties: { zip: { type: 'string' } } }, {}, false],
    [{ type: 'object', additionalProperties: { type: 'integer' } }, { a: 1, b: 2 }, true],
    [{ type: 'object', additionalProperties: { type: 'integer' } }, { a: '1' }, false],
    [
        { type: 'object', properties: { a: true }, additionalProperties: false },
        { a: 1, b: 2 },
        false,
    ],
    [{ type: 'object', minProperties: 1 }, {}, false],
    [{ type: 'object', maxProperties: 1 }, { a: 1, b: 2 }, false],
    [
        {
            type: 'object',
            patternProperties: { '^x-': { type: 'string' } },
            additionalProperties: false,
        },
        { 'x-a': 'A' },
        true,
    ],
    [{ type: 'object', propertyNames: { pattern: '^x-' } }, { a: 1 }, false],
    [{ allOf: [{ type: 'number', minimum: 0 }, { maximum: 10 }] }, 11, false],
    [{ allOf: [{ type: 'number', minimum: 0 }, { maximum: 10 }] }, 5, true],
    [{ anyOf: [{ type: 'integer' }, { type: 'string' }] }, 'A', true],
    [{ anyOf: [{ type: 'integer' }, { type: 'string' }] }, false, false],
    [{ oneOf: [{ type: 'number' }, { type: 'integer' }] }, 1, false],
    [{ oneOf: [{ type: 'number' }, { type: 'integer' }] }, 1.5, true],
    [{ not: { const: 'blocked' } }, 'blocked', false],
    [{ type: ['string', 'number', 'null'] }, null, true],
    [{ type: ['string', 'number', 'null'] }, 5, true],
    [{ type: ['string', 'number', 'null'] }, [], false],
    [true, { anything: [1, null] }, true],
    [false, 'A', false],
    [{ enum: [{ a: 1 }, [1, 2], null] }, { a: 1 }, true],
    [{ const: { a: 1 } }, { a: 1 }, true],
    [{ const: { a: 1 } }, { a: 2 }, false],
    [
        {
            type: 'object',
            allOf: [{ properties: { a: { type: 'integer' } } }],
            unevaluatedProperties: false,
        },
        { a: 1 },
        true,
    ],
    [
        {
            type: 'object',
            allOf: [{ properties: { a: { type: 'integer' } } }],
            unevaluatedProperties: false,
        },
        { a: 1, b: 2 },
        false,
    ],
])('validates structured schema %p against %p as %p', (schema, value, valid) => {
    expect(recordFor(schema, value).isValid()).toBe(valid);
});

it('validates arrays of nested objects and preserves their values', async () => {
    const data = [{ name: 'Coffee', tags: ['hot'] }];
    const record = recordFor(
        {
            type: 'array',
            items: {
                type: 'object',
                required: ['name', 'tags'],
                properties: {
                    name: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                },
                additionalProperties: false,
            },
        },
        data
    );
    expect(record.values.value).toBe(data);
    expect(await record.isValidAsync()).toBe(true);
    expect(record.isValid('value', [{ name: 'Coffee', tags: [1] }])).toBe(false);
    expect(record.values.value).toBe(data);
});

it('enforces sibling conditions against candidate values without mutating the record', () => {
    const schema = {
        type: 'object',
        properties: { country: { type: 'string' }, zip: { type: 'string' } },
        if: { properties: { country: { const: 'US' } }, required: ['country'] },
        then: { properties: { zip: { pattern: '^\\d{5}$' } }, required: ['zip'] },
        else: { properties: { zip: { minLength: 2 } } },
    };
    const record = model(schema, { country: 'CA', zip: 'AB' });
    expect(record.isValid()).toBe(true);
    expect(record.isValid('country', 'US')).toBe(false);
    expect(record.values.country).toBe('CA');
    record.values.country = 'US';
    expect(record.isValid()).toBe(false);
    expect(record.isValid('zip', '28202')).toBe(true);
});

it('enforces dependencies and shared object-wide constraints', () => {
    const schema = {
        type: 'object',
        properties: { card: { type: 'string' }, billing: { type: 'string' } },
        dependentRequired: { card: ['billing'] },
        minProperties: 1,
    };
    const record = model(schema, { card: '1234', billing: undefined });
    expect(record.isValid()).toBe(false);
    expect(record.isValid('billing', 'Address')).toBe(true);
    record.values.billing = 'Address';
    expect(record.isValid()).toBe(true);
    const dependent = model(
        { ...schema, dependentSchemas: { card: { properties: { billing: { minLength: 4 } } } } },
        { card: '1234', billing: 'A' }
    );
    expect(dependent.isValid()).toBe(false);
});

it('discovers fields declared inside composition without merging its constraints', () => {
    const record = model(
        {
            allOf: [
                { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
                { type: 'object', properties: { stock: { type: 'integer', minimum: 0 } } },
            ],
        },
        { name: 'Coffee', stock: 12 }
    );
    expect(record.isValid()).toBe(true);
    expect(record.isValid('stock', -1)).toBe(false);
});

it('validates discriminated alternatives and rejects overlapping oneOf branches', () => {
    const schema = {
        discriminator: { propertyName: 'kind' },
        oneOf: [
            {
                type: 'object',
                properties: { kind: { const: 'email' }, address: { type: 'string', minLength: 1 } },
                required: ['kind', 'address'],
            },
            {
                type: 'object',
                properties: { kind: { const: 'sms' }, phone: { type: 'string', minLength: 1 } },
                required: ['kind', 'phone'],
            },
        ],
    };
    expect(recordFor(schema, { kind: 'sms', phone: '555' }).isValid()).toBe(true);
    expect(recordFor(schema, { kind: 'sms', address: 'test' }).isValid()).toBe(false);
});

it('resolves external schemas supplied by the caller, including nested relative references', () => {
    const references = {
        'https://example.com/address.json': {
            type: 'object',
            required: ['zip'],
            properties: { zip: { $ref: './zip.json' } },
        },
        'https://example.com/zip.json': { type: 'string', pattern: '^\\d{5}$' },
    };
    expect(
        recordFor(
            { $ref: 'https://example.com/address.json' },
            { zip: '28202' },
            { references }
        ).isValid()
    ).toBe(true);
    expect(
        recordFor(
            { $ref: 'https://example.com/address.json' },
            { zip: 'bad' },
            { references }
        ).isValid()
    ).toBe(false);
    expect(() => recordFor({ $ref: 'https://example.com/address.json' }, {})).toThrow();
});

it('supports recursive schemas, $ref siblings, and named anchors', () => {
    const schema = {
        $defs: {
            node: {
                $anchor: 'node',
                type: 'object',
                properties: {
                    value: { type: 'integer' },
                    next: { anyOf: [{ $ref: '#node' }, { type: 'null' }] },
                },
                required: ['value'],
            },
            text: { type: 'string' },
        },
        type: 'object',
        properties: {
            list: { $ref: '#node' },
            name: { $ref: '#/components/schemas/Model/$defs/text', minLength: 2 },
        },
    };
    const record = new Record(
        fieldsFromOpenAPI(
            { openapi: '3.1.0', components: { schemas: { Model: schema } } },
            { schema: 'Model', fields: ['list', 'name'] }
        ),
        { list: { value: 1, next: { value: 2, next: null } }, name: 'AB' }
    );
    // The named anchor is document-scoped; nested definitions use their full local pointer.
    expect(record.isValid()).toBe(true);
    expect(record.isValid('name', 'A')).toBe(false);
    expect(record.isValid('list', { value: 'bad' })).toBe(false);
});

it('can opt into standard format assertions without changing defaults', () => {
    expect(recordFor({ type: 'string', format: 'email' }, 'bad').isValid()).toBe(true);
    expect(
        recordFor({ type: 'string', format: 'email' }, 'bad', { validateFormats: true }).isValid()
    ).toBe(false);
    expect(
        recordFor({ type: 'string', format: 'date' }, '2026-02-30', {
            validateFormats: true,
        }).isValid()
    ).toBe(false);
    expect(
        recordFor({ type: 'integer', format: 'int32' }, 2147483648, {
            validateFormats: true,
        }).isValid()
    ).toBe(false);
});

it('supports the standard dialect and OpenAPI 3.2', () => {
    const fields = fieldsFromOpenAPI(
        {
            openapi: '3.2.0',
            jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
            components: {
                schemas: {
                    Model: {
                        type: 'object',
                        properties: { value: { type: 'array', items: { type: 'integer' } } },
                    },
                },
            },
        },
        { schema: 'Model', fields: ['value'] }
    );
    expect(new Record(fields, { value: [1, 2] }).isValid()).toBe(true);
});

it('supports empty and repeated enum values according to JSON Schema validation semantics', () => {
    expect(recordFor({ enum: [] }, 'A').isValid()).toBe(false);
    expect(recordFor({ enum: ['A', 'A'] }, 'A').isValid()).toBe(true);
});

it('supports external OpenAPI component documents and schema identifiers', () => {
    const references = {
        'external.yaml': {
            openapi: '3.1.0',
            components: {
                schemas: {
                    Address: {
                        type: 'object',
                        properties: { zip: { type: 'string', minLength: 5 } },
                        required: ['zip'],
                    },
                },
            },
        },
        'identified.json': {
            $id: 'https://example.com/identified.json',
            type: 'object',
            $defs: {
                zip: { $id: 'zip.json', type: 'string', pattern: '^\\d{5}$' },
            },
            properties: { zip: { $ref: 'zip.json' } },
            required: ['zip'],
        },
    };
    expect(
        recordFor(
            { $ref: 'external.yaml#/components/schemas/Address' },
            { zip: '28202' },
            { references }
        ).isValid()
    ).toBe(true);
    expect(recordFor({ $ref: 'identified.json' }, { zip: 'bad' }, { references }).isValid()).toBe(
        false
    );
});

it('preserves shared validation while keeping unrelated fields valid', () => {
    const record = model(
        {
            type: 'object',
            properties: { name: { type: 'string', minLength: 1 }, count: { type: 'integer' } },
        },
        { name: '', count: 1 }
    );
    expect(record.isValid('name')).toBe(false);
    expect(record.isValid('count')).toBe(true);
});

it('does not mutate input schemas, literal defaults, or candidate structured values', () => {
    const schema = {
        type: 'object',
        default: { type: 'not a schema', nullable: 'literal data' },
        properties: { value: { type: 'array', items: { type: 'integer' } } },
    };
    const snapshot = JSON.stringify(schema);
    const record = model(schema, { value: [1] });
    const candidate = [2, 3];
    expect(record.isValid('value', candidate)).toBe(true);
    expect(candidate).toEqual([2, 3]);
    expect(record.values.value).toEqual([1]);
    expect(JSON.stringify(schema)).toBe(snapshot);
});

it('supports dynamic references with overridden recursive scope', () => {
    const references = {
        'https://example.com/tree': {
            $id: 'https://example.com/tree',
            $dynamicAnchor: 'node',
            type: 'object',
            properties: {
                data: true,
                children: { type: 'array', items: { $dynamicRef: '#node' } },
            },
        },
        'https://example.com/strict-tree': {
            $id: 'https://example.com/strict-tree',
            $dynamicAnchor: 'node',
            $ref: 'https://example.com/tree',
            unevaluatedProperties: false,
        },
    };
    expect(
        recordFor(
            { $ref: 'https://example.com/strict-tree' },
            { data: 1, children: [{ data: 2 }] },
            { references }
        ).isValid()
    ).toBe(true);
    expect(
        recordFor(
            { $ref: 'https://example.com/strict-tree' },
            { data: 1, children: [{ data: 2, extra: true }] },
            { references }
        ).isValid()
    ).toBe(false);
});

it('supports nullable nested values and references under OpenAPI 3.0', () => {
    const fields = fieldsFromOpenAPI(
        {
            openapi: '3.0.4',
            components: {
                schemas: {
                    Model: {
                        type: 'object',
                        properties: { value: { $ref: '#/components/schemas/Address' } },
                    },
                    Address: {
                        type: 'object',
                        nullable: true,
                        properties: {
                            code: { type: 'integer', minimum: 0, exclusiveMinimum: true },
                        },
                    },
                },
            },
        },
        { schema: 'Model', fields: ['value'] }
    );
    expect(new Record(fields, { value: null }).isValid()).toBe(true);
    expect(new Record(fields, { value: { code: 0 } }).isValid()).toBe(false);
    expect(new Record(fields, { value: { code: 1 } }).isValid()).toBe(true);
});

it('runs both documented examples', () => {
    const text = readFileSync(resolve(__dirname, '../docs/openapi.md'), 'utf8');
    const snippets = [...text.matchAll(/```javascript\n([\s\S]*?)\n```/g)];
    expect(snippets).toHaveLength(2);
    for (const snippet of snippets) {
        const code = snippet[1].replace(/^import .*;\n/gm, '');
        const record = new Function(
            'Record',
            'fieldsFromOpenAPI',
            `${code}\nreturn typeof order === 'undefined' ? product : order;`
        )(Record, fieldsFromOpenAPI);
        expect(record.isValid()).toBe(true);
    }
});

it('requires external documents only when reachable from the selected schema', () => {
    const fields = fieldsFromOpenAPI(
        {
            openapi: '3.1.0',
            components: {
                schemas: {
                    Model: { type: 'object', properties: { value: { type: 'string' } } },
                    Unused: { $ref: 'https://example.com/not-loaded.json' },
                },
            },
        },
        { schema: 'Model', fields: ['value'] }
    );
    expect(new Record(fields, { value: 'A' }).isValid()).toBe(true);
});

it('retains enum choices and primitive metadata through referenced properties', async () => {
    const fields = fieldsFromOpenAPI(
        {
            openapi: '3.1.0',
            components: {
                schemas: {
                    Model: {
                        type: 'object',
                        properties: { value: { $ref: '#/components/schemas/Choice' } },
                    },
                    Choice: { type: 'string', title: 'Drink', enum: ['TEA', 'COFFEE'] },
                },
            },
        },
        { schema: 'Model', fields: ['value'] }
    );
    const record = new Record(fields, { value: 'TEA' });
    expect(record.field('value').label).toBe('Drink');
    expect(await record.field('value').options()).toEqual([
        { value: 'TEA', text: 'TEA' },
        { value: 'COFFEE', text: 'COFFEE' },
    ]);
});

it('rejects cyclic data without confusing reused subobjects with cycles', () => {
    const cyclic: any = { name: 'A' };
    cyclic.self = cyclic;
    expect(recordFor(true, cyclic).isValid()).toBe(false);
    const shared = { name: 'A' };
    expect(recordFor(true, [shared, shared]).isValid()).toBe(true);
    expect(() => recordFor({ $async: true, type: 'string' }, 'A')).toThrow('asynchronous schemas');
});

it('does not invent enum restrictions for unconstrained alternatives', async () => {
    const record = recordFor({ anyOf: [{ type: 'string', enum: ['TEA'] }, true] }, 'OTHER');
    expect(record.isValid()).toBe(true);
    await record.whenOptionsReady();
    expect(record.values.value).toBe('OTHER');
    const conditional = model(
        {
            type: 'object',
            properties: { kind: { type: 'string' }, value: true },
            if: { properties: { kind: { const: 'limited' } } },
            then: { properties: { value: { enum: ['TEA'] } } },
        },
        { kind: 'open', value: 'OTHER' }
    );
    await conditional.whenOptionsReady();
    expect(conditional.values.value).toBe('OTHER');
    expect(conditional.isValid()).toBe(true);
});

it('selects dictionary entries through component aliases', () => {
    const fields = fieldsFromOpenAPI(
        {
            openapi: '3.1.0',
            components: {
                schemas: {
                    Model: { $ref: '#/components/schemas/Dictionary' },
                    Dictionary: { type: 'object', additionalProperties: { type: 'integer' } },
                },
            },
        },
        { schema: 'Model', fields: ['count'] }
    );
    expect(new Record(fields, { count: 1 }).isValid()).toBe(true);
    expect(new Record(fields, { count: 'one' }).isValid()).toBe(false);
});
