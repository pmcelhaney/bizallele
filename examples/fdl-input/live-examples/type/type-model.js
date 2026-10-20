import { field, Record } from 'bizallele';
import { inputTypeInitialValue } from '../../input-type-example';
export function inputTypeField(type) {
    const definition = field.label(`Example: ${type}`).type(type);
    return type === 'number' || type === 'range'
        ? definition.parser(Number)
        : definition;
}
const inputType = 'text';
export const record = new Record(
    { inputValue: inputTypeField(inputType) },
    { inputValue: inputTypeInitialValue(inputType) }
);
