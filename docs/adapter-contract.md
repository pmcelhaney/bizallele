# Form adapter contract

Bizallele describes reusable field behavior without choosing a DOM structure or an
application interaction policy. A form adapter combines that model with an
accessible control. The application chooses workflow and presentation.

## Responsibilities

| Layer                                                    | Owns                                                                                                                                                                                                       | Does not own                                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Bizallele (`Record`, `Field`, `Column`, and `Recordset`) | Values, parsing, formatting, options, dependencies, requiredness, visibility, disabled and read-only state, and validation results                                                                         | DOM elements, generated IDs, focus, error-display timing, form layout, or visual styling  |
| Form adapter (`FormElement` or another renderer)         | Selecting and configuring the control, accessible labels and descriptions, semantic read-only output, translating shown model state to native and ARIA state, and sending edited values back to the Record | New business rules, submission or persistence decisions, colors, spacing, or typography   |
| Application and CSS                                      | Workflow, submission and persistence, explicit validation reveal/reset, layout, theme, and visual error treatment                                                                                          | Recomputing Bizallele validity in CSS or treating browser appearance as the business rule |

Information moves in one direction:

```text
Bizallele business state -> adapter semantics -> application presentation
```

Bizallele supplies validity independently of interaction. The Lit adapter owns default
blur and submit error-display timing and creates the accessible relationship.
Applications can explicitly reveal errors with `showValidationErrors = true`
and reset interaction state with `resetValidation()`. This UI policy stays out
of the field model.

## Native `FormElement` behavior

For the built-in Lit adapter, `field` and `record` identify the model field.
After its first update, the adapter:

1. resolves `record.field(name)`;
2. chooses a native `select` when the field provides options, a `textarea` when
   `rowCount()` is configured, and an `input` otherwise;
3. copies the formatted value and supported field state to that element;
4. creates a stable, per-instance ID and associates the visible label with it;
5. translates control events into `record.field(name).value = input` calls; and
6. refreshes the control when the Record announces a change.

Native `input`, `select`, and `textarea` elements receive their corresponding
properties. Native `select` options are created from `record.field(name).options()`.
Read-only fields use a labeled `output` unless `usesCustomPrint()` requests the
configured child control for compatibility.

Generated IDs are adapter details. They are unique and stable for the lifetime
of an instance, but callers must not parse them or use them as domain IDs.

## Validation display

The Lit adapter starts with errors hidden and applies these defaults:

- Leaving a field reveals its current errors. Moving focus between controls
  within one field does not count as leaving it.
- After reveal, errors update as values change and disappear as soon as the
  field is valid. A later invalid value is shown immediately.
- When another field in the same Record blurs, an untouched field reveals errors
  if it was valid and visible at the previous blur boundary and its existing,
  non-empty value is now invalid. A newly required empty field or newly visible
  field waits for its own blur or a submit attempt.
- A containing native form's `submit` event reveals all of its adapters' errors,
  including fields inside nested shadow roots. A prevented submit still counts
  as an attempt. Submission and persistence remain application responsibilities.
- A non-cancelled form `reset` event clears validation-display state. It does not
  reset Record values: the application still calls `record.reset()` or
  `record.clear()`. For other reset flows, call `resetValidation()` on the adapter
  after resetting the model. Rebinding an adapter to a different record or field
  also starts fresh interaction state.

`showValidationErrors` defaults to `false`; setting it to `true` additionally
forces errors to be shown. Setting it to `false` returns to automatic timing;
it does not suppress errors already revealed by interaction.

When errors are shown, the adapter:

- renders a connected, readable `.validation-error` element;
- sets `aria-invalid="true"` on the editable control or read-only output; and
- adds that error element's ID to `aria-describedby` without discarding other
  description IDs.

The adapter removes only its own error-description reference when the errors
are hidden or resolved. Visual treatment belongs to application CSS. A border,
icon, or color may reinforce the state, but it is not the source of validity.

## Custom child controls

The built-in adapter chooses among native controls from stable field metadata:
options imply a `select`, configured `rowCount()` implies a `textarea`, and
other fields use an `input`. Custom controls belong in a renderer-specific
adapter rather than in the field model.

The outer label's `for` association works directly for native labelable
elements. A custom element must implement the appropriate form-associated or
shadow-DOM accessibility behavior; receiving `label`, `id`,
`aria-invalid`, and `aria-describedby` on its host does not automatically label
an unrelated internal input.

## Current limits

- Validation display uses synchronous `record.field(name).readableErrors()`. The
  adapter constructs a `Field` facade that reads validity immediately, so an
  async validator throws even when error display is off. Use the async Record
  APIs with an application-specific adapter for async rules. The built-in
  adapter does not choose how pending validation and server errors are displayed.
- The Lit host is not a form-associated custom element and does not use
  `ElementInternals`. Native controls inside its shadow root do not by
  themselves define application submission or persistence; submit Record data
  explicitly.
- Bizallele validation is authoritative. Native constraint-validation UI may provide
  useful control behavior, but browser validity is not a substitute for
  `Record.isValid()`.
- The base adapter creates one configured child control. A multiple-value
  native select also gets a checkbox dropdown with a summary, Clear, and Done.
  Other composite controls, custom focus routing, live regions, and field-level
  error summaries require a specialized adapter.
- `multipleValues(min, max)` exposes count metadata but does not enforce those
  bounds in the model or checkbox dropdown. Add an explicit validator when
  selection counts must be constrained.
- Generated IDs are stable only for the lifetime of the component instance;
  they are not persisted across removal, recreation, or server rendering.

## Table class scopes

`columnClass` expresses shared column presentation. Resolve
`recordset.column(name).columnClasses()`
without a record or rendering context and attach the resulting classes to the
column's `<col>`, `<th>`, and each data `<td>`. Resolve once per column on each
render, including when no records are visible. A spanning empty-state cell has
no individual column and keeps its own classes.

For each data cell, combine its column classes with
`recordset.column(name).cellClasses(value, record)`. Cell callbacks receive only the current value and
owning record. Resolve `rowClasses(record)` for the containing row separately.
