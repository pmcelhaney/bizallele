# Bizallele design principles

Bizallele is a library for describing fields, records, and recordsets independently
of the components that render them. A field definition should capture reusable
meaning and behavior so forms, tables, printed output, filters, tests, and other
consumers can interpret the same definition consistently.

The larger architecture separates three concerns: business rules, UI
semantics, and visual presentation. This document defines those boundaries and
applies them to modifiers, components, and styles.

## Three orthogonal concerns

Business rules, UI semantics, and visual presentation should be independently
variable. Each layer has one kind of authority and communicates with the next
through an explicit contract.

| Layer                        | Owns                                                                            | Does not own                                                          |
| ---------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Business model and Bizallele | Validation, dependencies, parsing, formatting, comparison, and field state      | DOM structure, component selection, layout, color, and typography     |
| Component semantics          | Elements, roles, labels, accessible state, focus, keyboard behavior, and events | Business policy, themes, spacing, color, and typography               |
| Visual presentation          | Layout, color, typography, density, decoration, and animation                   | Meaning, validation rules, accessible state, and interaction behavior |

The dependency direction is:

```text
business rules -> semantic state -> accessible component -> visual theme
```

Information flows forward. Presentation must not reach backward and determine
semantics, and a component must not invent business rules because they are
convenient for one screen.

For field editing, the component boundary is one field component rather than
one custom element per native control. A consumer renders `<fdl-field>` for a
field, and that component creates the appropriate native control from the
field's metadata. Input, select, and textarea are semantic implementation
choices inside the field component; they are not separate Bizallele component APIs.
This decision is recorded in
[ADR-0002](./adr/0002-use-one-field-custom-element.md).

Orthogonal does not mean isolated. The layers cooperate through contracts:

- Bizallele exposes reusable field behavior and state;
- components translate that state into accessible structure and interaction;
- components expose semantic parts, states, attributes, and design tokens for
  styling;
- CSS responds to those hooks without becoming the source of truth.

Changing a visual treatment should not silently change meaning. Changing a
business rule should not require rewriting a component or stylesheet.

## Separate UI semantics from presentation

"Keep HTML separate from CSS" is a useful shorthand, but the deeper boundary
is meaning versus appearance. Semantic HTML, ARIA, labeling, focus management,
keyboard interaction, and event contracts belong together in the component
layer. CSS owns how that semantic structure looks.

CSS must not be the only place a state or relationship is expressed. A red
border cannot be the sole indication that a field is invalid, `display: none`
cannot decide whether a field exists in the workflow, and visual order cannot
replace a logical reading and focus order.

HTML and CSS still need deliberate integration. A component may expose parts,
classes, attributes, custom properties, or design tokens as styling hooks. The
hooks describe stable semantic states; they do not transfer ownership of those
states to the stylesheet. Some interaction patterns also require different
semantic structures, so the goal is not identical markup for every visual
treatment. The goal is to prevent presentation choices from becoming hidden
sources of meaning or behavior.

### Example: a required field

- Bizallele determines whether the field is required for the current record.
- The component expresses requiredness with the appropriate native attribute,
  label, and accessible state.
- CSS decides whether the indication is red, bold, inline, icon-based, or
  otherwise styled.

The component must not decide requiredness because it displays an asterisk.
CSS must not be the only place requiredness is communicated. Bizallele must not
prescribe a red asterisk.

### Example: choosing among values

Bizallele provides the options, value identity, and selection rules. A component
chooses an appropriate semantic interaction such as a select, radio group,
autocomplete, or command palette. The visual system controls its appearance.
Changing between those interactions should not require moving option rules or
business validation into the component.

## What a modifier is

A modifier adds one focused piece of declarative behavior to a field type and
returns a new field definition. Start definitions with `field` or a primitive;
records and recordsets prepare their runtime behavior automatically. A modifier
answers a question about the field rather than issuing instructions to a
particular component.

Good modifiers describe concepts such as:

- how a value is parsed, formatted, compared, filtered, or aggregated;
- what makes a value valid or empty;
- whether a field is required, visible, disabled, or read-only in the context
  of a record;
- how values relate to available options or other fields;
- stable presentation intent that multiple consumers can interpret, such as
  text alignment, column-width guidance, or semantic cell and column classes.

For example, `formatter(currency)`, `required(isInternational)`, and
`compareFunction(compareDates)` describe field behavior. They do not need to
know which component, framework, or HTML element will consume them.

## Properties of a good modifier

### Declarative

