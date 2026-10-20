import { field, Record } from 'bizallele';
export function createHashType() {
    return field.hashFunction(employee => employee.id);
}
export const record = new Record(
    {
        firstId: field.label('First employee ID'),
        secondId: field.label('Second employee ID'),
    },
    { firstId: 'ada', secondId: 'ada' }
);
