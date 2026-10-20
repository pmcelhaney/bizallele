import { createSpecializations } from './specialization-model';
import { specializationView } from './specialization-view';
import { field, Record } from 'bizallele';
import { exampleTheme } from './example-theme';
import { LitElement, css, html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import 'bizallele/lit/fdl-field';

export class FdlSpecializationExperiment extends LitElement {
    private model = createSpecializations();
    private base = this.model.base;
    private sibling = this.model.sibling;
    private required = this.model.required;
    private enabled = true;
    private get definitions() {
        return {
            base: this.base,
            required: this.required,
            sibling: this.sibling,
        };
    }
    private record = this.model.record;
    private syncing = false;
    private sync = (event: Event) => {
        if (this.syncing) return;
        this.syncing = true;
        const field = (
            event as CustomEvent<{ field: 'base' | 'required' | 'sibling' }>
        ).detail.field;
        const value = this.record.getField(field);
        (['base', 'required', 'sibling'] as const).forEach(key => {
            if (this.record.getField(key) !== value)
                this.record.setField(key, value);
        });
        this.syncing = false;
        this.requestUpdate();
    };
    connectedCallback() {
        super.connectedCallback();
        this.record.addEventListener('change', this.sync);
    }
    disconnectedCallback() {
        this.record.removeEventListener('change', this.sync);
        super.disconnectedCallback();
    }
    private toggle = () => {
        this.enabled = !this.enabled;
        this.required = this.enabled ? this.base.required() : this.base;
        this.record.addField(
            'required',
            this.required,
            this.record.getField('required')
        );
        this.requestUpdate();
    };
    render() {
        return html`<section aria-label="Explore immutable specialization">
            <p
                >Edit any name; all three receive the same test value. Remove
                the required rule from its specialization and compare the base
                and sibling.</p
            >
            <button @click=${this.toggle}
                >${this.enabled ? 'Remove' : 'Add'} required rule on
                requiredName</button
            >
            <div class="variants"
                >${keyed(this.record.field('required'), specializationView(this.record))}</div
            >
            <p role="status"
                >The base is
                ${this.base.valueOf().required(undefined, this.record) ? 'required' : 'optional'};
                shortName still has a
                ${this.sibling.valueOf().minLength()}-character minimum.
                Specializing requiredName changes neither definition.</p
            >
        </section>`;
    }
    static styles = css`
        :host {
            display: block;
            margin: 28px 0;
            line-height: 1.6;
        }
        .variants {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 20px 0;
        }
        .variants section {
            display: flex;
            flex-direction: column;
            border: 1px solid var(--example-border);
            border-radius: var(--example-radius);
            padding: 20px;
            min-width: 0;
        }
        h2 {
            font-size: 1.5rem;
        }
        h3 {
            margin: 0 0 12px;
            font-size: 1.1rem;
        }
        code {
            display: block;
            min-height: 4.5em;
            overflow-wrap: anywhere;
            font-size: 0.9rem;
        }
        fdl-field {
            --field-label-width: 100%;
            --field-control-width: 100%;
        }
        button {
            font: inherit;
            min-height: 48px;
            padding: 10px 16px;
            background: #2563eb;
            color: white;
            border: 0;
            border-radius: 4px;
            cursor: pointer;
        }
        button:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 3px;
        }
        .variant-state {
            margin: auto 0 0;
            border-radius: 6px;
            background: var(--example-surface);
            padding: 12px;
            font-size: 0.875rem;
        }
        fdl-table {
            display: block;
            overflow-x: auto;
        }
        @supports (grid-template-rows: subgrid) {
            .variants section {
                display: grid;
                grid-template-rows: subgrid;
                grid-row: span 4;
                gap: 12px;
            }
            .variants section code {
                min-height: 0;
            }
            .variants section fdl-field,
            .variant-state {
                margin: 0;
            }
            .variants section fdl-field {
                align-self: start;
            }
        }
        ${exampleTheme}
    `;
}
customElements.define(
    'fdl-specialization-experiment',
    FdlSpecializationExperiment
);
