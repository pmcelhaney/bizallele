import { css, html } from 'lit';
import type { Record } from 'bizallele';
import { exampleTheme } from './example-theme';
import { storesByZip } from './delivery-data';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-record';

function deliverySummary(record: Record<any>) {
    if (record.getField('fulfillment') === 'pickup') {
        const stores = storesByZip[record.getField('pickupZip')] ?? [];
        const store = stores.find(
            option => option.value === record.getField('store')
        );
        return store ? `Pick up at ${store.text}.` : 'Choose a pickup store.';
    }
    if (!record.isValid('address')) return 'Complete the shipping address.';
    const address = record.getField('address');
    return `Ship to ${address.street}, ${address.city}, ${address.state} ${address.zip}.`;
}

export function deliveryView(record: Record<any>) {
    const pickup = record.getField('fulfillment') === 'pickup';
    return html`<fdl-record .record=${record}>
        <div class="editor">
            <fdl-field field="fulfillment"></fdl-field>
            <fdl-field field="address"></fdl-field>
            <fdl-field field="pickupZip"></fdl-field>
            <fdl-field field="store" select-prompt="Select a store"></fdl-field>
            ${
                pickup
                    ? html`<p class="sample-note">
                          Sample store lookup (2-second delay): try ZIP code
                          <strong>28202</strong> or <strong>10001</strong>.
                      </p>`
                    : ''
            }
            <section class="delivery-summary" aria-label="Delivery summary">
                <h3>Delivery summary</h3>
                <p role="status">${deliverySummary(record)}</p>
            </section>
        </div>
    </fdl-record>`;
}

export const deliveryStyles = css`
    :host {
        display: block;
    }
    * {
        box-sizing: border-box;
    }
    .editor {
        padding: 20px;
        border: 1px solid var(--example-border);
        border-radius: var(--example-radius);
        background: white;
    }
    .sample-note {
        font-size: 0.875rem;
        color: #475569;
    }
    .delivery-summary {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--example-border);
    }
    .delivery-summary h3 {
        margin: 0 0 6px;
        font-size: 0.875rem;
    }
    .delivery-summary p {
        margin: 0;
        line-height: 1.5;
        overflow-wrap: anywhere;
    }
    .editor fdl-field:last-child {
        margin-bottom: 0;
    }
    fdl-field {
        --field-label-width: 100%;
        --field-control-width: 100%;
    }
    @media (max-width: 480px) {
        .editor {
            padding: 16px;
        }
    }
    ${exampleTheme}
`;
