/// <reference types="node" />
import { Record, string } from 'bizallele';
import { fieldsFromPrisma, PrismaFieldSelection } from 'bizallele/prisma';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const schema = `
// A comment containing model Fake { stock Int } must not create a model.
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}
model Product {
  id String @id @default(cuid())
  name String @map("product_name")
  stock Int
  rating Float
  active Boolean @default(true)
  createdAt DateTime @default(now())
  category Category
  note String?
  optionalCategory Category?
  tags String[]
  metadata Json
  owner User @relation(fields: [ownerId], references: [id])
  ownerId String
  @@unique([name, ownerId])
  @@map("products")
}
model User {
  id String @id
  products Product[]
}
enum Category {
  COFFEE @map("coffee")
  TEA
  @@map("categories")
}
`;

function recordFor(field: string, value: unknown) {
    const fields = fieldsFromPrisma(schema, { model: 'Product', fields: [field] });
    return new Record(fields, { [field]: value });
}

function validate(field: string, value: unknown) {
    return recordFor(field, value).isValid();
}

describe('fieldsFromPrisma', () => {
    it('returns only the selected model fields, in selection order', () => {
        const selection: PrismaFieldSelection = {
            model: 'Product',
            fields: Object.freeze(['stock', 'name']),
        };
        const fields = fieldsFromPrisma(schema, selection);
        expect(Object.keys(fields)).toEqual(['stock', 'name']);
        expect(new Record(fields, { stock: 0, name: '' }).isValid()).toBe(true);
        expect(fields.stock.valueOf()).toBeDefined();
        expect(fields.name).not.toBe(string);
    });

    it.each([
        ['name', 'Coffee', true],
        ['name', '', true],
        ['name', 1, false],
        ['name', null, false],
        ['name', undefined, false],
        ['stock', 0, true],
        ['stock', -1, true],
        ['stock', -2147483648, true],
        ['stock', 2147483647, true],
        ['stock', -2147483649, false],
        ['stock', 2147483648, false],
        ['stock', 1.5, false],
        ['stock', '12', false],
        ['stock', NaN, false],
        ['stock', Infinity, false],
        ['stock', null, false],
        ['rating', 1.5, true],
        ['rating', -2, true],
        ['rating', NaN, false],
        ['rating', Infinity, false],
        ['rating', '1.5', false],
        ['active', false, true],
        ['active', true, true],
        ['active', 0, false],
        ['createdAt', new Date('2026-01-01T00:00:00Z'), true],
        ['createdAt', new Date(NaN), false],
        ['createdAt', '2026-01-01', false],
        ['category', 'COFFEE', true],
        ['category', 'coffee', false],
        ['category', 'OTHER', false],
        ['category', null, false],
        ['note', null, true],
        ['note', '', true],
        ['note', 'Notes', true],
        ['note', undefined, false],
        ['note', 1, false],
        ['optionalCategory', null, true],
        ['optionalCategory', 'TEA', true],
        ['optionalCategory', 'OTHER', false],
    ])('validates %s = %p as %p', (field, value, expected) => {
        expect(validate(field as string, value)).toBe(expected);
    });

    it('applies nullability to every supported scalar type', () => {
        for (const type of ['String', 'Int', 'Float', 'Boolean', 'DateTime']) {
            const fields = fieldsFromPrisma(`model Example {\n value ${type}?\n}`, {
                model: 'Example',
                fields: ['value'],
            });
            const record = new Record(fields, { value: null });
            expect(record.isValid()).toBe(true);
            record.values.value = undefined as any;
            expect(record.isValid()).toBe(false);
        }
    });

    it('provides enum choices using Prisma member names, not database mappings', async () => {
        const record = recordFor('category', 'COFFEE');
        expect(await record.field('category').options()).toEqual([
            { text: 'COFFEE', value: 'COFFEE' },
            { text: 'TEA', value: 'TEA' },
        ]);
        await record.whenOptionsReady();
        expect(record.isValid()).toBe(true);
    });

    it('supports model checks, candidate checks, and async validation without a UI', async () => {
        const record = recordFor('stock', 12);
        expect(record.isValid('stock', 1.5)).toBe(false);
        expect(record.field('stock').errors(1.5)[0].name).toBe('must match Prisma Int');
        expect(record.isValid()).toBe(true);
        record.values.stock = 1.5;
        expect(await record.isValidAsync()).toBe(false);
    });

    it('returns definitions that can be specialized without changing their source', () => {
        const fields = fieldsFromPrisma(schema, { model: 'Product', fields: ['name'] });
        const specialized = { name: fields.name.label('Product name').required() };
        expect(new Record(fields, { name: '' }).isValid()).toBe(true);
        expect(new Record(specialized, { name: '' }).isValid()).toBe(false);
        expect(new Record(specialized, { name: 'Coffee' }).field('name').label).toBe(
            'Product name'
        );
        expect(
            new Record(fieldsFromPrisma(schema, { model: 'Product', fields: ['name'] }), {
                name: '',
            }).isValid()
        ).toBe(true);
    });

    it('does not run database defaults or inherit Bizallele primitive defaults', () => {
        const fields = fieldsFromPrisma(schema, {
            model: 'Product',
            fields: ['id', 'stock', 'active', 'createdAt', 'note'],
        });
        const record = new Record(fields, {
            id: 'existing',
            stock: 12,
            active: true,
            createdAt: new Date(),
            note: 'Note',
        });
        record.clear();
        expect(record.values).toEqual({
            id: '',
            stock: '',
            active: '',
            createdAt: '',
            note: '',
        });
        expect(record.isValid()).toBe(false);
    });

    it.each(['tags', 'metadata', 'owner'])('rejects unsupported selected field %s', field => {
        expect(() => fieldsFromPrisma(schema, { model: 'Product', fields: [field] })).toThrow(
            `Product.${field}`
        );
    });

    it.each(['BigInt', 'Decimal', 'Bytes', 'Unknown', 'Unsupported("point")'])(
        'rejects unsupported type %s',
        type => {
            expect(() =>
                fieldsFromPrisma(`model Example {\n value ${type}\n}`, {
                    model: 'Example',
                    fields: ['value'],
                })
            ).toThrow(/unsupported.*Example.value/);
        }
    );

    it.each(['@db.VarChar(30)', '@ignore', '@custom'])(
        'rejects unsupported field attribute %s',
        attribute => {
            expect(() =>
                fieldsFromPrisma(`model Example {\n value String ${attribute}\n}`, {
                    model: 'Example',
                    fields: ['value'],
                })
            ).toThrow(/unsupported attribute.*Example.value/);
        }
    );

    it('rejects unsupported model rules even when only one field is selected', () => {
        expect(() =>
            fieldsFromPrisma(`model Example {\n value Int\n @@check("value > 0")\n}`, {
                model: 'Example',
                fields: ['value'],
            })
        ).toThrow('unsupported attribute check on model Example');
    });

    it.each([
        'model Example {\n value Int\n',
        'model Example {\n value Int !\n}',
        'model Example {\n value Int\n} garbage',
    ])('rejects invalid syntax without skipping characters', source => {
        expect(() => fieldsFromPrisma(source, { model: 'Example', fields: ['value'] })).toThrow();
    });

    it.each([
        { model: 'Missing', fields: ['name'] },
        { model: 'Product', fields: ['typo'] },
        { model: 'Product', fields: ['name', 'name'] },
        { model: 'Product', fields: [] },
        { model: '', fields: ['name'] },
        { model: 'Product', fields: [''] },
        { model: 'Product', fields: [42] },
        { model: 'Product' },
        null,
    ])('rejects invalid selections %p', selection => {
        expect(() => fieldsFromPrisma(schema, selection as any)).toThrow();
    });

    it('rejects non-string input', () => {
        expect(() => fieldsFromPrisma(null as any, { model: 'Product', fields: ['name'] })).toThrow(
            TypeError
        );
    });

    it('rejects ambiguous model, field, and enum declarations', () => {
        for (const source of [
            'model Example {\n value Int\n}\nmodel Example {\n value Int\n}',
            'model Example {\n value Int\n value String\n}',
            'model Example {\n value Kind\n}\nenum Kind {\n A\n}\nenum Kind {\n B\n}',
            'model Example {\n value Kind\n}\nenum Kind {\n A\n A\n}',
        ]) {
            expect(() =>
                fieldsFromPrisma(source, { model: 'Example', fields: ['value'] })
            ).toThrow();
        }
    });

    it('treats mapped and unusual field names as own properties', () => {
        const fields = fieldsFromPrisma(
            'model Example {\n constructor String\n toString String\n}',
            {
                model: 'Example',
                fields: ['constructor', 'toString'],
            }
        );
        expect(Object.keys(fields)).toEqual(['constructor', 'toString']);
        expect(Object.prototype.hasOwnProperty.call(fields, 'toString')).toBe(true);
    });

    it('runs the documentation quickstart as written', () => {
        const documentation = readFileSync(resolve(__dirname, '../docs/prisma.md'), 'utf8');
        const example = documentation
            .match(/```javascript\n([\s\S]*?)\n```/)![1]
            .replace(/^import .*;\n/gm, '');
        const result = new Function(
            'Record',
            'fieldsFromPrisma',
            `${example}\nreturn { product, fields };`
        )(Record, fieldsFromPrisma);
        expect(result.product.isValid()).toBe(true);
        result.product.values.stock = 1.5;
        expect(result.product.isValid('stock')).toBe(false);
        expect(result.fields.name).toBeDefined();
    });
});
