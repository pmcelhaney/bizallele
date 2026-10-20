# Form elements

> Compatibility note: `rowCount()` remains a deprecated textarea-sizing API.
> The built-in adapter chooses a select when a field provides options, a textarea
> when `rowCount()` is configured, and an input otherwise. Keep
> control selection and textarea sizing in renderer configuration for new
> integrations; keep validation and dependencies in the field model.

## Packaged Lit elements

Import a module to register its custom element:

```ts
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-record';
import 'bizallele/lit/fdl-table';
```

`fdl-field` binds a `Record` and field name to a labelled native control.
It also registers `fdl-address` for nested address records. `fdl-table`
registers both `fdl-table` and its declarative `fdl-column` children.

```ts
import { html } from 'lit';
import { field, Record } from 'bizallele';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-record';

const account = new Record({ name: field.label('Name').required() }, { name: '' });
const view = html`<fdl-record .record=${account}>
    <fdl-field field="name"></fdl-field>
</fdl-record>`;
```

`fdl-record` supplies its `.record` property to descendant `fdl-field` and
`fdl-address` elements, including through ordinary containers and component
shadow roots. Bind the JavaScript record with a Lit property binding; it is not
an HTML attribute. New children receive the current record, and replacing the
provider's record rebinds its consumers. A provider may start without a record;
its fields render once a record is supplied.

The nearest `fdl-record` defines the scope. Nested providers isolate their
children even when their own record is undefined. An explicit `.record` on a
child overrides inheritance; setting that property to `undefined` restores the
nearest provider's record. Moving a consumer to another provider rebinds it and
removing a consumer releases its subscription.

The provider renders a slot and uses `display: contents`, so it adds no visual
box or form semantics. Keep labels, fieldsets, native forms, layout, and submit
handling in the view. Keep valid HTML structure: for editable native table rows,
retain explicit bindings on fields rather than placing a custom element between
`tbody` and `tr` or between `tr` and `td`.

Custom record consumers can extend `RecordElement`, which exposes the same
reactive `record` property and inheritance lifecycle. Custom field controls
already inherit that behavior through `FormElement`.

Import `bizallele/lit` to register all packaged elements and access the
`FdlRecord`, `RecordElement`, `FdlField`, `FdlAddress`, `FdlTable`, `FdlColumn`,
and `FormElement` classes.
These modules require a browser DOM. Core model imports remain independent
of Lit element registration.

The components include default CSS. For a custom element with different styles,
extend `FormElement` from `bizallele/lit/form-element` and register your
own tag. The existing `bizallele/form-element` path remains available.

## Table pagination

`fdl-table` renders the bound recordset's current page and includes First,
Previous, Next, and Last buttons, a row range and page count, and a labelled
Rows per page selector. The controls use `Recordset.pageNumber`, `pageSize`, and
`filteredCount`; application changes to the recordset update the controls too.
No separate pagination configuration is needed on the element.

```ts
import { field, Recordset } from 'bizallele';
import 'bizallele/lit/fdl-table';

const orders = new Recordset({ name: field.label('Name') }, orderRows);
orders.setInitialPageSize(25);
const view = html`<fdl-table .recordset=${orders}>
    <fdl-column field="name"></fdl-column>
</fdl-table>`;
```

The selector offers 5, 10, 25, 50, and 100 rows, plus the current page size if the
application supplies another value. Changing page size returns to page one.
Sorting and filtering also return to page one through the recordset's existing
behavior. If deleting rows removes the current page, the table returns to the
last available page. An empty result shows `0–0 of 0 rows` and `Page 0 of 0`,
with navigation disabled. Controls are disabled while a page request is pending.

Both client-side and server-side recordsets use these controls. For server-side
paging, the fetch function must honor `page`, `startIndex`, and `pageSize` and
return `{ data, totalCount }`; see [Recordset](./recordset.md).

## Custom table cells

By default, `fdl-column` displays `record.print(field)`. Set its `renderCell`
property to a function receiving the actual row `Record` to return Lit content,
such as an editor, selection button, or calculated value:

