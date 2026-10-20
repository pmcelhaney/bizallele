# Record

A `Record` combines a map of field names and field definitions with one
object of values. Start definitions with `field` or a primitive and chain
modifiers, then pass them directly to the constructor. The record connects their
rules to values and is the model passed to Bizallele form controls.
Use `field(name)` to access the complete field-scoped facade, including its
value, parsing, formatting, options, and validation.

```js
import { Record, string } from 'bizallele';

const account = new Record(
    {
        name: string.label('Account name'),
        accountNumber: string,
    },
    {
        name: 'Checking',
        accountNumber: '92120391',
    }
);
```

`addField(name, definition, value)` uses the same conversion. The input map is
not changed. Runtime methods such as `field.required` evaluate state rather than
add modifiers.

## Working with fields

Prefer `record.field(name)` in components and other UI code. It returns a
`Field` object that owns the field's printed and raw values, parsing, formatting,
validity, options, and field behavior. For example, assigning `field.value`
parses the displayed value before storing it, while `field.rawValue` reads or
writes the stored value.

```js
const name = account.field('name');

name.value; // formatted value for display
name.rawValue; // 'Checking'
name.valid; // true or false
```

`getField()` and `setField()` remain useful for model or service code. Both
support dot-separated paths for nested values.

```js
account.setField('name', 'Savings');
account.getField('name'); // 'Savings'
```

The field facade's `value` setter parses before storing; `rawValue` writes an
already parsed value directly. Disabled and read-only state affects consumers;
it does not block programmatic assignments.

## Change events and lifecycle

Calling `setField()` dispatches a `change` `CustomEvent` with the changed field in
`event.detail.field`. `announceBlur(field)` dispatches a `blur` `CustomEvent`
with the same detail shape. Assigning the existing value still dispatches `change`; mutating
`record.values` directly does not.

```js
account.addEventListener('change', event => {
    console.log(event.detail.field);
});

account.setField('name', 'Savings');
```

`reset()` restores the initial values supplied to the constructor. `clear()`
replaces each value with its field type's default value. `hasChanged` reports
whether the current values differ from those initial values.

The constructor uses the supplied values without parsing or applying defaults.
Include an initial value for every declared field: whole-record validation
iterates keys in the values object, so an omitted field is not checked by
`isValid()`; use `record.field(fieldName).isValid()` for an explicit field check.

## Selections and changing options

Records load enabled option-backed fields on construction and after changes through
`setField()`, `setFields()`, `addField()`, `reset()`, `clear()`, or
`announceChange()`. Once the latest choices resolve, a single selection absent
from those choices is cleared to `undefined`. Multiple selections keep only
items still present in the choices, using an empty array when none remain.
Choices use their mapped `value` identities, with deep equality for object values.
Fields without options are unaffected.

Valid selections remain selected. Pending or failed lookups preserve the current
value, and obsolete responses cannot clear a value belonging to newer choices.
Clearing a selection dispatches the usual field `change` event and refreshes any
further dependent options. Disabled fields defer loading and retain their values
until enabled; enabling a field loads its current choices and reconciles its
selection. Visibility alone does not defer loading.

Reconciliation is asynchronous even for static options. Before submitting or
validating a record after a change, await all current lookups and cascading clears:

```js
record.field('zip').rawValue = '10001';
await record.whenOptionsReady();
record.field('store').rawValue; // undefined if the previous store is no longer an option
record.isValid(); // required fields still require a new selection
```

Use `record.field(name).options()` to load choices through the same disabled-state
gate as the native adapter. It returns an empty list without invoking the
provider when the field is disabled.

Use `refreshOptions()` to request reconciliation explicitly; option-provider
caching still applies. `whenOptionsReady()` waits for the latest pass and any
passes caused by dependent selections clearing. It does not reject on failed
lookups; the value is retained so a lookup failure does not erase a selection.

For a complete server-side request flow, see
[Backend validation with Bizallele](./backend-validation.md).

## Validation and display

`isValid()` checks the entire record. For field-scoped validation and display,
use the `Field` facade. Its `isValid()`, `errors()`, `readableErrors()`,
`format()`, `print()`, and `parse()` methods all operate on the bound field.
Use `errors()`, `errorCount()`, or `hasErrors()` when whole-record errors are
needed.

```js
if (!account.isValid()) {
    console.log(account.readableRecordErrors());
}

account.field('name').print();
```

Value-dependent behavior should use the bound `Field` when one is available.
For example, `field.isEmpty()`, `field.match(searchText)`,
`field.cellClasses()`, `field.textAlign()`, and `field.defaultValue()` supply
the field's raw value and owning record automatically. Each method also accepts
an explicit value when a renderer or validation flow is evaluating a candidate
value.

`field.format(value, context)` runs the formatter pipeline without applying a
template. Its default context is `"model"`. The `Field` facade exposes
`focusedInputValue` and `blurredInputValue` using `"input-focus"` and
`"input-blur"` respectively. `field.print()` formats with `"print"` and then
applies `template(...)`, so its result may be a Lit template rather than a
string. `field.value` uses that printed representation, and `field.parse(input)`
returns the parsed value without storing it.

Synchronous validation throws when it encounters a promise-returning validator.
Use `await record.field(fieldName).isValidAsync()` for one field or
`await record.isValidAsync()` for the whole record. The `Field` facade and the
built-in form adapter currently require synchronous validators; see the
validation guidance in [Binding components to Bizallele](./field-type.md#validation-and-error-display).
