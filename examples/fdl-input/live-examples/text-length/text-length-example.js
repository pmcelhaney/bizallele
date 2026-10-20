import { textLengthView } from './text-length-view.js';
import { html, css } from 'lit';
import { exampleTheme } from '../../example-theme';
import '../../fdl-example';
import 'bizallele/lit/fdl-field';
import '../../fdl-record-inspector';
import { ExampleModel } from './text-length-example-state.js';
import model from './text-length-model.js?raw';
import view from './text-length-view.js?raw';
export class ExampleView extends ExampleModel {
    render() {
        return html`<fdl-example
            heading="Check both length limits"
            .filenames=${['text-length-model.js', 'text-length-view.js']}
            .sources=${{ 'text-length-model.js': model, 'text-length-view.js': view }}
        >
            <p
                >Change either limit without losing your code. Typing stops at
                the maximum; assigning an overlong model value bypasses that
                input cap so you can check model validation.</p
            >
            <fdl-field .record=${this.settings} field="minimum"></fdl-field>
            <fdl-field .record=${this.settings} field="maximum"></fdl-field>
            <form @submit=${event => event.preventDefault()}
                >${textLengthView()}
                <div class="actions"
                    ><button
                        @click=${() => {
                            this.checked = true;
                            this.requestUpdate();
                        }}
                        >Check value</button
                    >
                    <button
                        class="model-assignment"
                        @click=${() => {
                            this.record.setField(
                                'code',
                                'X'.repeat(this.settings.values.maximum + 1)
                            );
                            this.checked = true;
                            this.requestUpdate();
                        }}
                        >Assign an overlong model value</button
                    ></div
                >
                <p class="result" role="status"
                    >${this.checked ? (this.record.isValid() ? 'Valid code.' : this.record.readableRecordErrors().join('. ')) : 'Check the value to show validation errors.'}</p
                >
            </form>
            <fdl-record-inspector .record=${this.record}></fdl-record-inspector>
        </fdl-example>`;
    }
    static styles = [
        exampleTheme,
        css`
            :host {
                display: block;
                min-width: 0;
            }
            .actions {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
            }
            button {
                min-height: 44px;
                padding: 10px 16px;
                border: 1px solid #94a3b8;
                background: white;
                color: #1e293b;
                font: inherit;
                cursor: pointer;
            }
            button:first-child {
                background: #2563eb;
                border-color: #2563eb;
                color: white;
            }
            button:focus-visible {
                outline: 2px solid #2563eb;
                outline-offset: 3px;
            }
            fdl-record-inspector {
                margin-top: 20px;
            }
        `,
    ];
}
customElements.define('fdl-text-length', ExampleView);
