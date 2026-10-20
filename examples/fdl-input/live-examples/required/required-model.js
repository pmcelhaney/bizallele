import { field, Record } from 'bizallele';

export const person = new Record(
    {
        name: field.label('Legal name').required(),
        followUp: field.label('Follow-up needed?').options([
            { text: 'No', value: 'no' },
            { text: 'Yes', value: 'yes' },
        ]),
        followUpNotes: field
            .label('Follow-up notes')
            .rowCount(2)
            .required(record => record.getField('followUp') === 'yes'),
    },
    { name: '', followUp: 'no', followUpNotes: '' }
);