```ts
import 'bizallele/lit/fdl-field';

const view = html`<fdl-table .recordset=${orders}>
    <fdl-column
        field="name"
        .renderCell=${record => html`<fdl-field .record=${record} field="name"></fdl-field>`}
    ></fdl-column>
</fdl-table>`;
```

The column's `field` must name a model field; it supplies default labels,
alignment, classes, and sort/filter behavior. An explicit `label` overrides the
heading. The renderer replaces only the cell content. It owns any controls and
their accessible labels; the table owns table structure, sizing, and pagination.
Rows retain their DOM identity when sorting moves the same Records, and record
updates rerender custom cells. Assigning a new renderer updates the table;
external state used by a renderer must trigger a table update or supply a new
renderer. Omit the callback to restore formatted text. See
[Edit a recordset](../examples/fdl-input/#editable-recordset) for shared table
and detail editors, calculated charges, and validation messages.

## Custom field elements

`FormElement` is the Lit base class for Bizallele field controls. Extend it when you
need a custom element that presents one field from a `Record`.

The base class owns the Bizallele integration:

- it requires a `field` name and a record supplied explicitly or by `fdl-record`;
- it resolves the bound `Field` after the first update;
- it creates a select for fields with options, a textarea when `rowCount()` is
  configured, and an input otherwise;
- it copies the field value and modifiers (`label`, `required`, `disabled`,
  `placeholder`, and so on) to that child;
- it loads `record.field(name).options()` when the field has options; and
- it listens for child events and synchronizes the value back to the record;
- it gives each instance a stable, unique control ID and associates the rendered
  label with that control; and
- when requested by the adapter, it exposes synchronous model validation through
  an error message and the control's ARIA state.

The complete ownership boundary is documented in the
[form adapter contract](./adapter-contract.md).

## Properties

| Property               | Required              | Purpose                                                                                                                                                                                                                                               |
| ---------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `field`                | Yes                   | Names the field in `record` that this instance renders.                                                                                                                                                                                               |
| `record`               | Inherited or explicit | Supplies the field definition, value, and model behavior.                                                                                                                                                                                             |
| `showValidationErrors` | No                    | When `true`, exposes current synchronous Bizallele errors in the UI and accessibility tree. Defaults to `false`, using automatic blur/submit timing. Set `true` to reveal errors explicitly. The corresponding attribute is `show-validation-errors`. |

## A unified field component

Applications should expose one field custom element and let `FormElement`
create the native control named by the field metadata. Preserve the base
stylesheet by overriding its static getter, not by assigning a static class
field:

```ts
import { css } from 'lit';
import FormElement from 'bizallele/lit/form-element';

export class FdlField extends FormElement {
    static get styles() {
        return css`
            ${FormElement.styles}

            input, select, textarea {
                border: 1px solid #9ca3af;
                border-radius: 0.25rem;
                padding: 0.5rem;
            }
        `;
    }
}

customElements.define('fdl-field', FdlField);
```

Always use that component as the outer form control and pass the field name.
Supply its record explicitly or through an enclosing `fdl-record`. Fields with options render as native selects:

```ts
import { field, Record } from 'bizallele';

const contactMethod = field.label('Preferred contact method').options([
    { text: 'Choose a method', value: '' },
    { text: 'Email', value: 'email' },
    { text: 'Phone', value: 'phone' },
]);

const record = new Record({ contactMethod }, { contactMethod: '' });
```

```ts
html`<fdl-field field="contactMethod" .record=${record}></fdl-field>`;
```

Do not create separate `<fdl-input>`, `<fdl-select>`, or `<fdl-textarea>` APIs.
Keep `<fdl-field>` stable at the call site; its adapter chooses the native
control from the field metadata.

## Labels, IDs, and read-only values

`FormElement` creates an opaque control ID for each component instance. The ID
is stable for that instance and is not the field name. Do not select controls or
encode business behavior by relying on its generated value. The visible label's
`for` attribute references that ID.

Read-only fields that do not use a custom print control render their printed
value in a semantic `<output>`. The label references the output and the output
also names the label with `aria-labelledby`. This keeps the read-only value and
its label connected without pretending the value is editable.

## Choosing when to show validation

Bizallele determines whether the current record value is valid. The Lit adapter waits
until the field loses focus before showing its errors, then keeps them current
as the user edits. An error disappears as soon as the value is valid.

When another field in the same Record loses focus, a previously valid, visible,
non-empty value that has become invalid also shows its error. Newly required
empty fields and newly visible fields wait for their own blur or a form submit.
A containing form's `submit` event reveals all errors; its `reset` event clears
the display state. Applications still own submission and resetting Record data.
See [Validation display](./adapter-contract.md#validation-display) for details.

Ordinary views need no validation-display binding:

```ts
html`<fdl-field field="contactMethod" .record=${record}></fdl-field>`;
```

Set `showValidationErrors = true` to force errors to appear, for example from a
custom submission flow without a native form. Setting it back to `false` uses
automatic timing. Call `element.resetValidation()` after resetting a Record to
clear both explicit reveal and interaction state.

Shown errors render as `.validation-error`, set `aria-invalid="true"` on the
control, and connect the two with `aria-describedby`. Hidden fields do not show
errors. Resolved errors remove only the adapter's own error-description reference,
preserving other descriptions. CSS styles these states; it does not determine
validity.

This behavior uses `record.field(name).readableErrors()`, so it covers
synchronous Bizallele validators only. The adapter also constructs a `Field` facade,
which reads synchronous validity immediately. An async validator therefore throws even
when `showValidationErrors` is false. Applications that use asynchronous
validators must await the async Record APIs directly and render their result
through an application-specific adapter. See [Current limits](./adapter-contract.md#current-limits).

## Native dropdowns

For a native `select`, `FormElement` converts the option objects returned by
`.options(...)` into `<option>` nodes. Each option should provide `text` and
`value` (or use the documented `options({ data, text, value })` mapping).
The native adapter converts option values to strings for the DOM. Use string
identities for this adapter; object-valued option identities need a compatible
custom control. Configure a single-select's empty-choice prompt on the renderer
with `select-prompt="Select a store"` (or its `selectPrompt` property). When
configured, the control adds its own empty choice; the prompt is not added to the
model's option data. An explicitly supplied empty option is still supported and takes precedence.
Use `.required()` or `.required(...)` if choosing an option is part of validation.

The adapter loads through `record.field(name).options()` and defers fetching
while the field's declared disabled state is true. Disabling during a lookup
clears the loading indicator and prevents the pending result from updating the
control. Once enabled, the field loads its current choices.

While a native single-select's options are loading, the adapter disables the
control, sets `aria-busy="true"`, and shows an inline spinner with a
“Loading choices…” status message. Once the latest lookup finishes, it restores
the field's declared disabled state. Results from an older lookup cannot replace
newer choices. Declare option dependency fields with
`options({ fields: ['zip'], fetch: loadStores })` to reuse the same lookup when
unrelated values change.

See the working example in [`examples/fdl-input`](../examples/fdl-input/) for
the unified `fdl-field`, conditional validation, and a live `Record` preview.

When a select field has `multipleValues()`, the adapter presents a checkbox
dropdown. Its summary shows the selected option or the number selected. Users
can check any combination, clear the selection, and close with Done, Escape,
or a click outside. Changes synchronize with the record as an array. Required,
validation, and disabled state are exposed on the dropdown trigger.

For native text inputs and textareas, input events update the parsed record
value without replacing the user's editing text or caret. This preserves
unfinished values such as `12.` and allows clearing a numeric field. Leaving
the field reapplies its formatted representation using `"input-focus"`, the
same context used for programmatic synchronization. It does not request
`"input-blur"`; a formatter that needs a distinct blur representation requires
an adapter that explicitly uses that context. Programmatic record changes
still synchronize the displayed value.

`multipleValues(min, max)` does not enforce selection-count bounds. Add a
model validator when the stored array must contain a particular number of
items. Native input types and browser attributes also do not add Bizallele validation
or parsers; configure those model rules explicitly.
