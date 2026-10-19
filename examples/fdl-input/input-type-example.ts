import { field } from '@pmcelhaney/bizallele';
import {
    inputTypes,
    type inputType,
} from '@pmcelhaney/bizallele/types/input-types.types';

export const inputTypeChoices = inputTypes.map(value => ({
    text: value,
    value,
}));

const initialValues: Partial<{
    [name in inputType]: string | number | boolean;
}> = {
    text: 'Ada Lovelace',
    search: 'Design systems',
    email: 'ada@example.com',
    password: 'sample-password',
    tel: '555-0100',
    url: 'https://example.com',
    number: 42,
    range: 50,
    color: '#7657ff',
    date: '2026-10-15',
    'datetime-local': '2026-10-15T09:30',
    month: '2026-10',
    time: '09:30',
    week: '2026-W42',
    checkbox: false,
    radio: false,
    hidden: 'record-1048',
    button: 'Example button',
    submit: 'Example submit',
    image: 'Example image button',
};

export const inputTypeInitialValue = (type: inputType) =>
    initialValues[type] ?? '';
export const inputTypeNeedsNumber = (type: inputType) =>
    type === 'number' || type === 'range';
export function inputTypeField(type: inputType) {
    const definition = field.label(`Example: ${type}`).type(type);
    return inputTypeNeedsNumber(type) ? definition.parser(Number) : definition;
}

export function inputTypeNote(type: inputType) {
    if (type === 'hidden')
        return 'Hidden inputs have no visible control. Inspect the stored value in the record.';
    if (type === 'file')
        return 'Choose a file to see the browser-provided filename in the record. This demo does not upload it. Browsers do not allow restoring a file selection from a stored value.';
    if (type === 'checkbox')
        return 'Check or uncheck the box to store true or false.';
    if (type === 'radio')
        return 'Select the radio to store true. Reset the example to clear it. Grouped choices require a component that coordinates the group.';
    if (type === 'image')
        return 'An image input is a submit button. Without an image asset, the browser displays its fallback button. This preview is outside a form, so it does not submit anything.';
    if (type === 'button' || type === 'submit')
        return 'Buttons perform actions rather than edit values. This preview is outside a form, so clicking it does not submit anything or change the record.';
    return 'Edit the native control and compare its value with the record. Appearance and support vary by browser.';
}
