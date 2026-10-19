import { LitElement, html } from 'lit';
import './fdl-example';
import './delivery-form';
import modelSource from './delivery-model.ts?raw';
import formSource from './delivery-view.ts?raw';
import dataSource from './delivery-data.ts?raw';

export class FdlDeliveryExperiment extends LitElement {
    render() {
        return html`<fdl-example
            heading="Live example"
            .filenames=${['delivery-model.ts', 'delivery-view.ts', 'delivery-data.ts']}
            .sources=${{
                'delivery-model.ts': modelSource,
                'delivery-view.ts': formSource,
                'delivery-data.ts': dataSource,
            }}
        >
            <p slot="description">
                The interactive example pairs a working delivery form with an
                inspector showing its stored values and field states. A delivery
                summary reads the same record and updates as you edit. The file
                tabs show the field rules in delivery-model.ts, the delivery
                form and styles in delivery-view.ts, and the sample data in
                delivery-data.ts. Open the address record in the inspector to
                explore its fields. Clear the street address to see
                required-field validation, then switch to pickup to see which
                fields become visible and required. Try an incomplete pickup ZIP
                code to see validation and the disabled store selector, then
                enter 28202 or 10001 to load different pickup stores after a
                two-second delay. Switch back to shipping to see that the form
                keeps the address even while its fields are hidden. The shipping
                address and pickup search keep separate ZIP codes.
            </p>
            <delivery-form></delivery-form>
        </fdl-example>`;
    }
}
customElements.define('fdl-delivery-experiment', FdlDeliveryExperiment);
