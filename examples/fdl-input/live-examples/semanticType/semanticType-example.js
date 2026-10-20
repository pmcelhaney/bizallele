import { semanticTypeView as renderExample } from './semanticType-view.js';
import { ExampleModel } from './semanticType-example-state.js';
import { html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import 'bizallele/lit/fdl-address';
import '../../fdl-record-inspector';
export class ExampleView extends ExampleModel {
    createRenderRoot() {
        return this;
    }
    renderDemo() {
        return html`<p class="try"
                >The generic <code>&lt;fdl-field&gt;</code> delegates this
                address value to <code>&lt;fdl-address&gt;</code>. Edit a child
                field and inspect the parent record.</p
            >${keyed(this.record.field('address'), renderExample())}`;
    }
    render() {
        return html`<div class="focused" data-modifier="semanticType"
            ><div class="focused-demo">${this.renderDemo()}</div
            ><fdl-record-inspector
                .record=${this.record}
                .fields=${['address']}
            ></fdl-record-inspector
        ></div>`;
    }
}
customElements.define('fdl-live-semantictype', ExampleView);
