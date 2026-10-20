import { field, Record } from 'bizallele';

export function createSpecializations() {
    const base = field.label('Name');
    const required = base.required();
    const sibling = base.minLength(2);
    const record = new Record(
        { base, required, sibling },
        { base: '', required: '', sibling: '' }
    );
    return { base, required, sibling, record };
}
