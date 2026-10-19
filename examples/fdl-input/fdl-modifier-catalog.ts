import { LitElement, css } from 'lit';
import { html, unsafeStatic } from 'lit/static-html.js';
import { exampleTheme } from './example-theme';
import { compareShirtSizesSource } from './shirt-size-example';
import { liveExamples } from './live-example-modules';
type DemoName =
    | 'cellClass'
    | 'columnClass'
    | 'compareFunction'
    | 'defaultValue'
    | 'disabled'
    | 'emptyWhen'
    | 'filter'
    | 'formatter'
    | 'hashFunction'
    | 'inputMask'
    | 'label'
    | 'maxColumnWidth'
    | 'maxLength'
    | 'minColumnWidth'
    | 'minLength'
    | 'multipleValues'
    | 'options'
    | 'placeholder'
    | 'record'
    | 'semanticType'
    | 'readOnly'
    | 'reducer'
    | 'required'
    | 'parser'
    | 'rowClass'
    | 'rowCount'
    | 'sortable'
    | 'targetColumnWidth'
    | 'template'
    | 'textAlign'
    | 'type'
    | 'validator'
    | 'visible';

type CatalogEntry = {
    name: string;
    intent: string;
    demo?: DemoName;
    limitation?: string;
    snippet?: string;
};

const customControlGap =
    'The modifier configures a richer custom control API. The cookbook uses Bizallele-backed form adapters, which do not implement that richer contract.';
const live = (
    name: string,
    intent: string,
    demo: DemoName,
    snippet?: string
): CatalogEntry => ({
    name,
    intent,
    demo,
    snippet,
});
const placeholder = (
    name: string,
    intent: string,
    limitation: string
): CatalogEntry => ({
    name,
    intent,
    limitation,
});

