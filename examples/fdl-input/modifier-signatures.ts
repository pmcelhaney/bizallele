// Signatures from field-type-builder.ts; preserve the API's declared parameter types.
export const modifierSignatures: { [name: string]: string } = {
    required: 'required(predicate?: RecordSetting<boolean>)',
    formatter:
        'formatter(fn: (value: T, record: Record<any>, context: string) => any)',
    visible: 'visible(predicate: RecordSetting<boolean>)',
    cellClass: 'cellClass(classes: ValueSetting<T, string | string[]>)',
    columnClass:
        'columnClass(classes: string | string[] | (() => string | string[]))',
    compareFunction: 'compareFunction(fn: (a: T, b: T) => number)',
    defaultValue: 'defaultValue(value: DefaultSetting<T>)',
    disabled: 'disabled(predicate?: RecordSetting<boolean>)',
    emptyWhen: 'emptyWhen(predicate: ValueSetting<T, boolean>)',
    filter: 'filter(predicate?: (searchText: string, value: T) => boolean)',
    hashFunction: 'hashFunction<V = unknown>(fn: (values: V) => string)',
    inputMask: 'inputMask(regex: RegExp)',
    label: 'label(label: RecordSetting<string>)',
    maxColumnWidth: 'maxColumnWidth(width: ColumnSetting<number>)',
    maxLength: 'maxLength(length: RecordSetting<number>)',
    minColumnWidth: 'minColumnWidth(width: ColumnSetting<number>)',
    minLength: 'minLength(length: RecordSetting<number>)',
    multipleValues: 'multipleValues(min?: number, max?: number)',
    options:
        'options<O = T, F = Record<any>>(optionsConfig: OptionsApi<O, F> | ((record: Record<any>) => O[] | Promise<O[]>) | Promise<O[]> | Array<O>)',
    parser: 'parser(fn: (value: any, record: Record<any>, context: string) => T)',
    placeholder: 'placeholder(placeholder: RecordSetting<string>)',
    record: 'record(fields: FieldDefinitions)',
    recordset: 'recordset(fields: FieldDefinitions)',
    readOnly: 'readOnly(predicate?: RecordSetting<boolean>)',
    reducer: 'reducer(nameOrFunction: "sum" | ((values: T[]) => unknown))',
    rowClass: 'rowClass(classes: RecordSetting<string | string[]>)',
    rowCount: 'rowCount(numberOfRows: number)',
    search: 'search(config: SearchConfig<T>)',
    semanticType: 'semanticType(name: string)',
    sortable: 'sortable(sortable: ColumnSetting<boolean>)',
    targetColumnWidth: 'targetColumnWidth(width: ColumnSetting<number>)',
    template:
        'template(fn: (field: T, record: Record<any>, context: string) => string | number | boolean | TemplateResult | Array<TemplateResult>)',
    textAlign:
        'textAlign(direction: FieldSetting<T, "left" | "center" | "right">)',
    type: 'type(type: RecordSetting<inputType>)',
    validator: 'validator(validator: Validator<T>)',
};

/** Result types for settings shown as fixed and calculated call forms. */
export const fieldSettingResults: { [name: string]: string } = {
    cellClass: 'string | string[]',
    columnClass: 'string | string[]',
    rowClass: 'string | string[]',
    label: 'string',
    required: 'boolean',
    disabled: 'boolean',
    visible: 'boolean',
    readOnly: 'boolean',
    emptyWhen: 'boolean',
    minLength: 'number',
    maxLength: 'number',
    placeholder: 'string',
    textAlign: "'left' | 'center' | 'right'",
    type: 'inputType',
};

export const recordSettingNames = new Set([
    'rowClass',
    'label',
    'placeholder',
    'type',
    'required',
    'disabled',
    'visible',
    'readOnly',
    'minLength',
    'maxLength',
]);

export const columnSettingResults: { [name: string]: string } = {
    minColumnWidth: 'number',
    maxColumnWidth: 'number',
    targetColumnWidth: 'number',
    sortable: 'boolean',
};

export const displayedModifierSignatures: { [name: string]: string } = {
    ...modifierSignatures,
};
for (const [name, result] of Object.entries(fieldSettingResults)) {
    displayedModifierSignatures[name] = [
        ...(['required', 'disabled', 'readOnly'].includes(name)
            ? [`.${name}()`]
            : []),
        ...(result === 'string | string[]'
            ? [`.${name}(className: string)`, `.${name}(classNames: string[])`]
            : [`.${name}(setting: ${result})`]),
        `.${name}(setting: (${name === 'columnClass' ? '' : recordSettingNames.has(name) ? 'record: Record<any>' : ['emptyWhen', 'cellClass'].includes(name) ? 'value: T, record: Record<any>' : 'value: T, record: Record<any>, context: string'}) => ${result})`,
    ].join('\n');
}
for (const [name, result] of Object.entries(columnSettingResults)) {
    displayedModifierSignatures[name] =
        `.${name}(setting: ${result})\n.${name}(setting: () => ${result})`;
}

displayedModifierSignatures.defaultValue =
    '.defaultValue(value: T | null)\n.defaultValue(factory: (record: Record<any>) => T | null)';
