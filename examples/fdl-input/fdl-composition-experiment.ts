import '@pmcelhaney/bizallele/lit/fdl-record';
import { compositionView } from './composition-view';
import './fdl-code-snippet';
import { field, Record } from '@pmcelhaney/bizallele';
import './fdl-prediction';
import { learningContinuation } from './learning-continuation';
import { LitElement, css, html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { exampleTheme } from './example-theme';
import { highlightJavaScript } from './highlight-javascript';
import {
    addressCases,
    addressCase,
    compositionFields,
    compositionRecord,
    compositionRuleChanges,
    compositionExplanation,
    defaultCompositionRules,
    type CompositionRules,
} from './composition-model';
import '@pmcelhaney/bizallele/lit/fdl-field';

export class FdlCompositionExperiment extends LitElement {
    private continuation = learningContinuation(window.location.hash);
    private configuration = new Record(
        {
            visibility: field.label('Show the address').options([
                { text: 'For shipping only', value: 'shipping' },
                { text: 'For both delivery methods', value: 'all' },
            ]),
            requiredness: field.label('Require an address').options([
                { text: 'For shipping only', value: 'shipping' },
                { text: 'Always', value: 'always' },
                { text: 'Never', value: 'never' },
            ]),
            validation: field.label('Check the address format').options([
                { text: 'Street number and name', value: 'on' },
                { text: 'No format check', value: 'off' },
            ]),
        },
        { ...defaultCompositionRules }
    );
    private get rules(): CompositionRules {
        return this.configuration.values as CompositionRules;
    }
    private record = compositionRecord(
        this.rules,
        this.continuation?.method ?? 'ship',
        '42 Orchard Street'
    );
    private savedCases: {
        rules: CompositionRules;
        method: string;
        address: string;
    }[] = [];
    private caseNotice = '';
    private appliedRules = JSON.stringify(this.rules);
    private refresh = () => this.requestUpdate();
    private changeRules = () => {
        const key = JSON.stringify(this.rules);
        if (key === this.appliedRules) return;
        this.appliedRules = key;
        this.record.addField(
            'address',
            compositionFields(this.rules).address,
            this.record.getField('address')
        );
        this.requestUpdate();
    };
    connectedCallback() {
        super.connectedCallback();
        this.configuration.addEventListener('change', this.changeRules);
        this.record.addEventListener('change', this.refresh);
    }
    disconnectedCallback() {
        this.configuration.removeEventListener('change', this.changeRules);
        this.record.removeEventListener('change', this.refresh);
        super.disconnectedCallback();
    }
    private selectCase(method: string, value: string) {
        this.record.setFields({ fulfillment: method, address: value });
        this.updateComplete.then(() => {
            const heading = this.shadowRoot?.querySelector<HTMLElement>(
                '#selected-case-title'
            );
            heading?.focus({ preventScroll: true });
            heading?.scrollIntoView?.({ block: 'nearest' });
        });
    }
    private keepCase = () => {
        const sample = {
            rules: { ...this.rules },
            method: this.record.getField('fulfillment'),
            address: this.record.getField('address'),
        };
        if (
            this.savedCases.some(
                saved => JSON.stringify(saved) === JSON.stringify(sample)
            )
        )
            this.caseNotice = 'This case is already kept.';
        else if (this.savedCases.length < 6) {
            this.savedCases = [...this.savedCases, sample];
            this.caseNotice =
                'Case kept with its rules. Change a rule to compare the outcome.';
        }
        this.requestUpdate();
    };
    private reset = () => {
        this.caseNotice = '';
        this.configuration.setFields({ ...defaultCompositionRules });
        this.record.setFields({
            fulfillment: 'ship',
            address: '42 Orchard Street',
        });
    };
    private outcomes() {
        return html`<p class="scroll-hint"
                >Scroll the comparison horizontally to see all three address
                cases.</p
            ><div
                class="outcomes"
                role="region"
                aria-label="Delivery outcome comparison"
                tabindex="0"
                ><table
                    ><caption
                        >Two delivery methods × three kinds of stored
                        address</caption
                    >
                    <thead
                        ><tr
                            ><th scope="col">Delivery method</th
                            >${addressCases.map(sample => html`<th scope="col">${sample.title}<small>${sample.value || '(empty string)'}</small></th>`)}</tr
                        ></thead
                    >
                    <tbody
                        >${['ship', 'pickup'].map(
                            method =>
                                html`<tr
                                    ><th scope="row"
                                        >${method === 'ship' ? 'Shipping' : 'Pickup'}</th
                                    >${addressCases.map(sample => {
                                        const record = compositionRecord(
                                            this.rules,
                                            method,
                                            sample.value
                                        );
                                        const field = record.field('address');
                                        const selected =
                                            this.record.getField(
                                                'fulfillment'
                                            ) === method &&
                                            addressCase(
                                                this.record.getField('address')
                                            ) === sample.id;
                                        const hiddenInvalid =
                                            !field.visible && !record.isValid();
                                        return html`<td
                                            ><button
                                                class="case"
                                                data-method=${method}
                                                data-address-case=${sample.id}
                                                aria-pressed=${selected}
                                                @click=${() => this.selectCase(method, sample.value)}
                                            >
                                                <strong
                                                    >${record.isValid() ? 'Valid record' : 'Invalid record'}</strong
                                                ><span
                                                    >${field.visible ? 'Visible' : 'Hidden'}
                                                    ·
                                                    ${field.required ? 'Required' : 'Optional'}</span
                                                >${hiddenInvalid ? html`<em>Hidden, but still invalid</em>` : ''}<span
                                                    class="case-action"
                                                    >${selected ? 'Selected kind of case' : 'Inspect this case →'}</span
                                                >
                                            </button></td
                                        >`;
                                    })}</tr
                                >`
                        )}</tbody
                    ></table
                ></div
            >`;
    }
    private collectedCases() {
        if (!this.savedCases.length) return '';
        return html`<section class="collected-cases"
            ><h3>Your kept cases</h3
            ><p
                >Saved outcomes keep the rules from that moment. The last column
                applies the rules currently selected above.</p
            ><div class="outcomes"
                ><table
                    ><thead
                        ><tr
                            ><th>Case</th><th>With saved rules</th
                            ><th>With current rules</th><th>Actions</th></tr
                        ></thead
                    ><tbody
                        >${this.savedCases.map((sample, index) => {
                            const saved = compositionRecord(
                                    sample.rules,
                                    sample.method,
                                    sample.address
                                ),
                                current = compositionRecord(
                                    this.rules,
                                    sample.method,
                                    sample.address
                                );
                            const describe = (
                                record: ReturnType<typeof compositionRecord>
                            ) =>
                                `${record.field('address').visible ? 'Visible' : 'Hidden'} · ${record.field('address').required ? 'Required' : 'Optional'} · ${record.isValid() ? 'Valid' : 'Invalid'}`;
                            return html`<tr
                                ><th scope="row"
                                    >${sample.method}<small
                                        >${JSON.stringify(sample.address)}</small
                                    ></th
                                ><td>${describe(saved)}</td
                                ><td
                                    >${describe(current)}<small
                                        >${compositionRuleChanges(sample.rules, this.rules).join('; ') || 'Rules unchanged'}</small
                                    ></td
                                ><td
                                    ><button
                                        @click=${() => {
                                            this.configuration.setFields({
                                                ...sample.rules,
                                            });
                                            this.selectCase(
                                                sample.method,
                                                sample.address
                                            );
                                        }}
                                        >Restore case ${index + 1}</button
                                    ><button
                                        aria-label=${`Remove case ${index + 1}`}
                                        @click=${() => {
                                            this.savedCases =
                                                this.savedCases.filter(
                                                    (_, i) => i !== index
                                                );
                                            this.requestUpdate();
                                        }}
                                        >Remove</button
                                    ></td
                                ></tr
                            >`;
                        })}</tbody
                    ></table
                ></div
            ><button
                @click=${() => {
                    this.savedCases = [];
                    this.caseNotice = '';
                    this.requestUpdate();
                }}
                >Clear kept cases</button
            ></section
        >`;
    }
    private explanation() {
        const field = this.record.field('address');
        const method = this.record.getField('fulfillment');
        const value = this.record.getField('address');
        const visible = field.visible;
        const required = field.required;
        const explanation = compositionExplanation(this.rules, method, value);
        const errors: string[] = this.record.readableFieldErrors('address');
        return html`<div class="state" role="status"
            ><h3>Why this result?</h3
            ><ol>
                <li
                    ><strong>Visibility:</strong> ${explanation.visibility} The
                    control is ${visible ? 'visible' : 'hidden'}.</li
                >
                <li
                    ><strong>Requiredness:</strong> ${explanation.requiredness}
                    The address is ${required ? 'required' : 'optional'}.</li
                >
                <li><strong>Format:</strong> ${explanation.format}</li> </ol
            ><p class="verdict"
                ><strong
                    >${this.record.isValid() ? 'The record is valid.' : 'The record is invalid.'}</strong
                ></p
            >
            ${
                errors.length
                    ? html`<ul class="errors"
                          >${errors.map(error => html`<li>${error}</li>`)}</ul
                      >`
                    : ''
            }
            ${!visible && errors.length ? html`<p class="surprise">Hiding the control leaves the value and its validation rules in the model. Switch to shipping to edit it, or change the rules above.</p>` : ''}
            <p
                >Stored address: <code>${JSON.stringify(value)}</code>.
                Switching delivery method preserves it.</p
            >
        </div>`;
    }
    render() {
        return html`<section aria-label="Composition experiment"
            ><div class="title-row"
                ><p>Change one rule and compare all six outcomes.</p
                ><button class="reset" @click=${this.reset}
                    >Reset rules and example</button
                ></div
            >
            ${
                this.continuation
                    ? html`<section class="continuation"
                          ><h3>Your delivery continues here</h3
                          ><p
                              >You chose
                              <strong
                                  >${this.continuation.method === 'ship' ? 'Shipping' : 'Pickup'}</strong
                              >
                              and stored charge
                              <code>${this.continuation.charge}</code>. We keep
                              the delivery method and carry this charge snapshot
                              forward. Now add a shipping address.</p
                          ><p
                              >The form and six outcomes below evaluate the
                              address rules independently of the charge. This is
                              a new record using the same delivery scenario.</p
                          ></section
                      >`
                    : ''
            }
            <section class="rule-controls" aria-label="Choose the rules"
                ><h3>1. Choose the rules</h3
                ><div class="rule-workspace"
                    ><fdl-record .record=${this.configuration}
                        >${['visibility', 'requiredness', 'validation'].map(field => html`<fdl-field field=${field}></fdl-field>`)}</fdl-record
                    ></div
                ></section
            >
            <details class="prediction"
                ><summary
                    >Predict a case before inspecting it (optional)</summary
                ><fdl-prediction .rules=${{ ...this.rules }}></fdl-prediction
            ></details>
            <section aria-label="Compare all outcomes"
                ><h3>2. Compare the possibilities</h3
                ><p
                    >Each cell runs a real Bizallele record with the rules
                    above. Select a cell to inspect its exact example. When you
                    edit the form, the grid highlights the matching kind of
                    case.</p
                >${this.outcomes()}</section
            >
            <section class="selected-case" aria-labelledby="selected-case-title"
                ><h3 id="selected-case-title" tabindex="-1"
                    >3. Inspect the selected case</h3
                ><div class="case-workspace"
                    ><div class="editor">
                        ${keyed(this.record.field('address'), html`${compositionView(this.record)}`)}
                        <p
                            >Try your own address. The number check is an
                            illustrative format rule, not proof that an address
                            exists or accepts deliveries.</p
                        > </div
                    >${this.explanation()}</div
                ><button
                    class="keep-case"
                    ?disabled=${this.savedCases.length >= 6}
                    @click=${this.keepCase}
                    >Keep this case</button
                ><p class="case-notice" role="status"
                    >${this.caseNotice || 'Keep up to six cases to compare your own counterexamples.'}</p
                ></section
            >
            ${this.collectedCases()}
            <details class="questions"
                ><summary>Questions to investigate</summary
                ><ul
                    ><li
                        >Does hiding a field make it optional? Choose Always
                        under requiredness, then inspect Pickup × Empty.</li
                    ><li
                        >Does optional mean any value is allowed? Choose Never
                        under requiredness and inspect an address without a
                        number.</li
                    ><li
                        >Which rule would you change to get the behavior you
                        intended? Compare switching off the format check with
                        showing the field for both delivery methods.</li
                    ></ul
                ></details
            >
        </section>`;
    }
    static styles = css`
        .collected-cases td small {
            display: block;
            margin-top: 6px;
            color: #475569;
        }
        :host {
            display: block;
            line-height: 1.65;
            color: #0f172a;
        }
        * {
            box-sizing: border-box;
        }
        h2 {
            margin: 0;
            font-size: 1.5rem;
            line-height: 1.3;
        }
        h3 {
            font-size: 1.125rem;
            margin: 0 0 16px;
            line-height: 1.4;
        }
        p {
            margin: 0 0 20px;
        }
        section + section {
            margin-top: 28px;
        }
        .title-row {
            display: flex;
            align-items: start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
        }
        button {
            font: inherit;
            cursor: pointer;
            min-height: 48px;
        }
        .reset {
            flex-shrink: 0;
            border: 1px solid #cbd5e1;
            background: white;
            color: #1d4ed8;
            padding: 8px 12px;
        }
        .rule-workspace {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
            margin: 0;
            align-items: start;
        }
        .case-workspace {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
            gap: 20px;
            margin: 24px 0;
            align-items: start;
        }
        .definition,
        .editor {
            border: 1px solid var(--example-border);
            border-radius: var(--example-radius);
            padding: 20px;
            min-width: 0;
        }
        .rule-controls fdl-field {
            margin-bottom: 0;
        }
        .definition {
            margin-top: 0;
        }
        fdl-field {
            --field-label-width: 100%;
            --field-control-width: 100%;
        }
        pre {
            margin: 0 0 16px;
            padding: 16px;
            background: #0f172a;
            color: #e2e8f0;
            overflow: auto;
            font: 0.875rem/1.65 monospace;
            border-radius: 6px;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
        }
        .definition p,
        .editor p {
            font-size: 0.875rem;
            color: #475569;
            margin-bottom: 0;
        }
        .scroll-hint {
            display: none;
            font-size: 0.875rem;
            color: #475569;
        }
        .outcomes {
            overflow-x: auto;
        }
        table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
            table-layout: fixed;
            font-size: 0.875rem;
        }
        caption {
            text-align: left;
            font-weight: 600;
            padding: 0 0 12px;
            color: #475569;
        }
        th {
            padding: 12px 8px;
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
        }
        th:first-child {
            width: 100px;
            position: sticky;
            left: 0;
            background: white;
            z-index: 1;
        }
        th small {
            display: block;
            margin-top: 8px;
            font-weight: 400;
            line-height: 1.5;
            color: #64748b;
        }
        td {
            vertical-align: top;
            padding: 4px;
            height: 1px;
        }
        .case {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
            min-height: 152px;
            height: 100%;
            padding: 12px;
            text-align: left;
            border: 1px solid var(--example-border);
            background: white;
            font-size: 0.875rem;
            line-height: 1.5;
            overflow-wrap: anywhere;
        }
        .case:hover {
            border-color: #2563eb;
        }
        .case[aria-pressed='true'] {
            border: 2px solid #2563eb;
            padding: 11px;
            background: #eff6ff;
        }
        .case-action {
            margin-top: auto;
            color: #1d4ed8;
        }
        .case em {
            color: #9a3412;
            font-style: normal;
        }
        .state ol {
            margin: 0;
            padding-left: 20px;
            font-size: 1rem;
        }
        .state li {
            margin-bottom: 12px;
        }
        .state p {
            font-size: 1rem;
        }
        .state p:last-child {
            margin-bottom: 0;
        }
        .verdict {
            margin: 20px 0 12px;
        }
        .errors {
            color: #9f2920;
            padding-left: 20px;
        }
        .surprise {
            padding-top: 12px;
            border-top: 1px solid var(--example-border);
        }
        .keep-case,
        .collected-cases button {
            border: 1px solid #94a3b8;
            border-radius: 4px;
            padding: 8px 12px;
            background: white;
            color: #1d4ed8;
            margin: 4px;
        }
        .collected-cases td {
            padding: 12px 8px;
            height: auto;
            font-size: 0.875rem;
        }
        .case-notice {
            font-size: 0.875rem;
            color: #475569;
            margin: 8px 0 0;
        }
        .continuation {
            padding: 16px;
            margin-bottom: 20px;
            border-left: 3px solid #2563eb;
            background: #eff6ff;
        }
        .continuation p:last-child {
            margin: 0;
        }
        .questions {
            border-top: 1px solid var(--example-border);
            padding-top: 12px;
        }
        summary {
            cursor: pointer;
            min-height: 44px;
            padding: 8px 0;
        }
        button:focus-visible,
        summary:focus-visible,
        .outcomes:focus-visible,
        #selected-case-title:focus {
            outline: 3px solid #2563eb;
            outline-offset: 3px;
        }
        #selected-case-title {
            scroll-margin-top: 20px;
        }
        .syntax-string,
        .syntax-regex {
            color: #a7f3d0;
        }
        .syntax-keyword {
            color: #c4b5fd;
        }
        .syntax-builtin {
            color: #7dd3fc;
        }
        .syntax-number {
            color: #fdba74;
        }
        @media (max-width: 1100px) {
            .case-workspace {
                grid-template-columns: 1fr;
            }
        }
        @media (max-width: 700px) {
            .rule-workspace {
                grid-template-columns: 1fr;
            }
            .title-row {
                flex-direction: column;
            }
            .definition,
            .editor {
                padding: 16px;
            }
            table {
                min-width: 560px;
            }
            .scroll-hint {
                display: block;
            }
        }
        ${exampleTheme}
    `;
}
customElements.define('fdl-composition-experiment', FdlCompositionExperiment);
