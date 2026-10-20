# OpenAPI schemas to Bizallele fields

`fieldsFromOpenAPI()` translates selected properties of an OpenAPI component
schema into ordinary, immutable Bizallele field definitions. It accepts YAML, JSON
text, or an already parsed document. No API calls, file reads, or code generation
are needed.

## Quickstart

```javascript
import { Record } from 'bizallele';
import { fieldsFromOpenAPI } from 'bizallele/openapi';

const document = `
openapi: 3.1.0
info:
  title: Products
  version: '1'
paths: {}
components:
  schemas:
    Product:
      type: object
      required: [name, stock, category]
      properties:
        name:
          type: string
          title: Product name
          minLength: 1
          maxLength: 80
        stock:
          type: integer
          minimum: 0
        category:
          type: string
          enum: [COFFEE, TEA]
`;

const fields = fieldsFromOpenAPI(document, {
    schema: 'Product',
    fields: ['name', 'stock', 'category'],
});

const product = new Record(
    {
        ...fields,
        stock: fields.stock.label('Units in stock').textAlign('right'),
        category: fields.category.label('Category'),
    },
    { name: 'Breakfast blend', stock: 12, category: 'COFFEE' }
);

product.isValid(); // true
product.isValid('stock', -1); // false: minimum is 0
product.isValid('name', ''); // false: minLength is 1
```

The returned map can also be passed to `Recordset`. You can specialize any
returned definition with normal modifiers without changing the original map.

## Arguments and result

```typescript
fieldsFromOpenAPI(source: string | object, selection: OpenAPIFieldSelection)
```

| Argument                    | Meaning                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `source`                    | OpenAPI YAML, JSON text, or a parsed document object.                                                                    |
| `selection.schema`          | Exact component name under `components.schemas`.                                                                         |
| `selection.fields`          | Nonempty list of distinct property names, in output order. Properties can be declared directly or inside composition.    |
| `selection.references`      | Optional map from document URI to supplied OpenAPI or JSON Schema documents. Values can be YAML, JSON text, or objects.  |
| `selection.validateFormats` | Optional boolean. When true, assert standard formats such as email, date, date-time, UUID, and int32. Defaults to false. |

The function remains synchronous. It compiles the schema once when creating the
field map and uses it for subsequent validation. It never fetches URLs or reads
files. The main Bizallele entry point does not load the adapter or its schema engine.

The adapter supports OpenAPI 3.0, 3.1, and 3.2 schema documents. OpenAPI 3.1/3.2
use JSON Schema draft 2020-12 semantics. The standard OpenAPI dialect and explicit
2020-12 dialect are accepted; custom dialects and Swagger 2 are not supported.

## Structured values

An object or array is one Bizallele field value. Its nested structure is preserved,
and its complete contents are validated. The adapter does not flatten nested
properties into dotted field names or automatically build nested controls.

```javascript
import { Record } from 'bizallele';
import { fieldsFromOpenAPI } from 'bizallele/openapi';

const document = {
    openapi: '3.1.0',
    components: {
        schemas: {
            Order: {
                type: 'object',
                properties: {
                    items: {
                        type: 'array',
                        minItems: 1,
                        items: {
                            type: 'object',
                            required: ['sku', 'quantity'],
                            properties: {
                                sku: { type: 'string', minLength: 1 },
                                quantity: { type: 'integer', minimum: 1 },
                            },
                            additionalProperties: false,
                        },
                    },
                },
                required: ['items'],
            },
        },
    },
};

const fields = fieldsFromOpenAPI(document, {
    schema: 'Order',
    fields: ['items'],
});
const order = new Record(fields, {
    items: [{ sku: 'COFFEE', quantity: 2 }],
});

order.isValid(); // true
order.isValid('items', [{ sku: 'COFFEE', quantity: 0 }]); // false
```

Use an application component to edit a structured field. Returning a Bizallele
definition does not prescribe a control for an object, array, or union. Scalar
string, number, and boolean definitions still use the corresponding Bizallele
primitives when their type is unambiguous. A direct scalar enum supplies options;
object-valued enums and ambiguous composition do not invent selectable choices.

## Supported validation

