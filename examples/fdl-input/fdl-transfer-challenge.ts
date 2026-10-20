import 'bizallele/lit/fdl-record';
import modelSource from './cancellation-rules.ts?raw';
import viewSource from './cancellation-view.ts?raw';
import { cancellationView } from './cancellation-view';
import './fdl-code-snippet';
import { field, Record } from 'bizallele';
import { LitElement, css, html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import {
    cancellationFields,
    checkCancellation,
    checkCancellationTransition,
    type CancellationRules,
} from './cancellation-model';
import { highlightJavaScript } from './highlight-javascript';
import { exampleTheme } from './example-theme';
import 'bizallele/lit/fdl-field';

export class FdlTransferChallenge extends LitElement {
    private configuration = new Record(
        {
            visibility: field.label('Show cancellation reason').options([
                { text: 'Always', value: 'always' },
                { text: 'Only when Cancelled', value: 'cancelled' },
            ]),
            requiredness: field.label('Require cancellation reason').options([
                { text: 'Never', value: 'never' },
                { text: 'Always', value: 'always' },
                { text: 'Only when Cancelled', value: 'cancelled' },
            ]),
        },
        { visibility: 'always', requiredness: 'never' }
    );
    private get rules() {
        return this.configuration.values as CancellationRules;
    }
    private record = new Record(cancellationFields(this.rules), {
        status: 'cancelled',
        reason: '',
    });
    private transition?: ReturnType<typeof checkCancellationTransition>;
    private results?: ReturnType<typeof checkCancellation>;
    private refresh = () => this.requestUpdate();
    private changeRules = () => {
        this.record.addField(
            'reason',
            cancellationFields(this.rules).reason,
            this.record.getField('reason')
        );
        this.results = undefined;
        this.transition = undefined;
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
    private reset = () => {
        this.configuration.setFields({
            visibility: 'always',
            requiredness: 'never',
        });
        this.record.setFields({ status: 'cancelled', reason: '' });
        this.results = undefined;
        this.transition = undefined;
        this.requestUpdate();
    };
    render() {
        return html`<h3>Try it in another domain</h3
            ><p
                >A request needs a cancellation reason only when its status is
                Cancelled. Hide the reason for Active requests, but preserve it
                when the status changes.</p
            ><p
                >Choose rules, try the form, then check four cases and a
                status-change sequence. No new modifiers are needed.</p
            >
            <div class="grid"
                ><section aria-label="Choose cancellation rules"
                    ><fdl-record .record=${this.configuration}
                        ><fdl-field field="visibility"></fdl-field
                        ><fdl-field
                            field="requiredness"
                        ></fdl-field></fdl-record></section
                ><section aria-label="Try the cancellation form"
                    >${keyed(this.record.field('reason'), html`${cancellationView(this.record)}`)}<p
                        >Stored reason:
                        <code
                            >${JSON.stringify(this.record.getField('reason'))}</code
                        >
                        · Record
                        ${this.record.isValid() ? 'valid' : 'invalid'}</p
                    ></section
                ></div
            >
            <div class="actions"
                ><button
                    class="check-challenge"
                    @click=${() => {
                        this.results = checkCancellation(this.rules);
                        this.transition = checkCancellationTransition(
                            this.rules
                        );
                        this.requestUpdate();
                    }}
                    >Check all cases</button
                ><button @click=${this.reset}>Reset challenge</button></div
            >
            ${
                this.results
                    ? html`<section class="challenge-results" role="status"
                          ><h3
                              >${this.results.every(result => result.passes) && this.transition?.passes ? 'All four cases and the status-change sequence match' : 'Some cases need different rules'}</h3
                          ><ul
                              >${this.results.map(({ sample, actual, passes }) => html`<li>${sample.status} · ${sample.reason ? 'with a reason' : 'empty reason'}: <strong>${passes ? 'Matches' : 'Needs a change'}</strong><br />Actual: ${actual.visible ? 'visible' : 'hidden'}, ${actual.required ? 'required' : 'optional'}, ${actual.valid ? 'valid' : 'invalid'}. Expected: ${sample.visible ? 'visible' : 'hidden'}, ${sample.required ? 'required' : 'optional'}, ${sample.valid ? 'valid' : 'invalid'}.</li>`)}<li
                                  >Cancelled → Active → Cancelled:
                                  <strong
                                      >${this.transition?.passes ? 'Matches' : 'Needs a change'}</strong
                                  ><br />Stored reason while Active:
                                  <code
                                      >${JSON.stringify(this.transition?.activeReason)}</code
                                  >. After returning to Cancelled:
                                  <code
                                      >${JSON.stringify(this.transition?.returnedReason)}</code
                                  >. Expected: hidden while Active, visible
                                  again when Cancelled, with “Changed plans”
                                  preserved.</li
                              ></ul
                          ></section
                      >`
                    : ''
            }
            <details
                ><summary>Hint</summary
                ><p
                    >Visibility and requiredness are independent. Both should
                    read the request status. Hiding a field preserves its stored
                    value.</p
                ></details
            ><details
                ><summary>Inspect a solution</summary>
                <p
                    >Choose Only when Cancelled for both visibility and
                    requiredness.</p
                >
            </details>
            <h3>cancellation-rules.ts</h3
            ><fdl-code-snippet>
                <pre><code>${highlightJavaScript(modelSource)}</code></pre></fdl-code-snippet
            ><h3>cancellation-view.ts</h3
            ><fdl-code-snippet>
                <pre><code>${highlightJavaScript(viewSource)}</code></pre>
            </fdl-code-snippet>`;
    }
    static styles = css`
        :host {
            display: block;
            font-size: 1rem;
            line-height: 1.6;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
        }
        section {
            min-width: 0;
        }
        fdl-field {
            --field-label-width: 100%;
            --field-control-width: 100%;
        }
        button {
            font: inherit;
            min-height: 44px;
            padding: 8px 16px;
            border: 1px solid #94a3b8;
            border-radius: 4px;
            background: white;
            color: #1d4ed8;
            cursor: pointer;
        }
        .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        .check-challenge {
            background: #2563eb;
            color: white;
            border-color: #2563eb;
        }
        button:focus-visible,
        summary:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 3px;
        }
        details {
            margin: 16px 0;
        }
        summary {
            cursor: pointer;
            padding: 8px 0;
        }
        .challenge-results {
            padding: 16px;
            margin-top: 16px;
            background: #eff6ff;
            border-radius: 6px;
        }
        li {
            margin-bottom: 12px;
        }
        pre {
            padding: 16px;
            overflow: auto;
            white-space: pre-wrap;
            background: #0f172a;
            color: #f8fafc;
            font: 0.875rem/1.6 monospace;
        }
        .syntax-string {
            color: #a7f3d0;
        }
        .syntax-keyword {
            color: #c4b5fd;
        }
        h3 {
            font-size: 1.125rem;
        }
        ${exampleTheme}
    `;
}
customElements.define('fdl-transfer-challenge', FdlTransferChallenge);
