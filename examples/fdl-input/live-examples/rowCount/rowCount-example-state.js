import { record, commentType } from './rowCount-model.js';
// Tutorial state for the .rowCount() example.
import { ExampleController } from '../../example-controller';
import { field, Record } from 'bizallele';

export class ExampleModel extends ExampleController {
    modifier = 'rowCount';
    record = record;
    probes = new Record(
        {
            textareaRows: field
                .label('Row count')
                .parser(Number)
                .options(
                    [1, 4, 10].map(value => ({ text: String(value), value }))
                ),
        },
        { textareaRows: 4 }
    );
    onProbeChange = () => {
        {
            const rows = this.probes.getField('textareaRows');
            this.record.addField(
                'comments',
                commentType(rows),
                this.record.getField('comments')
            );
            this.dispatchEvent(
                new CustomEvent('example-settings-change', {
                    detail: { rows },
                    bubbles: true,
                    composed: true,
                })
            );
        }
        this.requestUpdate();
    };
}
