// Curated relationships are reciprocal: readers can compare either direction.
// Groups connect close alternatives or modifiers commonly used together.
const relationships: readonly (readonly string[])[] = [
    ['cellClass', 'columnClass', 'rowClass'],
    ['compareFunction', 'sortable'],
    ['compareFunction', 'filter'],
    ['defaultValue', 'placeholder'],
    ['disabled', 'readOnly'],
    ['disabled', 'readOnly', 'visible'],
    ['emptyWhen', 'required'],
    ['required', 'validator'],
    ['required', 'visible'],
    ['formatter', 'parser', 'template'],
    ['formatter', 'textAlign'],
    ['hashFunction', 'options', 'multipleValues'],
    ['inputMask', 'parser', 'validator'],
    ['inputMask', 'type'],
    ['label', 'placeholder'],
    ['maxColumnWidth', 'minColumnWidth', 'targetColumnWidth'],
    ['maxLength', 'minLength', 'validator'],
    ['maxLength', 'rowCount'],
    ['options', 'search', 'multipleValues'],
    ['options', 'suggestions'],
    ['record', 'recordset', 'semanticType'],
    ['reducer', 'filter'],
    ['reducer', 'formatter'],
    ['rowCount', 'type'],
];

export function relatedModifierNames(name: string): string[] {
    return [
        ...new Set(relationships.filter(group => group.includes(name)).flat()),
    ]
        .filter(related => related !== name)
        .sort((a, b) => a.localeCompare(b, 'en'));
}
