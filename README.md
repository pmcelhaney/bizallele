# Bizallele — Genetic code for business rules

![Bizallele logo](examples/fdl-input/public/bizallele-logo.jpg)

[![Tests](https://github.com/pmcelhaney/bizallele/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/pmcelhaney/bizallele/actions/workflows/tests.yml)
[![Type check](https://github.com/pmcelhaney/bizallele/actions/workflows/typecheck.yml/badge.svg?branch=main)](https://github.com/pmcelhaney/bizallele/actions/workflows/typecheck.yml)
[![Documentation build](https://github.com/pmcelhaney/bizallele/actions/workflows/docs-build.yml/badge.svg?branch=main)](https://github.com/pmcelhaney/bizallele/actions/workflows/docs-build.yml)

Define how your data behaves—then reuse the same rules across forms, tables,
and server-side validation. Bizallele is a JavaScript and TypeScript library
for validation, formatting, dependencies, and conditional field state.

Compose small field definitions into records and tables. Specialize them for
different contexts without changing the originals. The definitions carry the
rules; your components choose how to express them.

## Project status

Bizallele is a work in progress. **Version 1.0 is expected to ship in November 2026.**
The API and documentation may change before that release.

Previously named FDL. The package is being renamed to `@pmcelhaney/bizallele`;
publication under the new name is pending. The installation commands below
apply once that package is published. Existing `fdl-*` custom elements and
exported `Fdl*` classes keep their names.

## Installation

```sh
npm install @pmcelhaney/bizallele
```

## Try a rule without a UI

A **field definition** describes reusable rules for one value. A **Record**
binds field definitions to a set of values; a **Recordset** manages a collection
of records that share definitions.

```js
import { field, Record } from '@pmcelhaney/bizallele';

const account = new Record(
    {
        country: field.label('Country code').required(),
        taxId: field.label('Tax ID').required(record => record.getField('country') !== 'US'),
    },
    { country: 'US', taxId: '' }
);

console.log(account.isValid()); // true: a domestic account needs no Tax ID

account.setField('country', 'CA');
console.log(account.isValid()); // false
console.log(account.readableRecordErrors()); // ['Tax ID: is required']

account.setField('taxId', 'CA123456');
console.log(account.isValid()); // true
```

Changing the country changes requiredness through the field definition. This
example checks presence; a Tax ID format rule would be a separate validator.
The initial values are explicit: `defaultValue()` applies when clearing a
record, rather than filling its constructor values.

## Backend validation

Use the same field definitions to validate API requests and background jobs.
See [Backend validation with Bizallele](docs/backend-validation.md) for request
shaping, cross-field rules, safe error responses, and asynchronous validators.

## Lit elements

The package includes styled Lit elements for fields, nested addresses, and tables:

```js
import '@pmcelhaney/bizallele/lit/fdl-field';
import '@pmcelhaney/bizallele/lit/fdl-record';
import '@pmcelhaney/bizallele/lit/fdl-table';
```

Group controls with `<fdl-record .record=${record}>` and give each child
`<fdl-field field="name">` its field name. Use
`<fdl-table .recordset=${recordset}>` in Lit templates. Importing the table
module also registers `<fdl-column>`. Import `@pmcelhaney/bizallele/lit` for all
components and their classes. See [Form elements](docs/form-element.md) for
registration, properties, and custom styling.

## Build your first form

Once the renamed package is published, install it in a new application:

```sh
mkdir bizallele-first-form
cd bizallele-first-form
npm init -y
npm install @pmcelhaney/bizallele lit
npm install --save-dev vite@5.4.21 typescript@4.6.4
```

Follow [Your first form](https://patrickmcelhaney.org/FDL/#quickstart) for the
complete script, HTML entry point, adapter registration, and TypeScript setup.
Run `npx vite` in your application and open the local URL it prints. No Bizallele
checkout or local package build is needed.

The guide uses a Lit adapter. React applications can keep their existing
components and connect them to the same Bizallele model; see
[Adapter and API contracts](https://patrickmcelhaney.org/FDL/#integration)
for subscriptions, edit handling, and accessible state mapping. Your application
owns submission, server validation, routing, and persistence.

## License

[Apache License 2.0](./LICENSE)
