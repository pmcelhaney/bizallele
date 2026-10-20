import 'bizallele/lit/fdl-record';
import { keyed } from 'lit/directives/keyed.js';
import { recordSummary } from './model-summary';
import modelSource from './field-builder-model.ts?raw';
import viewSource from './field-builder-view.ts?raw';
import { fieldBuilderView } from './field-builder-view';
import './fdl-code-snippet';
import { field, Record } from 'bizallele';
import { LitElement, css, html } from 'lit';
import {
    buildFieldRecord,
    defaultFieldSpec,
    type FieldSpec,
} from './field-builder-model';
import { highlightJavaScript } from './highlight-javascript';
import { exampleTheme } from './example-theme';
import 'bizallele/lit/fdl-field';
const choiceText: { [value: string]: string } = {
    always: 'Always',
    enabled: 'When Condition is Enabled',
    never: 'Never',
    none: 'No value check',
    minimum: 'At least 3 characters',
    digits: 'Digits only',
};
const choice = (label: string, values: string[]) =>
    field
        .label(label)
        .options(values.map(value => ({ text: choiceText[value], value })));
export class FdlFieldBuilder extends LitElement {
    private configuration = new Record(
        {
            name: field
                .label('Field name')
                .required()
                .validator({
                    name: 'must be a distinct field name using letters, numbers, or underscores',
                    validate: value =>
                        /^[A-Za-z_]\w*$/.test(value) &&
                        ![
                            'condition',
                            '__proto__',
                            'constructor',
                            'prototype',
                        ].includes(value),
                }),
            initialValue: field.label('Starting value'),
            visibility: choice('Show field', ['always', 'enabled']),
            requiredness: choice('Require field', [
                'never',
                'enabled',
                'always',
            ]),
            validation: choice('Value check', ['none', 'minimum', 'digits']),
        },
        { ...defaultFieldSpec }
    );
    private spec = { ...defaultFieldSpec };
    private record = buildFieldRecord(this.spec);
    private refresh = () => this.requestUpdate();
    private changeRules = () => {
        if (this.configuration.isValid()) {
            const nextSpec = { ...this.configuration.values } as FieldSpec;
            const values =
                nextSpec.initialValue !== this.spec.initialValue
                    ? {
                          initialValue: nextSpec.initialValue,
                          condition: this.record.getField('condition'),
                      }
                    : {
                          initialValue: this.record.getField(this.spec.name),
                          condition: this.record.getField('condition'),
                      };
            this.spec = nextSpec;
            this.record.removeEventListener('change', this.refresh);
            this.record = buildFieldRecord({ ...this.spec, ...values });
            this.record.addEventListener('change', this.refresh);
        }
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
    render() {
        return html`<h3>Build a field of your own</h3
            ><p
                >Name a field, give it a starting value, and choose one
                dependency and value check. Conditional rules use the Condition
                field. “Digits only” accepts digits in non-empty values;
                requiredness determines whether an empty value is allowed.</p
            ><p
                >Changing a rule or field name preserves your current preview
                value and condition. Editing Starting value replaces the preview
                value; Reset restores the initial example. The source below
                defines the preview model and its view.</p
            >
            <div class="workspace"
                ><section aria-label="Field definition controls"
                    ><fdl-record .record=${this.configuration}
                        >${['name', 'initialValue', 'visibility', 'requiredness', 'validation'].map(field => html`<fdl-field field=${field} .showValidationErrors=${true}></fdl-field>`)}</fdl-record
                    ></section
                ><section class="preview"
                    ><h3>Try your field</h3
                    >${keyed(this.record, fieldBuilderView(this.record, this.spec.name))}${recordSummary(this.record, [this.spec.name])}</section
                ></div
            >
            <div class="actions"
                ><button
                    @click=${() => {
                        this.configuration.setFields({ ...defaultFieldSpec });
                        this.changeRules();
                        this.record.setFields({
                            condition: defaultFieldSpec.condition,
                            [defaultFieldSpec.name]:
                                defaultFieldSpec.initialValue,
                        });
                    }}
                    >Reset builder</button
                ></div
            >
            <h3>field-builder-model.ts</h3
            ><fdl-code-snippet>
                <pre><code>${highlightJavaScript(modelSource)}</code></pre></fdl-code-snippet
            ><h3>field-builder-view.ts</h3
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
        .workspace {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
        }
        .workspace section {
            min-width: 0;
        }
        .preview {
            padding: 16px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 6px;
            align-self: start;
        }
        fdl-field {
            --field-label-width: 100%;
            --field-control-width: 100%;
        }
        .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin: 20px 0;
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
        button:disabled {
            opacity: 0.5;
            cursor: default;
        }
        button:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 3px;
        }
        pre {
            padding: 16px;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
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
customElements.define('fdl-field-builder', FdlFieldBuilder);
