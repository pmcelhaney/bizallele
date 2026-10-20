import { field, Record } from 'bizallele';
export type FieldSpec = {
    name: string;
    initialValue: string;
    condition: string;
    visibility: 'always' | 'enabled';
    requiredness: 'never' | 'enabled' | 'always';
    validation: 'none' | 'minimum' | 'digits';
};
export const defaultFieldSpec: FieldSpec = {
    name: 'notes',
    initialValue: '',
    condition: 'enabled',
    visibility: 'enabled',
    requiredness: 'enabled',
    validation: 'none',
};
export function buildFieldRecord(spec: FieldSpec) {
    let definition = field.label(spec.name);
    if (spec.visibility === 'enabled')
        definition = definition.visible(
            record => record.getField('condition') === 'enabled'
        );
    if (spec.requiredness === 'always') definition = definition.required();
    if (spec.requiredness === 'enabled')
        definition = definition.required(
            record => record.getField('condition') === 'enabled'
        );
    if (spec.validation === 'minimum') definition = definition.minLength(3);
    if (spec.validation === 'digits')
        definition = definition.validator({
            name: 'must contain digits only',
            validate: value => value === '' || /^\d+$/.test(value),
        });
    return new Record(
        {
            condition: field.label('Condition').options([
                { text: 'Enabled', value: 'enabled' },
                { text: 'Disabled', value: 'disabled' },
            ]),
            [spec.name]: definition,
        },
        { condition: spec.condition, [spec.name]: spec.initialValue }
    );
}
