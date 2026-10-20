import { field, Record } from 'bizallele';
export const record = new Record(
    {
        documentTitle: field
            .label('Document title')
            .defaultValue('Untitled document'),
    },
    { documentTitle: 'Quarterly plan' }
);
