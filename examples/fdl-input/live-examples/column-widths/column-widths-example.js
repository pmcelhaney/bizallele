import { columnWidthsView } from './column-widths-view.js';
import { html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { exampleTheme } from '../../example-theme';
import '../../fdl-example';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-table';
import { ExampleModel } from './column-widths-example-state.js';
import model from './column-widths-model.js?raw';
import view from './column-widths-view.js?raw';
export class ExampleView extends ExampleModel {
    render() {
        const { minimum, preferred, maximum } = this.settings.values;
        return html`<fdl-example
            heading="Resize one column"
            .filenames=${['column-widths-model.js', 'column-widths-view.js']}
            .sources=${{ 'column-widths-model.js': model, 'column-widths-view.js': view }}
        >
            <p
                >Choose the three widths, then drag the divider or focus it and
                use the arrow keys. Changing a setting restores the initial
                layout.</p
            >
            ${['minimum', 'preferred', 'maximum'].map(name => html`<fdl-field .record=${this.settings} field=${name}></fdl-field>`)}
            ${keyed(`${minimum}-${preferred}-${maximum}`, columnWidthsView())}
        </fdl-example>`;
    }
    static styles = [exampleTheme];
}
customElements.define('fdl-column-widths', ExampleView);
