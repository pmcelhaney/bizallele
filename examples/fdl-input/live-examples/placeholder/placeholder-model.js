import { field, Record } from 'bizallele';
export const record = new Record(
    {
        projectName: field
            .label('Project name')
            .placeholder('For example, Apollo migration'),
    },
    { projectName: '' }
);
