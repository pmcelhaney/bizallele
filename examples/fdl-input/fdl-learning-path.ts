import {
    learningFields,
    createLearningRecord,
    createLearningTable,
} from './learning-model';
import { learningView, learningTableView } from './learning-view';
import './fdl-code-snippet';
import { field, Record, Recordset } from '@pmcelhaney/bizallele';
import './fdl-transfer-challenge';
import { compositionLink } from './learning-continuation';
import { exampleTheme } from './example-theme';
import { LitElement, css, html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { recordSummary } from './model-summary';
import { highlightJavaScript } from './highlight-javascript';
import '@pmcelhaney/bizallele/lit/fdl-field';
import '@pmcelhaney/bizallele/lit/fdl-table';
import './fdl-recordset-inspector';

const lessons = [
    {
        question: 'What does a field store?',
        explanation:
            'Start with one delivery charge. Without a parser, the text you enter is the stored value.',
        reference: 'type',
        rule: 'A field connects an input to a stored value.',
    },
    {
        question: 'How does text become a number?',
        explanation:
            'Add a currency parser and formatter. Try $1,234.50. The model now stores a number; printed output adds currency punctuation.',
        reference: 'parser',
        rule: 'Parsing converts currency text to a number; formatting produces display text.',
    },
    {
        question: 'What makes a value valid?',
        explanation:
            'Add requiredness and a non-negative, finite-number validator. Try -1 or clear the charge. Parsing does not establish validity.',
        reference: 'validator',
        rule: 'The record checks requiredness and the charge validator.',
    },
    {
        question: 'What changes when another field changes?',
        explanation:
            'Make the charge visible and required only for shipping. Choose pickup: the charge is preserved and becomes optional. Its number validator remains independent of visibility.',
        reference: 'required',
        rule: 'Delivery method determines visibility and requiredness independently.',
    },
    {
        question: 'How do the rules work across records?',
        explanation:
            'Reuse the same definitions for a table of deliveries. Edit the current delivery above; its table row updates. Other rows show the same rules applied to different values.',
        reference: 'reference/docs/recordset',
        referenceLabel: 'Explore the Recordset API',
        rule: 'A Recordset reuses the field definitions for multiple records.',
    },
];
const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export type LearningState = {
    step: number;
    values: { method: string; charge: any };
};
export class FdlLearningPath extends LitElement {
    static properties = { session: { attribute: false } };
    session?: LearningState;
    private step = 0;
    private definitions() {
        return learningFields(this.step);
    }
    private record = createLearningRecord();
    private table = createLearningTable(this.step);
    private refresh = () => {
        this.updateTable();
        this.requestUpdate();
    };
    private updateTable() {
        this.table.setData([
            { ...this.record.values },
            { method: 'ship', charge: 12 },
            { method: 'pickup', charge: undefined },
        ]);
    }
    connectedCallback() {
        if (this.session) {
            this.step = this.session.step;
            this.record = createLearningRecord(this.step, {
                ...this.session.values,
            });
            this.table = createLearningTable(this.step);
        }
        super.connectedCallback();
        this.record.addEventListener('change', this.refresh);
        this.updateTable();
    }
    disconnectedCallback() {
        if (this.session) {
            this.session.step = this.step;
            this.session.values = {
                ...this.record.values,
            } as LearningState['values'];
        }
        this.record.removeEventListener('change', this.refresh);
        super.disconnectedCallback();
    }
    private go(step: number) {
        if (step < 0 || step >= lessons.length || step === this.step) return;
        const oldStep = this.step;
        this.step = step;
        const fields = this.definitions();
        const value = this.record.getField('charge');
        const nextValue =
            step === 0
                ? String(value ?? '')
                : oldStep === 0
                  ? fields.charge.valueOf().parse(value)
                  : value;
        this.record.addField('charge', fields.charge, nextValue);
        this.table = createLearningTable(this.step);
        this.updateTable();
        this.requestUpdate();
        this.updateComplete.then(() =>
            this.shadowRoot
                ?.querySelector<HTMLElement>('#lesson-title')
                ?.focus({ preventScroll: true })
        );
    }
    private reset = () => {
        this.record.setFields({
            method: 'ship',
            charge: this.step === 0 ? '$25.00' : 25,
        });
        this.requestUpdate();
    };

    render() {
        const lesson = lessons[this.step];
        return html`<div class="lesson-toolbar"
                ><label
                    >Learning question<select
                        aria-label="Learning question"
                        .value=${String(this.step)}
                        @change=${(event: Event) => this.go(Number((event.target as HTMLSelectElement).value))}
                        >${lessons.map((item, index) => html`<option value=${index} ?selected=${this.step === index}>${index + 1} of ${lessons.length}: ${item.question}</option>`)}</select
                    ></label
                ><button class="reset-lesson" @click=${this.reset}
                    >Reset this example</button
                ></div
            >
            <section aria-labelledby="lesson-title"
                ><p class="continuity"
                    >Your entered value carries forward between questions. Reset
                    restores this question’s starting values.</p
                ><h2 id="lesson-title" tabindex="-1">${lesson.question}</h2
                ><p>${lesson.explanation}</p>
                <div class="lesson-grid"
                    ><div class="lesson-controls"
                        >${keyed(this.record.field('charge'), learningView(this.record, this.step))}</div
                    ><div class="lesson-state" role="status"
                        >${recordSummary(this.record, this.step >= 3 ? ['method', 'charge'] : ['charge'])}</div
                    ></div
                >
                ${
                    this.step >= 4
                        ? html`<h3
                                  >Current delivery, another shipment, and a
                                  pickup</h3
                              ><p
                                  >The table reuses these definitions over
                                  separate records. Its first row is a refreshed
                                  snapshot of the form, rather than the same
                                  record object.</p
                              >${learningTableView(this.table)}
                              <fdl-recordset-inspector
                                  .recordset=${this.table}
                              ></fdl-recordset-inspector>`
                        : ''
                }
                <details open
                    ><summary>Rules built so far</summary
                    ><ol
                        >${lessons.slice(0, this.step + 1).map(item => html`<li>${item.rule}</li>`)}</ol
                    ></details
                >
                <p
                    ><a href=${`#${lesson.reference}`}
                        >${lesson.referenceLabel ?? `Explore ${lesson.reference} in the modifier reference`}</a
                    ></p
                >
                ${
                    this.step === lessons.length - 1
                        ? html`<section class="capabilities"
                                  ><h3>Check what you can now do</h3
                                  ><ul
                                      ><li
                                          ><a href="#parser"
                                              >Predict stored numbers versus
                                              display text</a
                                          >
                                          by editing a currency value.</li
                                      ><li
                                          ><a href="#composition"
                                              >Explain why a hidden field can
                                              remain invalid</a
                                          >
                                          by changing one independent rule.</li
                                      ><li
                                          ><a href="#how-it-works"
                                              >Reuse definitions across a form
                                              and table</a
                                          >
                                          while distinguishing shared rules from
                                          shared record identity.</li
                                      ></ul
                                  ></section
                              ><details class="transfer-challenge"
                                  ><summary
                                      >Optional challenge: model a cancellation
                                      request</summary
                                  ><fdl-transfer-challenge></fdl-transfer-challenge></details
                              ><p
                                  ><a
                                      class="continue-delivery"
                                      href=${compositionLink(this.record.values)}
                                      >Next: combine the rules and investigate
                                      their outcomes →</a
                                  ></p
                              >`
                        : ''
                }
                <div class="lesson-navigation"
                    ><button
                        class="previous-lesson"
                        ?disabled=${this.step === 0}
                        @click=${() => this.go(this.step - 1)}
                        >Previous question</button
                    ><button
                        class="next-lesson"
                        ?disabled=${this.step === lessons.length - 1}
                        @click=${() => this.go(this.step + 1)}
                        >Next question</button
                    ></div
                >
            </section>`;
    }
    static styles = css`
        :host {
            display: block;
            line-height: 1.65;
        }
        button {
            font: inherit;
            cursor: pointer;
            min-height: 48px;
            padding: 10px 16px;
            border: 1px solid #cbd5e1;
            background: white;
            color: #1d4ed8;
        }
        button:focus-visible,
        a:focus-visible,
        summary:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 3px;
        }
        button:disabled {
            opacity: 0.5;
            cursor: default;
        }
        .lesson-toolbar {
            display: flex;
            align-items: end;
            gap: 12px;
            justify-content: space-between;
            flex-wrap: wrap;
            margin-bottom: 24px;
        }
        .lesson-toolbar label {
            flex: 1;
            min-width: 200px;
            font-size: 0.875rem;
            color: #475569;
        }
        select {
            display: block;
            width: 100%;
            min-height: 48px;
            margin-top: 6px;
            padding: 8px 12px;
            border: 1px solid #94a3b8;
            border-radius: 6px;
            background: white;
            color: #0f172a;
            font: inherit;
        }
        .continuity {
            font-size: 0.875rem;
            color: #475569;
        }
        .review-view,
        .capabilities {
            margin: 20px 0;
            padding: 16px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            background: #f8fafc;
        }
        .question {
            background: none;
            border: 0;
            color: #1d4ed8;
            text-align: left;
            text-decoration: underline;
        }
        [aria-current='step'] {
            font-weight: bold;
            background: #eff6ff;
        }
        nav ol {
            padding-left: 24px;
        }
        h2 {
            line-height: 1.3;
        }
        h2:focus {
            outline: none;
        }
        .lesson-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
        }
        fdl-field {
            --field-label-width: 100%;
            --field-control-width: 100%;
        }
        pre {
            padding: 16px;
            background: #0f172a;
            color: #e2e8f0;
            overflow: auto;
            font: 0.95rem/1.6 monospace;
        }
        .syntax-string,
        .syntax-regex {
            color: #a7f3d0;
        }
        .syntax-keyword {
            color: #c4b5fd;
        }
        .syntax-number {
            color: #fdba74;
        }
        details {
            margin: 20px 0;
        }
        summary {
            cursor: pointer;
            padding: 8px 0;
        }
        .lesson-grid .lesson-controls {
            background: white;
        }
        .lesson-controls fdl-field:last-child {
            margin-bottom: 0;
        }
        .lesson-navigation {
            display: flex;
            justify-content: space-between;
            gap: 12px;
        }
        a {
            color: #1d4ed8;
        }
        fdl-table {
            display: block;
            overflow-x: auto;
        }
        ${exampleTheme}
    `;
}
customElements.define('fdl-learning-path', FdlLearningPath);
