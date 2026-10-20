import { recordset, settings } from './column-widths-model.js';
import { LitElement } from 'lit';
import '../../fdl-example';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-table';
export class ExampleModel extends LitElement {
    settings = settings;
    table = recordset;
    refresh = () => this.requestUpdate();
    connectedCallback() {
        super.connectedCallback();
        this.settings.addEventListener('change', this.refresh);
    }
    disconnectedCallback() {
        this.settings.removeEventListener('change', this.refresh);
        super.disconnectedCallback();
    }
}