A modifier records what is true about a field. It should not perform rendering,
query the DOM, manage component lifecycle, or dispatch UI events.

### Reusable across consumers

The modifier should remain meaningful outside the component that motivated it.
A form and a table may interpret a modifier differently, but its intent should
survive that change of consumer.

Presentation modifiers are acceptable when they express a stable concept in
Bizallele's vocabulary. `textAlign('right')` expresses intent that HTML, a PDF
renderer, and a spreadsheet exporter could all honor. Choosing a custom-element
tag or setting one component's private property does not.

### Composable

Modifiers must preserve immutable specialization: applying one returns a new
field definition and leaves the source definition unchanged. `Record` and
`Recordset` finalize builders at their input boundaries.

When multiple applications make sense, behavior should compose predictably.
Formatters and parsers form ordered pipelines; validators accumulate;
visibility predicates all apply. When a modifier replaces a scalar value, that
replacement rule should be clear and tested.

### Enforced by the model when it is model behavior

If a modifier claims that a value is invalid, constrained, or transformed, the
Bizallele model must enforce that claim. Merely copying a browser attribute does not
make it a Bizallele validation rule. `Record#isValid()` and a rendered control should
not disagree about the same declared rule.

### Open to application behavior

Prefer callbacks and small, typed configuration objects that let applications
extend behavior without adding a modifier for every special case. This keeps
the vocabulary compact and follows the open-closed principle: new rules can be
defined without changing Bizallele itself.

### Observable and testable without a production UI

A modifier's contract should be demonstrable through `FieldType`, `Record`, or
`Recordset`, or through more than one representative consumer. Its tests should
verify behavior, immutability, and composition rather than only checking that a
property was stored.

## What a modifier is not

A modifier should not be:

- a raw HTML attribute or DOM property;
- a selector for a tag, custom element, or framework component;
- an arbitrary bag of properties forwarded to a renderer;
- a component lifecycle hook or event-handler shortcut;
- a compatibility flag for one design-system control;
- a workaround for inconsistent property names in downstream components;
- a browser constraint that is not also represented in Bizallele validation;
- imperative orchestration that mutates other fields after a UI event.

Those concerns may be necessary, but they belong at a different boundary.

| Concern                                              | Where it belongs                               |
| ---------------------------------------------------- | ---------------------------------------------- |
| Semantic elements, native attributes, focus behavior | Component or form adapter                      |
| Custom-element contracts and events                  | Component library or design-system integration |
| Derived values and cross-field updates               | Record or application model                    |
| Business validation and dependencies                 | Field type and record                          |
| Formatting, parsing, comparison, filtering           | Field type                                     |
| Screen-specific layout and visual label placement    | View and CSS                                   |

An adapter can combine a field's semantic definition with local rendering
configuration. Keeping those inputs separate allows the same `FieldType` to be
rendered by Lit today and another UI, document, or export system later.

## Reviewing a proposed modifier

Before adding a public modifier, answer these questions:

1. What field-level question does it answer?
2. Would the answer still make sense with a different renderer?
3. Can existing callbacks or configuration express the behavior already?
4. Is it model behavior, renderer behavior, or application orchestration?
5. If it describes validation or transformation, does `Record` enforce it?
6. How does it compose when inherited or applied more than once?
7. Can its behavior be tested without asserting an internal stored property?
8. Can a live example demonstrate the contract honestly?

If the proposal fails the renderer-independence test, add it to the renderer or
integration layer. If it is a one-off application rule, supply a callback to an
existing modifier. Add a new modifier only when it expands Bizallele's reusable field
language.

## Implementation requirements

When a new modifier is justified:

- return a new field definition; never mutate the source definition;
- clone and extend collection properties rather than sharing mutable arrays;
- give callbacks precise inputs for their scope: `RecordSetting` for record
  state and metadata, `ValueSetting` for candidate-value rules and cell classes, `FieldSetting`
  for context-sensitive alignment, `ColumnSetting` for column-wide settings, and
  `DefaultSetting` for record-based factories; column class callbacks need
  no arguments because they have no owning record or field value;
- document ordering, accumulation, and override behavior;
- expose behavior through `FieldType`, `Record`, or `Recordset` as appropriate;
- add focused tests for behavior, immutability, and composition;
- update public documentation, declarations, and examples together.

The goal is not to maximize the number of modifiers. It is to maintain a small,
coherent language in which Bizallele defines reusable domain behavior, components
translate that behavior into accessible interaction, and CSS supplies an
interchangeable visual expression.
