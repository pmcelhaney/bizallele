# Prisma schemas to Bizallele fields

`fieldsFromPrisma()` reads Prisma schema text and returns an ordinary map of
immutable Bizallele field definitions. Use the map with `Record` or `Recordset`, then
specialize individual definitions with labels, formatting, and application rules.
The function is synchronous and needs no Prisma Client, database connection,
generator, or environment variables.

## Quickstart

```javascript
import { Record } from 'bizallele';
import { fieldsFromPrisma } from 'bizallele/prisma';

const schema = `
model Product {
  id       String   @id @default(cuid())
  name     String
  stock    Int
  category Category
}

enum Category {
  COFFEE
  TEA
}
`;

const fields = fieldsFromPrisma(schema, {
    model: 'Product',
    fields: ['name', 'stock', 'category'],
});

const product = new Record(
    {
        ...fields,
        name: fields.name.label('Product name').required(),
        stock: fields.stock.label('Units in stock').textAlign('right'),
        category: fields.category.label('Category'),
    },
    { name: 'Breakfast blend', stock: 12, category: 'COFFEE' }
);

product.isValid(); // true
product.isValid('stock', 1.5); // false: Int requires a whole number
```

The schema remains text until the adapter parses it. You can provide it from a
file read on the server or a build tool's raw-text import. The function itself
does not read files. Importing Bizallele's main entry point does not load the schema
parser; import this integration explicitly from `bizallele/prisma`.

## Arguments and result

```typescript
fieldsFromPrisma(schema: string, selection: PrismaFieldSelection)
```

`PrismaFieldSelection` is exported from `bizallele/prisma` and contains:

| Property                    | Meaning                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `model: string`             | Exact Prisma model name, such as `Product`. A schema may contain several models.       |
| `fields: readonly string[]` | Nonempty list of distinct field names to include. The returned map follows this order. |

Both selections are required. Field selection lets you leave out generated IDs,
relations, or fields this particular workflow does not use. Unsupported types on
unselected fields do not prevent translation. All selected names must exist
exactly once; misspellings and duplicates throw an error.

The result maps each selected field name to a Bizallele builder, supporting the same
immutable modifier chains as handwritten definitions. Specialization does not
change the original definitions. No Prisma metadata wrapper is passed to Bizallele:
`new Record(fields, values)` consumes the result directly.

## Translated behavior

This first version supports the classic Prisma schema syntax used by Prisma
6 and 7, including model-only snippets with their referenced enum declarations.
It uses a syntax parser, not regular-expression extraction. Comments, generator
and datasource blocks, multiline attributes, and quoted attribute arguments are
parsed without executing any expressions. It does not claim support for the
Prisma 8 contract language or perform Prisma's full semantic schema validation.

| Prisma declaration                | Bizallele behavior                                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `String`                          | Requires a JavaScript string; an empty string is valid.                                                                                 |
| `Int`                             | Requires a number that is an integer in the range −2,147,483,648 through 2,147,483,647.                                                 |
| `Float`                           | Requires a finite JavaScript number.                                                                                                    |
| `Boolean`                         | Requires `true` or `false`.                                                                                                             |
| `DateTime`                        | Requires a valid JavaScript `Date`; strings must be converted before model validation.                                                  |
| Enum field                        | Provides `{ value, text }` options and validates membership using Prisma enum member names. Database `@map` names are not input values. |
| Nullable field, such as `String?` | Accepts `null` in addition to its declared type.                                                                                        |

Type checks run through Bizallele validators, so model validation and components share
them. Providing options alone would not enforce enum membership; the adapter
adds an explicit validator as well.

Non-nullability does **not** add `.required()`: an empty string is a valid
non-null string. Add `.required()` when your application requires a nonempty
value. Numeric sign rules, email syntax, labels, visibility, formatting, and
cross-field business rules also remain application decisions.

## Complete values and defaults

These definitions validate complete selected field values. `undefined` is
invalid for every translated type, including nullable fields. Convert an empty
nullable value to `null` explicitly; the adapter does not coerce strings,
empty inputs, or other values into the declared type.

Supply every selected property in the values object, even when its value is
`null` or `undefined`. Bizallele's whole-record validation iterates the supplied value
keys; this integration does not change that behavior or validate a request's
object shape. It is not a validator for Prisma's partial update objects or
operation inputs such as `{ increment: 1 }`.

`@default(...)` is recognized but not translated or executed. The adapter also
removes Bizallele primitive defaults so `record.clear()` cannot invent `0`, `false`, or
a date for a required field: clearing yields Bizallele’s empty-string fallback for these fields. That is invalid
for numeric, boolean, date, and enum fields; an application can explicitly set
nullable fields to `null` instead. `reset()` still restores the record's initial values.
To let Prisma supply a default, leave the field out of the selection and the
write payload, or provide an application-owned value explicitly.

## Persistence constraints and unsupported declarations

The following attributes are accepted as storage metadata, with no generated
local enforcement or side effects:

- Field attributes: `@id`, `@unique`, `@default`, `@updatedAt`, and `@map`.
- Model attributes: `@@id`, `@@unique`, `@@index`, `@@fulltext`, `@@map`, and `@@schema`.
- Enum attributes: `@@map`, `@@schema`, and member `@map`.

Uniqueness, foreign-key integrity, database-generated values, and persistence
errors remain the responsibility of Prisma and the database. No availability
query, ID generation, automatic timestamp, or error mapping is implied.

Selected list fields, relation/composite fields, `Json`, `BigInt`, `Decimal`,
`Bytes`, `Unsupported(...)`, and unresolved types throw errors. Native type
attributes such as `@db.VarChar(30)` also throw, because their constraints depend
on the database provider and are not translated by this version. You can omit
such a field from the selection and define it yourself with Bizallele.

Unknown attributes, `@ignore`, `@@ignore`, and unsupported model rules such as
`@@check` throw rather than silently dropping behavior. Model attributes are
checked even when only some fields are selected. Syntax errors retain parser
diagnostics; selection and translation errors identify the model, field, or
attribute involved. This function handles a documented subset of schema facts;
it does not replace database validation.

For model operations and component binding, see [Record](./record.md) and
[Binding components to Bizallele](./field-type.md).
