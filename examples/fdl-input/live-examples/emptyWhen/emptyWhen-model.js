import { field, Record } from 'bizallele';
export const record = new Record(
    {
        emptyCode: field
            .label('Reference')
            .emptyWhen(value => value === 'N/A')
            .required(),
        optionalEmptyCode: field
            .label('Optional reference')
            .emptyWhen(value => value === 'N/A'),
    },
    { emptyCode: 'N/A', optionalEmptyCode: 'N/A' }
);
