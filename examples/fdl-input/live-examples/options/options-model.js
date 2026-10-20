import { field, Record } from 'bizallele';
import { assigneeDirectory, optionsDelay } from '../../assignee-options';
export const record = new Record(
    {
        department: field.label('Department').options([
            { text: 'Engineering', value: 'engineering' },
            { text: 'Finance', value: 'finance' },
        ]),
        assignee: field
            .label('Assignee (function)')
            .options(
                record => assigneeDirectory[record.getField('department')]
            ),
        asyncAssignee: field
            .label('Assignee (async function)')
            .options(async record => {
                const choices =
                    assigneeDirectory[record.getField('department')];
                await new Promise(resolve => setTimeout(resolve, optionsDelay));
                return choices;
            }),
    },
    {
        department: 'engineering',
        assignee: 'margaret',
        asyncAssignee: 'margaret',
    }
);
