import { record, inputTypeField } from './type-model.js';
// Tutorial state for the .type() example.
import { ExampleController } from '../../example-controller';
import { field, Record } from 'bizallele';
import {
    inputTypeChoices,
    inputTypeInitialValue,
} from '../../input-type-example';

export class ExampleModel extends ExampleController {
    modifier = 'type';
    inputTypeRecord = record;
    probes = new Record(
        { inputType: field.label('Input type').options(inputTypeChoices) },
        { inputType: 'text' }
    );
    onProbeChange = () => {
        {
            const inputType = this.probes.getField('inputType');
            this.inputTypeRecord.addField(
                'inputValue',
                inputTypeField(inputType),
                inputTypeInitialValue(inputType)
            );
            this.dispatchEvent(
                new CustomEvent('example-settings-change', {
                    detail: { inputType },
                    bubbles: true,
                    composed: true,
                })
            );
        }
        this.requestUpdate();
    };
}