export const modifierEntries: CatalogEntry[] = [
    live(
        'cellClass',
        'Adds cell classes directly or computes them from the value and record.',
        'cellClass',
        `.cellClass('amount-cell').cellClass(value => value > limit ? ['high-value', 'over-limit'] : [])`
    ),
    live(
        'columnClass',
        'Applies shared classes to every part of a column.',
        'columnClass',
        `.columnClass('expense-column').columnClass(['numeric-column']).cellClass(value => value > 100 ? 'high-value' : [])`
    ),
    live(
        'compareFunction',
        'Defines how two field values are ordered.',
        'compareFunction',
        `${compareShirtSizesSource}

field
  .label('T-shirt size')
  .compareFunction(compareShirtSizes)`
    ),
    live(
        'defaultValue',
        'Defines the value Record.clear() restores for this field.',
        'defaultValue',
        `.defaultValue('Untitled document')`
    ),
    live(
        'disabled',
        'Disables editing always, or while its field setting resolves to true.',
        'disabled',
        `.disabled(record => record.getField('approvalStatus') === 'approved')`
    ),
    live(
        'emptyWhen',
        'Define when a value is considered empty.',
        'emptyWhen',
        `.emptyWhen(value => value === 'N/A')`
    ),
    live(
        'filter',
        'Makes a table column filterable and defines how text matches its values.',
        'filter',
        `.filter((text, value) => value.toLowerCase().startsWith(text.toLowerCase()))`
    ),
    live(
        'formatter',
        'Transforms a stored value for display without changing the model value.',
        'formatter',
        `.formatter(value => currency.format(Number(value)))`
    ),
    live(
        'hashFunction',
        'Defines stable identity for complex option values.',
        'hashFunction',
        `.hashFunction(employee => employee.id)`
    ),
    live(
        'inputMask',
        'Defines which individual typed characters a field accepts.',
        'inputMask',
        `.inputMask(/[0-9.]/)`
    ),
    live(
        'label',
        'Provides a static label or derives one from the current record.',
        'label',
        `.label(record => \`Amount for \${record.getField('expenseType')}\`)`
    ),
    live(
        'maxColumnWidth',
        'Sets the maximum width requested for a table column.',
        'maxColumnWidth',
        `.maxColumnWidth(180)`
    ),
    live(
        'maxLength',
        'Caps input length and adds equivalent record validation.',
        'maxLength',
        `.maxLength(12)`
    ),
    live(
        'minColumnWidth',
        'Sets the minimum width requested for a table column.',
        'minColumnWidth',
        `.minColumnWidth(110)`
    ),
    live(
        'minLength',
        'Sets a minimum input length and adds equivalent record validation.',
        'minLength',
        `.minLength(4)`
    ),
    live(
        'multipleValues',
        'Allows more than one option to be selected.',
        'multipleValues',
        `
  .multipleValues()
  .options([
    { text: 'Design', value: 'design' },
    { text: 'Engineering', value: 'engineering' },
    { text: 'Research', value: 'research' },
  ])`
    ),
    live(
        'options',
        'Supplies static or fetched choices and can refresh them from dependency fields.',
        'options',
        `.options({ fields: ['department'], fetch: record => directory[record.getField('department')] })`
    ),
    live(
        'parser',
        'Transforms an incoming display value into the stored model representation.',
        'parser',
        `.formatter(value => currency.format(Number(value)))
  .parser(value => Number(String(value).replace(/[$,]/g, '')))`
    ),
    live(
        'placeholder',
        'Shows temporary hint text while an input is empty.',
        'placeholder',
        `.placeholder('For example, Apollo migration')`
    ),
    live(
        'record',
        'Defines a structured field value with named child fields.',
        'record',
        `.record({ street: string, city: string, state: string, zip: string })`
    ),
    placeholder(
        'recordset',
        'Defines a repeated structured field value with record-shaped rows.',
        'The model records the row definitions, but the native adapter does not yet render nested recordsets as an editor or table.'
    ),
    live(
        'readOnly',
        'Renders a printed, non-editable value always or while a predicate is true.',
        'readOnly',
        `.readOnly(record => record.getField('phase') === 'submitted')`
    ),
    live(
        'reducer',
        'Aggregates a column’s values, with sum available as a built-in reducer.',
        'reducer',
        `.reducer('sum')`
    ),
    live(
        'required',
        'Requires a non-empty value always, or while its field setting resolves to true, with matching record validation.',
        'required',
        `.required()`
    ),
    live(
        'rowClass',
        'Computes CSS classes from the complete row record.',
        'rowClass',
        `.rowClass('invoice-row').rowClass(record => record.getField('status') === 'Disputed' ? ['disputed-row', 'needs-review'] : [])`
    ),
    live(
        'rowCount',
        'Deprecated: textarea sizing belongs in fdl-field rather than the field model.',
        'rowCount',
        `.rowCount(4)`
    ),
    placeholder(
        'search',
        'Enables a rich option-search dialog and describes its result columns.',
        customControlGap
    ),
    live(
        'semanticType',
        'Declares domain meaning independently of the renderer.',
        'semanticType',
        `.semanticType('address')`
    ),
    live(
        'sortable',
        'Enables or disables sorting for a table column.',
        'sortable',
        `.sortable(false)`
    ),
    live(
        'targetColumnWidth',
        'Sets the preferred width requested for a table column.',
        'targetColumnWidth',
        `.targetColumnWidth(140)`
    ),
    live(
        'template',
        'Transforms a formatted value into its final printed or table representation.',
        'template',
        `.template(value => \`Invoice #\${value}\`)`
    ),
    live(
        'textAlign',
        'Stores the preferred left, center, or right alignment for rendered values.',
        'textAlign',
        `.textAlign('right')`
    ),
    live(
        'type',
        'Sets the native input type, such as email, number, or date.',
        'type',
        `.type('date')`
    ),
    live(
        'validator',
        'Adds a named synchronous business rule to record validation.',
        'validator',
        `.validator({ name: 'must be a valid email address', validate: value => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(value)) })`
    ),
    live(
        'visible',
        'Includes the field only while every visibility predicate is true.',
        'visible',
        `.visible(record => record.getField('fulfillment') === 'ship')`
    ),
].sort((left, right) => left.name.localeCompare(right.name));

