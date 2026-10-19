# ADR-0001 — Retire modifiers added after the Jack Henry era

## Status

Adopted — 2026-07-30. Inventory entries record deprecated modifiers awaiting
a breaking release and modifiers already removed. This record remains the inventory of their
retirement.

## Decision

**Deprecate and remove the modifiers in the retirement inventory below. Keep
Bizallele's public modifier vocabulary limited to reusable field and record behavior,
or stable presentation intent that independent consumers can interpret. Put
browser attributes, control selection, component contracts, lifecycle behavior,
and view-specific layout in the renderer or its integration layer instead.**

When a future modifier is deprecated or removed, update this ADR in the same
change. A deprecation adds an inventory entry; a removal changes that entry's
status to `Removed` and records the release or date.

## Context

Bizallele is a language for fields, records, and recordsets, not a configuration bag
for a particular form component. Modifiers added after the original Jack Henry
work expanded `FieldType` with browser attributes, renderer-private flags,
component exceptions, and event-oriented hooks. These modifiers encode how one
control should be built or behave rather than what a field means.

That expansion conflicts with Bizallele's architecture: business rules flow to
semantic state, then to accessible components, then to visual presentation.
It also creates contracts that cannot be enforced by `FieldType`, `Record`, or
`Recordset`, are not portable to other renderers, and make the public API larger
without expanding the reusable modeling language.

## Applicable principles

- Keep business rules, UI semantics, and visual presentation orthogonal.
- Keep modifiers declarative, composable, renderer-independent, and testable
  without a production UI.
- Enforce model behavior in Bizallele rather than forwarding a browser or component
  property as a substitute for a rule.
- Prefer callbacks and compact configuration for application behavior over a
  new public modifier for each control-specific need.

See [Bizallele design principles](../design-principles.md).

## Options considered

1. Retain every modifier for backward compatibility. This preserves existing
   call sites but treats component-specific configuration as permanent Bizallele
   semantics and prolongs an incoherent API.
2. Add more generic pass-through modifiers. This would reduce naming pressure,
   but would explicitly turn `FieldType` into renderer configuration and make
   its contract even less portable.
3. Deprecate the misplaced modifiers, provide renderer- or model-level
   replacements where appropriate, and remove them in the next breaking
   release. **Chosen.**

## Consequences

Consumers must move presentation and control configuration to the renderer or
form adapter. Some former shortcuts no longer have a Bizallele-level replacement;
that is intentional when the behavior is not reusable model behavior.

The `exampleValue()` removal is immediate. Consumers must move sample generators
out of field definitions and pass a row factory as the third `ExampleRecordset`
constructor argument.

The `selectOnFocus()` removal is immediate. Consumers that need to select text
on focus must implement that interaction in their component or form adapter.
There is no replacement modifier in Bizallele.

The `toggle()` removal is immediate. Consumers must choose checkbox, switch,
or other Boolean-control presentation in their component or form adapter.
There is no replacement modifier in Bizallele.

The `tag()` removal is immediate. The built-in form adapter chooses a native
select when a field provides options, a textarea when `rowCount()` is
configured, and an input otherwise. Other renderers should make control
selection in their own adapter.

The `readOnlyWhen()` removal is immediate. Replace `readOnlyWhen(predicate)`
with `readOnly(predicate)`. `readOnly()` defaults to true and also accepts a
fixed boolean. Repeated read-only settings retain their any-true composition.

Bizallele gains a smaller, more durable public vocabulary. Its modifiers become easier
to understand, test, and render consistently in forms, tables, documents, and
other consumers. The explicit inventory makes removals auditable and prevents
future retirement work from losing historical context.

## Advice

- 2026-07-30 — Repository maintainer: align the modifier surface with the
  documented Bizallele vision and preserve a complete removal inventory in this ADR.

## Modifier retirement inventory

