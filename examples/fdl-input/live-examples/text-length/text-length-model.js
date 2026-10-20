import { field, Record } from 'bizallele';
export function codeType(minimum = 4, maximum = 12) {
    return field.label('Access code').minLength(minimum).maxLength(maximum);
}
const minimum = 4;
const maximum = 12;
export const record = new Record(
    { code: codeType(minimum, maximum) },
    { code: '' }
);
