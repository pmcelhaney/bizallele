import { html } from 'lit';
import type { Record } from 'bizallele';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-record';

export function specializationView(record: Record<any>) {
    return html`<fdl-record .record=${record}>
        <section aria-label="base definition">
            <h3>baseName</h3>
            <code>field.label('Name')</code>
            <fdl-field field="base"></fdl-field>
            <p class="variant-state"
                >${record.field('base').required ? 'Required' : 'Optional'} ·
                ${record.isValid('base') ? 'Valid' : 'Invalid'}</p
            >
        </section>
        <section aria-label="required definition">
            <h3>requiredName</h3>
            <code
                >${record.field('required').required ? 'baseName.required()' : 'baseName'}</code
            >
            <fdl-field field="required"></fdl-field>
            <p class="variant-state"
                >${record.field('required').required ? 'Required' : 'Optional'}
                · ${record.isValid('required') ? 'Valid' : 'Invalid'}</p
            >
        </section>
        <section aria-label="sibling definition">
            <h3>shortName</h3>
            <code>baseName.minLength(2)</code>
            <fdl-field field="sibling"></fdl-field>
            <p class="variant-state"
                >${record.field('sibling').required ? 'Required' : 'Optional'} ·
                ${record.isValid('sibling') ? 'Valid' : 'Invalid'}</p
            >
        </section>
    </fdl-record>`;
}
