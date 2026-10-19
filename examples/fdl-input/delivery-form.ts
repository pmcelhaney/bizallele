import { deliveryStyles, deliveryView } from './delivery-view';
// Connects the delivery model to field controls and a record inspector.
import { LitElement, css, html } from 'lit';
import './fdl-record-inspector';
import { createDelivery } from './delivery-model';

export class DeliveryForm extends LitElement {
    private delivery = createDelivery();
    private readonly refresh = this.handleChange.bind(this);
    private handleChange() {
        this.requestUpdate();
    }
    connectedCallback() {
        super.connectedCallback();
        this.delivery.addEventListener('change', this.refresh);
    }
    disconnectedCallback() {
        this.delivery.removeEventListener('change', this.refresh);
        super.disconnectedCallback();
    }
    render() {
        return html`<fdl-record .record=${this.delivery}
            ><div class="experiment">
                ${deliveryView(this.delivery)}
                <fdl-record-inspector></fdl-record-inspector> </div
        ></fdl-record>`;
    }
    static styles = [
        deliveryStyles,
        css`
            .experiment {
                display: grid;
                grid-template-columns: var(
                    --example-inspector-columns,
                    repeat(2, minmax(0, 1fr))
                );
                gap: 20px;
                align-items: start;
            }
            .experiment:has(fdl-record-inspector[collapsed]) {
                grid-template-columns: var(
                    --example-inspector-columns,
                    minmax(0, 1fr) auto
                );
            }
            @media (max-width: 1000px) {
                .experiment,
                .experiment:has(fdl-record-inspector[collapsed]) {
                    grid-template-columns: 1fr;
                }
            }
        `,
    ];
}
customElements.define('delivery-form', DeliveryForm);
