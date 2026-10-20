# Backend validation with Bizallele

Bizallele field definitions can validate API requests, imports, and background jobs
without rendering a form. Share domain rules between the browser and server,
then validate again on the server before saving. Import from `bizallele`;
no Lit elements or browser controls are needed for this flow.

## Define reusable rules

This example accepts a country code and a tax ID. A tax ID is required outside
the US. The custom validators also check runtime types: the `string` and
`number` primitives do not by themselves enforce JSON types or coerce input.

```js
import { Record, string } from 'bizallele';

export const accountFields = {
    country: string.required().validator({
        name: 'must be a two-letter uppercase country code',
        validate(value) {
            return typeof value === 'string' && /^[A-Z]{2}$/.test(value);
        },
    }),
    taxId: string
        .required(function (record) {
            return record.getField('country') !== 'US';
        })
        .validator({
            name: 'must be a string',
            validate(value) {
                return typeof value === 'string';
            },
        }),
};

export function validateAccount(body) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return {
            ok: false,
            errors: [{ field: null, message: 'Expected a JSON object' }],
        };
    }

    // Build a fresh, allowlisted object with every declared field present.
    // Missing required values must reach validation, even when absent in JSON.
    const values = {
        country: Object.hasOwn(body, 'country') ? body.country : undefined,
        taxId: Object.hasOwn(body, 'taxId') ? body.taxId : '',
    };
    const record = new Record(accountFields, values);
    const errors = record
        .errors()
        .flat(2)
        .map(function (error) {
            return { field: error.field, message: error.name };
        });

    return errors.length ? { ok: false, errors } : { ok: true, values };
}
```

Put this in a module such as `account-validation.mjs` and import
`validateAccount` into the request handler. It returns:

| Request body                       | Result                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `{"country":"US"}`                 | `{ ok: true, values: { country: 'US', taxId: '' } }`                                 |
| `{"country":"CA"}`                 | An `is required` error for `taxId`                                                   |
| `{}`                               | A required error and a format error for `country`, plus a required error for `taxId` |
| `{"country":42,"taxId":123}`       | Type/format errors for both fields                                                   |
| `{"country":"CA","taxId":"CA123"}` | Valid values; this example does not check tax ID format                              |

The two-letter rule checks syntax, not membership in a list of countries. Add
your own supported-country or tax ID rules for the domain. Validators accumulate;
several errors for one field are possible, and each validator must safely handle
missing values and unexpected types without relying on another validator to stop it.

## Use the result in a request handler

In an Express-style handler where JSON body parsing is already configured:

```js
import { validateAccount } from './account-validation.mjs';

export function createAccountHandler(saveAccount) {
    return async function createAccount(req, res, next) {
        try {
            const result = validateAccount(req.body);
            if (!result.ok) {
                return res.status(422).json({ errors: result.errors });
            }
            const account = await saveAccount(result.values);
            return res.status(201).json(account);
        } catch (error) {
            return next(error);
        }
    };
}
```

Supply `saveAccount` from your application. Persist only the returned values.
This example ignores extra request keys; reject them before creating the record
if your API requires a closed request schema. Do not pass an arbitrary request
body straight into `Record`: whole-record validation visits keys in the values
object, so omitted declared fields are skipped and unknown keys have no matching
definition. A fresh allowlisted object also keeps request-owned objects separate
from the mutable record values.

Bizallele error objects include the owning record and raw values. Project only the
fields your API intends to expose, as above; do not serialize the full errors.
Choose stable application error codes if clients need machine-readable contracts;
validator names are messages, not a built-in code system.

## Validate already-parsed values

By the time values reach backend domain validation, they should already be in
their model types. The backend validates those values directly; it does not run
Bizallele parsers or repeat the UI's text-to-model conversion. A value with the wrong
runtime type is a validation failure rather than an invitation to coerce it.

The `Record` constructor stores supplied values directly, which suits this
boundary. It does not run parsers, apply defaults, or reject invalid values.
`defaultValue()` does not fill missing constructor keys. The request adapter
above supplies every declared key explicitly and then validates the record.

## Await asynchronous rules

Use `errorsAsync()` or `isValidAsync()` when a validator returns a promise.
Synchronous validation throws on a promise-returning validator. An asynchronous
validator receives the same arguments as a synchronous one: model value, view
value, record, options, and field name. Return truthy for valid and falsy for
invalid. A thrown error or rejected promise propagates to the caller; handle
service failures separately from a negative validation result.

```js
import { Record, string } from 'bizallele';

export async function validateUsername(username, isAvailable) {
    const fields = {
        username: string.required().validator({
            name: 'must be an available username',
            async validate(value) {
                // Guard the lookup even when required() also reports an error.
                if (typeof value !== 'string' || value.length === 0) return false;
                return isAvailable(value);
            },
        }),
    };
    const record = new Record(fields, { username });
    return (await record.errorsAsync()).flat(2).map(function (error) {
        return { field: error.field, message: error.name };
    });
}
```

Keep async definitions on an explicit async validation path. Bound field getters
such as `valid` and change-event handling use synchronous validation; the form
adapter expects synchronous validators. For details, see
[validation and error display](./field-type.md#validation-and-error-display).

A username availability check can race with another request. Enforce uniqueness
in the database as well, and translate a constraint failure into your API's
response. Bizallele does not provide transactions or reserve a value after validation.

## Options and server authority

Records with `options()` definitions reconcile selections asynchronously and may
clear values that are absent from the latest choices. Await
`record.whenOptionsReady()` before validating or persisting such records. The
examples above have no option-backed fields, so they need no reconciliation wait.

Failed option lookups retain the value, and `whenOptionsReady()` does not reject
on a lookup failure. Reconciliation alone therefore cannot prove that a submitted
identifier exists or is authorized. Add explicit server checks or validators for
those requirements. See [selections and changing options](./record.md#selections-and-changing-options).

Disabled, read-only, and visibility settings do not authorize requests or prevent
programmatic assignments. Derive protected values from authenticated server
context and allowlist editable inputs. Your application also owns authentication,
request size limits, nested payload shape checks, database constraints, and
persistence. Use Bizallele for reusable domain validation within those boundaries.

## Share and test the same definitions

Export shared synchronous field definitions from a module with no browser or
server-only imports. Both a client form and a server validator can import that
module; keep database access and credentials in the server module. A browser
validation result is feedback for the user; re-evaluate the rules on the server.

Test the validation function directly with valid, invalid, missing, and wrongly
typed inputs, plus the domain's cross-field cases. For asynchronous checks, test
both negative results and rejected lookups. For PATCH requests, authorize and merge
changes with the current stored state before validating the complete candidate
record so cross-field rules see the full context. Save that candidate only after
validation succeeds, using your application's concurrency controls.

See [Record](./record.md) for field access and validation APIs, and
[design principles](./design-principles.md) for the model/component boundary.
