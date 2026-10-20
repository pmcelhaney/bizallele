import { field, Record } from 'bizallele';

export function commentType(rows = 4) {
    return field.label('Comments').rowCount(rows);
}
const rows = 4;
export const record = new Record(
    { comments: commentType(rows) },
    { comments: '' }
);