| Structure or keyword            | Behavior                                                                                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scalars and general type unions | Validates string, number, integer, boolean, null, object, and array values, including unions. Integers remain restricted to JavaScript's safe integer range.                 |
| `enum`, `const`                 | Structural equality, including object and array values.                                                                                                                      |
| String constraints              | Unicode code-point lengths, patterns, and optional format assertions.                                                                                                        |
| Numeric constraints             | Inclusive/exclusive bounds and exact decimal `multipleOf` checks.                                                                                                            |
| Arrays                          | `items`, `prefixItems`, `minItems`, `maxItems`, `uniqueItems`, `contains`, `minContains`, `maxContains`, and `unevaluatedItems`.                                             |
| Objects and dictionaries        | Nested properties, required properties, schema-valued or boolean `additionalProperties`, `patternProperties`, `propertyNames`, property counts, and `unevaluatedProperties`. |
| Composition                     | `allOf` requires every branch; `anyOf` requires at least one; `oneOf` requires exactly one; `not` excludes a schema. Schemas are not flattened or merged.                    |
| Conditional rules               | `if` / `then` / `else`, `dependentRequired`, and `dependentSchemas`, including rules involving sibling fields.                                                               |
| Boolean schemas                 | `true` permits any value; `false` rejects every value.                                                                                                                       |
| References                      | Local and supplied external documents, recursive data schemas, `$id`, named anchors, and draft-2020-12 dynamic references supported by the schema engine.                    |
| `$ref` siblings                 | OpenAPI 3.1/3.2 applies sibling constraints. OpenAPI 3.0 ignores Reference Object siblings according to that version's semantics.                                            |
| `discriminator`                 | Accepted as a schema-selection hint. The declared composition and branch constraints determine validity; the hint does not replace them.                                     |

JavaScript cannot represent arbitrary-precision JSON numbers. Numeric strings
are not coerced. Decimal `multipleOf` uses a number's decimal representation:
`0.3` is a multiple of `0.1`, while `0.30000000000000004` is not.

OpenAPI 3.0 nullable types and boolean exclusive bounds are normalized before
validation. The adapter does not turn nullable values into optional properties,
or extend enums with null. In 3.1/3.2, use type unions containing `null`.

Malformed schemas, missing references, unknown validation keywords, and
unsupported dialects throw during translation. Extension keys starting with
`x-` remain annotations. Referenced schemas are compiled along with the selected
schema, and component definitions are checked for schema validity.

## Sibling rules and candidate values

Each definition validates its candidate in the context of the complete record.
A conditional rule can therefore depend on a sibling field. Candidate validation
does not store the candidate or mutate any nested values.

Validation errors within a property make that field invalid. Failures of rules
on the whole object, such as a failed root `oneOf` or missing required sibling,
are shared failures and can make every selected field invalid. This preserves
the whole-schema rule rather than attributing it to an arbitrary field.

Select and supply all properties needed by the component's rules. The validator
uses the complete component schema, so leaving out an unselected but required
property can invalidate the record. Field selection controls which definitions
are returned; it does not delete constraints from the source schema.

Supply an own property for every selected field in the `Record` values object,
using `undefined` for absent optional values. The adapter omits these top-level
undefined values from the schema-validation candidate. Bizallele's whole-record
validation iterates supplied value keys; an entirely empty values object does
not trigger field validators. This adapter does not change `Record` construction
or provide a separate request-object validator.

`required` means presence, not nonempty input. The adapter does not add Bizallele's
`.required()` modifier automatically. Use `minLength: 1` or specialize the
definition with `.required()` when the application requires nonempty input.

## External documents and format assertions

Supply external resources explicitly, keyed by the URI used to resolve them:

```typescript
const fields = fieldsFromOpenAPI(document, {
    schema: 'Customer',
    fields: ['address', 'email'],
    references: {
        'address.yaml': addressDocument,
        'https://example.com/zip.json': zipSchema,
    },
    validateFormats: true,
});
```

Relative references are resolved against the containing document or schema
identifier. References in the primary document without a schema identifier use
an internal base URI; relative resource keys and relative references share that
base. External resources can themselves reference other supplied resources.
Missing resources fail without a network request. Recursive data schemas are
supported; a reference-only cycle without a structural boundary is not a usable
schema and fails compilation.

With `validateFormats: true`, the standard formats supplied by `ajv-formats`
become assertions. Unknown formats then fail compilation. Format validation is
opt-in to preserve annotation behavior for existing consumers. Dates remain
API strings; enabling format validation does not convert them to `Date` objects.

## Annotations and boundaries

`title` supplies a label. Descriptions, examples, defaults, deprecation markers,
`readOnly`, `writeOnly`, XML metadata, and extensions do not impose application
workflow or mutate values. Defaults are not applied; `clear()` retains Bizallele's
empty-string fallback and `reset()` restores initial values.

The adapter validates nested values; applications still own accessible editing
controls, request/response policies, serialization, submission, and authentication.
It selects named component schemas, not operation parameters or request bodies.
No automatic network resolution, custom schema dialects, or arbitrary-precision
numbers are provided. Schema compilation uses Ajv's runtime code generation.

The semantics follow the
[OpenAPI Schema Object](https://spec.openapis.org/oas/v3.1.1.html#schema-object)
and [JSON Schema validation](https://json-schema.org/draft/2020-12/json-schema-validation),
using [Ajv's draft-2020-12 engine](https://ajv.js.org/json-schema.html).
For database definitions, see the [Prisma adapter](./prisma.md).
For model operations, see [Record](./record.md).
