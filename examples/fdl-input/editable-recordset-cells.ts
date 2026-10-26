import { LitElement, css, html } from 'lit';
import type { Field } from 'bizallele';
import { shipmentCharge } from './editable-recordset-model';
import 'bizallele/lit/fdl-field';

/** Cell components own subscriptions, including changes to related row fields. */
class ShipmentCell extends LitElement {
    private boundField?: Field;
    private refresh = () => this.requestUpdate();

    get field() {
        return this.boundField;
    }

    set field(field: Field | undefined) {
        if (this.boundField === field) return;
        this.boundField?.record.removeEventListener('change', this.refresh);
        this.boundField = field;
        if (this.isConnected)
            field?.record.addEventListener('change', this.refresh);
        this.requestUpdate();
    }

    connectedCallback() {
        super.connectedCallback();
        this.field?.record.addEventListener('change', this.refresh);
    }

    disconnectedCallback() {
        this.field?.record.removeEventListener('change', this.refresh);
        super.disconnectedCallback();
    }
}

class ShipmentSelect extends ShipmentCell {
    static properties = { selectedId: { attribute: 'selected-id' } };
    selectedId = '';

    private select() {
        this.dispatchEvent(
            new CustomEvent('shipment-select', {
                detail: this.field!.record,
                bubbles: true,
                composed: true,
            })
        );
    }

    render() {
        if (!this.field) return html``;
        return html`<button
            type="button"
            @click=${this.select}
            aria-pressed=${this.selectedId === this.field.rawValue}
            aria-label=${`Edit shipment ${this.field.rawValue}`}
            >${this.field.value}</button
        >`;
    }

    static styles = css`
        button {
            font: inherit;
            padding: 0.5rem;
            cursor: pointer;
        }
        button[aria-pressed='true'] {
            font-weight: bold;
        }
    `;
}

class ShipmentEditor extends ShipmentCell {
    render() {
        if (!this.field) return html``;
        return html`<fdl-field
            .record=${this.field.record}
            field=${this.field.fieldName}
        ></fdl-field>`;
    }

    static styles = css`
        fdl-field {
            min-width: 140px;
            --field-control-width: 100%;
        }
    `;
}

class ShipmentCharge extends ShipmentCell {
    render() {
        return this.field
            ? html`$${shipmentCharge(this.field.record).toFixed(2)}`
            : html``;
    }
}

class ShipmentValidation extends ShipmentCell {
    render() {
        if (!this.field) return html``;
        const row = this.field.record;
        return html`<span role="status"
            >${row.isValid() ? 'Valid' : row.readableRecordErrors().join('. ')}</span
        >`;
    }
}

customElements.define('shipment-select', ShipmentSelect);
customElements.define('shipment-editor', ShipmentEditor);
customElements.define('shipment-charge', ShipmentCharge);
customElements.define('shipment-validation', ShipmentValidation);
