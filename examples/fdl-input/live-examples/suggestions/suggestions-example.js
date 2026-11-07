import { record } from './suggestions-model.js';
import { suggestionsView } from './suggestions-view.js';
import { ExampleController } from '../../example-controller';
import { html } from 'lit';
import '../../fdl-record-inspector';

export class ExampleView extends ExampleController {
    modifier = 'suggestions';
    record = record;

    createRenderRoot() {
        return this;
    }

    render() {
        return html`<div class="focused" data-modifier="suggestions">
            <div class="focused-demo">
                <p class="try"
                    >Paris is already committed, although it is not in this
                    directory. Search for “lo”, then “zzzz”: the stored value
                    stays Paris. Search “lo” again and choose London with Arrow
                    Down and Enter, or click it, to commit a new value.</p
                >
                ${suggestionsView()}
                <p
                    >Committed destination:
                    <strong>${this.record.getField('city')}</strong></p
                >
                <p
                    >Escape or leaving the field restores the committed display.
                    Erasing the query does not clear the destination.</p
                >
            </div>
            <fdl-record-inspector
                .record=${this.record}
                .fields=${['city']}
            ></fdl-record-inspector>
        </div>`;
    }
}
customElements.define('fdl-live-suggestions', ExampleView);