export class FdlModifierCatalog extends LitElement {
    static properties = { modifier: { type: String } };
    modifier = '';
    createRenderRoot() {
        return ['required', 'formatter', 'visible'].includes(this.modifier)
            ? this
            : super.createRenderRoot();
    }
    render() {
        const directory = liveExamples[this.modifier]?.directory;
        const tagName =
            directory === 'text-length'
                ? 'fdl-text-length'
                : directory === 'column-widths'
                  ? 'fdl-column-widths'
                  : 'fdl-live-' + this.modifier.toLowerCase();
        const tag = unsafeStatic(tagName);
        return html`<${tag}></${tag}>`;
    }
    static styles = css`
        .validator-example + .validator-example {
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #dfe3ee;
        }
        :host {
            display: block;
            container-type: inline-size;
            color: #172033;
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }
        * {
            box-sizing: border-box;
        }
        :host([modifier]) {
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
        }
        .focused fdl-table {
            --fdl-table-label-font-size: 1rem;
            --fdl-table-control-font-size: 1rem;
        }
        .focused {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 25px;
            align-items: start;
        }
        .focused.full-width {
            grid-template-columns: minmax(0, 1fr);
        }
        @container (min-width:760px) {
            .focused:not(.full-width) {
                grid-template-columns: var(
                    --example-inspector-columns,
                    minmax(0, 1.1fr) minmax(0, 1fr)
                );
            }
        }
        .focused-demo > .try:first-child {
            display: none;
        }
        .focused-demo {
            min-width: 0;
            overflow-x: auto;
        }
        .focused[data-modifier='multipleValues'] .focused-demo {
            overflow: visible;
        }
        .focused-demo fdl-field {
            --label: 0.875rem;
            --field-control-font-size: 1rem;
            --field-label-width: 100%;
            --field-control-width: 100%;
            font-size: 1.125rem;
        }
        .focused .try,
        .focused .computed {
            color: #475569;
            font-size: 1.125rem;
            line-height: 1.8;
        }
        .focused button {
            min-height: 48px;
            background: #2563eb;
            font-size: 1rem;
            font-weight: 600;
            line-height: 1.5;
        }
        summary {
            cursor: pointer;
            min-height: 44px;
            padding: 8px 0;
        }
        summary:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 3px;
        }
        .focused pre {
            padding: 0;
            border: 0;
            font: 1rem/1.7 monospace;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            max-height: 18rem;
            overflow: auto;
        }
        .limitation {
            padding: 20px;
            border-left: 3px solid #2563eb;
            background: #eff6ff;
            font-size: 1.125rem;
            line-height: 1.8;
        }
        .case-comparison {
            margin-top: 24px;
        }
        .case-comparison table,
        table.case-comparison {
            border-collapse: collapse;
            width: 100%;
            font-size: 1rem;
        }
        .case-comparison th,
        .case-comparison td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
            overflow-wrap: anywhere;
        }
        caption {
            text-align: left;
            font-weight: bold;
            padding: 8px 0;
        }
        .comparison-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
        }
        h4 {
            margin: 8px 0;
        }
        .model-assignment {
            margin-top: 12px;
        }
        .probe-result {
            display: inline-block;
            margin-right: 12px;
        }
        select {
            font: inherit;
            min-height: 44px;
            max-width: 100%;
        }
        button:focus-visible,
        select:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 3px;
        }
        p {
            margin-top: 0;
        }
        button {
            border: 0;
            border-radius: 0.45rem;
            color: white;
            cursor: pointer;
            font: inherit;
            padding: 0.65rem 0.9rem;
        }
        button:disabled {
            background: #aeb4c2;
            cursor: not-allowed;
        }
        .result {
            font-size: 1rem;
            font-weight: 700;
            margin: 0.7rem 0 0;
        }
        .result.valid {
            color: #067647;
        }
        .width-table {
            border: 2px dashed #2563eb;
            border-radius: 0.4rem;
            overflow: hidden;
        }
        code {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        ${exampleTheme}
    `;
}
customElements.define('fdl-modifier-catalog', FdlModifierCatalog);
