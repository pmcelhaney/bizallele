import { field, Record } from 'bizallele';
export const record = new Record(
    {
        fixedOwner: field.label('Owner').readOnly(),
        phase: field.label('Phase').options([
            { text: 'Draft', value: 'draft' },
            { text: 'Submitted', value: 'submitted' },
        ]),
        conditionalOwner: field
            .label('Request owner')
            .readOnly(record => record.getField('phase') === 'submitted'),
    },
    {
        fixedOwner: 'Ada Lovelace',
        phase: 'draft',
        conditionalOwner: 'Ada Lovelace',
    }
);
