import { field, Record } from 'bizallele';

const record = new Record(
    {
        value: field.label('Adapter value').search({
            title: 'Find a person',
            columns: [{ label: 'Name', field: 'name' }],
        }),
    },
    {
        value: null,
    }
);

export { record };
