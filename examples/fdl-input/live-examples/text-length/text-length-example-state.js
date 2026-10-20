import { codeType, record } from './text-length-model.js';
import { LitElement } from 'lit';
import { resetExampleRecord } from '../../example-controller';
import { field, Record } from 'bizallele';
import '../../fdl-example';
import 'bizallele/lit/fdl-field';
import '../../fdl-record-inspector';
export class ExampleModel extends LitElement {
    settings = new Record(
        {
            minimum: field
                .label('Minimum length')
                .parser(Number)
                .options(
                    [2, 4, 8].map(value => ({
                        text: `${value} characters`,
                        value,
                    }))
                ),
            maximum: field
                .label('Maximum length')
                .parser(Number)
                .options(
                    [12, 16, 24].map(value => ({
                        text: `${value} characters`,
                        value,
                    }))
                ),
        },
        { minimum: 4, maximum: 12 }
    );
    codeType() {
        return codeType(
            this.settings.values.minimum,
            this.settings.values.maximum
        );
    }
    record = record;
    checked = false;
    initialized = false;
    refresh = () => this.requestUpdate();
    changeRules = () => {
        this.record.addField(
            'code',
            this.codeType(),
            this.record.getField('code')
        );
        this.requestUpdate();
    };
    connectedCallback() {
        super.connectedCallback();
        if (!this.initialized) {
            resetExampleRecord(this.record);
            this.initialized = true;
        }
        this.settings.addEventListener('change', this.changeRules);
        this.record.addEventListener('change', this.refresh);
    }
    disconnectedCallback() {
        this.settings.removeEventListener('change', this.changeRules);
        this.record.removeEventListener('change', this.refresh);
        super.disconnectedCallback();
    }
}
