# Zod schemas to Bizallele fields

`fieldsFromZod()` creates ordinary, immutable Bizallele field definitions from
selected properties of a Zod 4 object schema. The original Zod schema remains
the authority for validation, including custom refinements and nested values.
Both Zod and Zod Mini are supported through their shared Core interface.

## Quickstart

Install Zod 4 alongside Bizallele (`npm install zod@^4`). Import the optional
adapter explicitly; Bizallele's main entry does not load Zod.

```javascript
import { z } from 'zod/v4';
import { Record } from 'bizallele';
import { fieldsFromZod } from 'bizallele/zod';

const schema = z.object({
    name: z.string().min(1),
    stock: z.number().int().nonnegative(),
    category: z.enum(['COFFEE', 'TEA']),
});
const fields = fieldsFromZod(schema, {
    fields: ['name', 'stock', 'category'],
});
const product = new Record(
    {
        ...fields,
        name: fields.name.label('Product name'),
        stock: fields.stock.label('Units in stock').textAlign('right'),
    },
    { name: 'Breakfast blend', stock: 12, category: 'COFFEE' }
);

product.isValid(); // true
product.isValid('stock', -1); // false
product.isValid('name', ''); // false
```

## Arguments and result

`fieldsFromZod(schema, selection)` accepts a Zod 4 **object** schema, including
object-level refinements. Root unions, intersections, lazy schemas, and schemas
wrapped in a transform are not accepted: they do not expose one object shape.
Those schemas can still be used as individual property schemas.

`selection.fields` is a required, nonempty array of distinct, existing property
names. The returned map follows that order and works with both `Record` and
`Recordset`. TypeScript checks selected names and preserves each property's Zod
input type in its builder. Zod 4 types require a modern TypeScript compiler;
this repository uses TypeScript 5.9.

`selection.async` is an optional boolean, defaulting to `false`. Set it to `true`
for asynchronous checks, then use Bizallele's asynchronous validation methods.
The adapter itself always returns the field map synchronously.

## Field behavior and validation

Unambiguous string, number, boolean, and date schemas use Bizallele's corresponding
primitives. Optional, nullable, default, and similar wrappers preserve those
hints; a pipe uses its input schema. Enum schemas provide selectable
`{ value, text }` options. Other schemas use a general field definition.
Nested objects, arrays, unions, and recursive values remain a single field value;
the adapter does not generate nested controls or flatten property paths.

All constraints are enforced by Zod during model validation. Labels, formatting,
visibility, alignment, and additional application rules remain normal Bizallele
specializations. No DOM behavior or component choice is added to the schema.

Each check validates a fresh object containing the record's current values with
the candidate substituted for the field being checked. Issues whose first path
segment names that field invalidate it; nested issues invalidate their owning
top-level field. Root issues invalidate every selected field. Errors on unrelated
fields do not invalidate a candidate. Zod messages are not copied into Bizallele's
error objects: a failed adapter rule reports `must match Zod schema field <name>`.
Exceptions thrown by application callbacks propagate.

The complete schema is evaluated, even when only some fields are selected.
Supply all sibling values needed by refinements. Zod may skip object-level
refinements when other properties fail their type checks. Selecting fields does
not pick or relax the original schema. A strict object's unknown-key check is
therefore also retained. Callbacks should be free of side effects: whole-record
validation runs the schema separately for each checked field.

Supply every selected key in the initial values, including keys whose value is
`undefined`. Bizallele's whole-record validation visits supplied value keys;
this adapter does not change that behavior. For request-level validation of
missing keys and the complete object, use Zod directly as well. See
[Backend validation](./backend-validation.md) for preparing complete records.

## Parsing, defaults, and stored values

The adapter uses Zod's parse result **only to determine validity**. Coercion,
preprocessing, transforms, defaults, and catch fallbacks retain Zod's acceptance
semantics, but their output is discarded. For example, `z.coerce.number()` may
accept a stored string without replacing it with a number. Use `schema.parse()`
or `schema.parseAsync()` explicitly when your application needs parsed output.

Zod defaults are not executed during field creation. Primitive defaults are
removed, so `record.clear()` uses Bizallele's empty-string fallback unless you
specialize a definition with an application default. `reset()` restores the
initial values. Neither method materializes Zod parsing output.

## Asynchronous rules

```javascript
const schema = z.object({
    name: z.string().refine(async function available(value) {
        return value !== 'taken';
    }),
});
const fields = fieldsFromZod(schema, { fields: ['name'], async: true });
const record = new Record(fields, { name: 'free' });
await record.isValidAsync(); // true
await record.isValidAsync('name', 'taken'); // false
```

Use `errorsAsync()` or `isValidAsync()` (including the corresponding field APIs)
for definitions created with `async: true`. Synchronous validation rejects async
validators. Without that option, encountering an asynchronous Zod check throws
an error explaining the required option and validation API.

For model operations and binding, see [Record](./record.md) and
[Binding components to Bizallele](./field-type.md).
