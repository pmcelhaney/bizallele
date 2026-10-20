import { typeView as renderExample } from './type-view.js';
import { ExampleModel } from './type-example-state.js';
import { inputTypeNote } from '../../input-type-example';
import { html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import 'bizallele/lit/fdl-field';
import '../../fdl-record-inspector';
export class ExampleView extends ExampleModel {
    createRenderRoot() {
        return this;
    }
    renderDemo() {
        return html`<fdl-field
                .record=${this.probes}
                field="inputType"
            ></fdl-field>
            <p class="try"
                >${inputTypeNote(this.probes.getField('inputType'))}</p
            >
            ${keyed(this.inputTypeRecord.field('inputValue'), renderExample())}`;
    }
    render() {
        return html`<div class="focused" data-modifier="type"
            ><div class="focused-demo">${this.renderDemo()}</div
            ><fdl-record-inspector
                .record=${this.inputTypeRecord}
            ></fdl-record-inspector
        ></div>`;
    }
}
customElements.define('fdl-live-type', ExampleView);
