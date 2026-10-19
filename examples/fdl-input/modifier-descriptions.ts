/** General modifier help for source files, independent of any example's values. */
export const modifierDescriptions: Readonly<Record<string, string>> = {
    required:
        'Requires a nonempty value, optionally depending on other values in the record.',
    formatter: 'Formats a value for display without changing the stored value.',
    visible: 'Determines whether a field is shown, based on the record.',
    cellClass:
        'Adds fixed or calculated styling classes to individual table cells.',
    columnClass: 'Adds styling classes to a whole table column.',
    compareFunction: 'Defines how two field values are compared for sorting.',
    defaultValue:
        'Supplies a fixed or calculated value restored by Record.clear().',
    disabled:
        'Determines whether editing is disabled, optionally based on the record.',
    emptyWhen:
        'Defines which values count as empty, including for required-field validation.',
    filter: 'Defines how a field value matches search text when filtering records.',
    hashFunction: 'Defines a stable identity key for a field value.',
    inputMask:
        'Declares an input character pattern for adapters that support masking.',
    label: 'Sets a fixed or record-dependent label for the field.',
    maxColumnWidth: 'Sets the maximum requested width of a table column.',
    maxLength:
        'Limits value length and enforces the limit during record validation.',
    minColumnWidth: 'Sets the minimum requested width of a table column.',
    minLength:
        'Requires a minimum length for nonempty values during record validation.',
    multipleValues:
        'Allows a field to contain multiple values, with optional count limits.',
    options:
        'Supplies available choices, including asynchronous choices that depend on other fields.',
    parser: 'Converts input into the value stored in the record.',
    placeholder:
        'Supplies a fixed or record-dependent hint for an empty control.',
    record: 'Defines a structured value whose child fields are ordinary Bizallele fields.',
    recordset:
        'Defines a repeated structured value whose rows use ordinary Bizallele fields.',
    readOnly:
        'Determines whether a field is read-only, optionally based on the record.',
    reducer: 'Combines field values across records into an aggregate result.',
    rowClass: 'Adds fixed or record-dependent styling classes to table rows.',
    rowCount: 'Requests a number of visible rows in a supporting text control.',
    search: 'Configures search-based selection for adapters that support it.',
    semanticType:
        'Declares the domain meaning of a field independently of its renderer.',
    sortable: 'Determines whether a table column can be sorted.',
    targetColumnWidth: 'Sets the preferred width of a table column.',
    template:
        'Defines a custom display template for the formatted field value.',
    textAlign:
        'Declares fixed or calculated text alignment for consumers that support it.',
    type: 'Declares a fixed or record-dependent input type.',
    validator:
        'Adds a validation rule; a failing value makes the field invalid.',
};
