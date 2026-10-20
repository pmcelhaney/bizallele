import { compareFunctionView as renderExample } from './compareFunction-view.js';
import { ExampleModel } from './compareFunction-example-state.js';
import { html } from 'lit';
import { sortCases } from '../../comparison-examples';
import 'bizallele/lit/fdl-table';
import '../../fdl-recordset-inspector';
export class ExampleView extends ExampleModel {
    createRenderRoot() {
        return this;
    }
    renderDemo() {
        {
            return html`<p class="try"
                    >Sort T-shirt size to order sizes from XS to XXL instead of
                    alphabetically. First and last names use alphabetic
                    order.</p
                >
                ${renderExample()}${sortCases(this.compareRecordset)}`;
        }
    }
    render() {
        return html`<div
            class="focused full-width"
            data-modifier="compareFunction"
            ><div class="focused-demo">${this.renderDemo()}</div
            ><fdl-recordset-inspector
                .recordset=${this.compareRecordset}
            ></fdl-recordset-inspector
        ></div>`;
    }
}
customElements.define('fdl-live-comparefunction', ExampleView);