| Modifier                     | Status               | Replacement or destination                                               | Reason                                                                                                                               |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `accept`                     | Deprecated           | Renderer-specific input configuration                                    | Browser input attribute; not model validation.                                                                                       |
| `additionalProperties`       | Deprecated           | Renderer integration                                                     | Arbitrary renderer-property pass-through.                                                                                            |
| `autocomplete`               | Deprecated           | Renderer-specific input configuration                                    | Browser interaction hint.                                                                                                            |
| `autofocus`                  | Deprecated           | Renderer-specific input configuration                                    | Focus behavior belongs to the component.                                                                                             |
| `conditionalCellClass`       | Removed — 2026-10-15 | `cellClass((value, record) => classes)`                                  | Consolidate fixed and conditional cell classes in one modifier.                                                                      |
| `disabledWhen`               | Removed — 2026-10-15 | `disabled(predicate)`                                                    | Consolidate unconditional and conditional disabled state in one modifier.                                                            |
| `exampleValue`               | Removed — 2026-10-15 | Application/test fixtures or an explicit `ExampleRecordset` row factory  | Sample-data generation belongs to application tooling rather than reusable field behavior.                                           |
| `field`                      | Removed — 2026-10-17 | Record/renderer binding                                                  | View binding alias, not field behavior.                                                                                              |
| `filtering`                  | Removed — 2026-10-17 | Renderer-specific option-control configuration                           | Interactive option-control behavior is not reusable field behavior.                                                                  |
| `formElement`                | Removed — 2026-10-17 | Renderer integration                                                     | Component selection and private properties.                                                                                          |
| `formatOnChange`             | Deprecated           | Renderer and value pipeline                                              | Input-event formatting policy.                                                                                                       |
| `hasSearch`                  | Deprecated           | `search(config)`                                                         | Redundant shorthand for search configuration.                                                                                        |
| `hideLabel`                  | Deprecated           | Renderer                                                                 | Label visibility is presentation.                                                                                                    |
| `iconMessage`                | Removed — 2026-10-17 | Renderer                                                                 | Tooltip presentation is renderer-specific.                                                                                           |
| `inline`                     | Deprecated           | View and CSS                                                             | Layout instruction.                                                                                                                  |
| `inlineWhen`                 | Removed — 2026-10-17 | View and CSS                                                             | Conditional layout instruction.                                                                                                      |
| `list`                       | Deprecated           | Renderer-specific input configuration                                    | Browser input attribute.                                                                                                             |
| `max`                        | Deprecated           | Model validation or renderer input configuration                         | Browser constraint is not model-enforced.                                                                                            |
| `onValueChange`              | Deprecated           | Record or application model                                              | Imperative cross-field orchestration.                                                                                                |
| `parseDynamicRange`          | Deprecated           | `parser(...)`                                                            | Parsing belongs in the value pipeline.                                                                                               |
| `pattern`                    | Deprecated           | Model validation or renderer input configuration                         | Browser constraint is not model-enforced.                                                                                            |
| `readOnlyExceptionWhen`      | Deprecated           | Renderer                                                                 | Composite-control exception.                                                                                                         |
| `readOnlyWhen`               | Removed — 2026-10-16 | `readOnly(predicate)`                                                    | Consolidate unconditional and conditional read-only state in one modifier.                                                           |
| `requiredWhen`               | Removed — 2026-10-15 | `required(predicate)`                                                    | Consolidate unconditional and conditional requiredness while preserving model validation.                                            |
| `rowClasses`                 | Removed — 2026-10-15 | `rowClass(classes)`                                                      | Use a singular modifier for each declaration; strings, arrays, and functions returning either compose consistently with `cellClass`. |
| `rowCount`                   | Deprecated           | `fdl-field` presentation configuration                                   | Textarea sizing is a presentation concern rather than reusable field behavior.                                                       |
| `range`                      | Removed — 2026-10-17 | `record({ start, end })` or an application-specific composite definition | The old flag did not define a value shape or control contract; structured values use `record()`.                                     |
| `schema`                     | Removed — 2026-10-17 | `semanticType()`, `record()`, or `recordset()`                           | One property conflated domain meaning, value structure, and renderer hints; the concepts now have separate APIs.                     |
| `selectionDisabledFunctions` | Deprecated           | Renderer or form adapter                                                 | Individual choice disabling is renderer-specific and is not enforced by the Bizallele model or native controls.                      |
| `selectOnFocus`              | Removed — 2026-10-15 | Component or form adapter                                                | Focus and text selection are control interactions, not reusable field behavior.                                                      |
| `segmented`                  | Deprecated           | Renderer-specific control configuration                                  | Control presentation choice.                                                                                                         |
| `step`                       | Deprecated           | Renderer-specific input configuration                                    | Browser input attribute.                                                                                                             |
| `tag`                        | Removed — 2026-10-16 | Adapter control selection inferred from options and row-count metadata   | Renderer-specific control selection does not belong in the reusable field model.                                                     |
| `toggle`                     | Removed — 2026-10-15 | Component or form adapter                                                | Boolean-control presentation and interaction belong to the component, not the field model.                                           |
| `visibleWhen`                | Removed — 2026-10-17 | `visible(predicate)`                                                     | Use the concise name for reusable conditional visibility behavior.                                                                   |
| `usesCustomPrint`            | Deprecated           | Renderer                                                                 | Custom print behavior.                                                                                                               |

### Inventory maintenance

Do not delete rows from this table. For each future deprecation, add a row in
alphabetical order with status `Deprecated`. When the API is removed, change
that row to `Removed — <release or date>` and revise its destination if the
migration path changed.
