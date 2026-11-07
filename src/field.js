import { resolveRecordFieldType } from './internal-field-type.js';

// eslint-disable-next-line @treasury/filename-match-export
export default class Field extends EventTarget {
    constructor(record, fieldName) {
        super();
        this.record = record;
        this.fieldName = fieldName;

        let initialValidity;
        try {
            initialValidity = this.valid;
        } catch {
            // Async validators are evaluated through the async Field methods.
            initialValidity = undefined;
        }
        this.previousState = {
            rawValue: this.rawValue,
            valid: initialValidity,
        };

        // Note: there's no mechanism to clean up this listener when the Field is destroyed.
        // The assumption is the Field object will only be garbage collected after the Record is garbage collected.
        this.record.addEventListener('change', () => {
            if (
                this.rawValue !== this.previousState.rawValue ||
                this.valid !== this.previousState.valid
            ) {
                this.dispatchEvent(new CustomEvent('change'));
            }
            this.previousState.rawValue = this.rawValue;
            this.previousState.valid = this.valid;
        });
    }

    #fieldType() {
        return resolveRecordFieldType(this.record, this.fieldName);
    }

    get value() {
        return this.print();
    }

    set value(inputValue) {
        if (inputValue !== this.rawValue) this.rawValue = this.parse(inputValue);
        this.previousState.rawValue = this.rawValue;
    }

    get rawValue() {
        return this.record.getField(this.fieldName);
    }

    set rawValue(value) {
        this.record.setField(this.fieldName, value);
        this.previousState.rawValue = this.rawValue;
    }

    get focusedInputValue() {
        return this.format(this.rawValue, 'input-focus');
    }

    get blurredInputValue() {
        return this.format(this.rawValue, 'input-blur');
    }

    get valid() {
        return this.isValid();
    }

    get invalid() {
        return !this.valid;
    }

    get label() {
        return this.#fieldType().label(this.rawValue, this.record, 'form');
    }

    get placeholder() {
        return this.#fieldType().placeholder(this.rawValue, this.record, 'form');
    }

    get required() {
        return this.#fieldType().required(this.rawValue, this.record, 'form');
    }

    get disabled() {
        return this.#fieldType().isDisabled(this.rawValue, this.record, 'form');
    }

    get readOnly() {
        return this.#fieldType().readonly(this.rawValue, this.record, 'form');
    }

    get visible() {
        return this.#fieldType().visible(this.rawValue, this.record, 'form');
    }

    get accept() {
        return this.#fieldType().accept();
    }

    get autocomplete() {
        return this.#fieldType().autocomplete();
    }

    get autofocus() {
        return this.#fieldType().autofocus();
    }

    get list() {
        return this.#fieldType().list();
    }

    get max() {
        return this.#fieldType().max();
    }

    get pattern() {
        return this.#fieldType().pattern();
    }

    get step() {
        return this.#fieldType().step();
    }

    get type() {
        return this.#fieldType().type(this.rawValue, this.record, 'form');
    }

    get semanticType() {
        return this.#fieldType().semanticType();
    }

    get recordDefinition() {
        return this.#fieldType().record();
    }

    get recordsetDefinition() {
        return this.#fieldType().recordset();
    }

    get hasOptions() {
        return this.#fieldType().hasOptions();
    }

    get hasSuggestions() {
        return this.#fieldType().hasSuggestions();
    }

    get hideSelectAll() {
        return this.#fieldType().properties.options?.hideSelectAll;
    }

    get hasFilter() {
        return this.#fieldType().hasFilter();
    }

    get hasMultipleValues() {
        return this.#fieldType().hasMultipleValues();
    }

    get parseDynamicRange() {
        return this.#fieldType().getParseDynamicRange();
    }

    get minLength() {
        return this.#fieldType().minLength(this.rawValue, this.record, 'form');
    }

    get maxLength() {
        return this.#fieldType().maxLength(this.rawValue, this.record, 'form');
    }

    get selectionDisabledFunctions() {
        return this.#fieldType().selectionDisabledFunctions();
    }

    get readOnlyException() {
        return this.#fieldType().readonlyexception(this.record);
    }

    get inline() {
        return this.#fieldType().inline(this.record);
    }

    get segmented() {
        return this.#fieldType().segmented(this.record);
    }

    get empty() {
        return this.isEmpty();
    }

    get rowCount() {
        return this.#fieldType().rowCount();
    }

    get hasRowCount() {
        return this.#fieldType().hasRowCount();
    }

    get info() {
        return this.#fieldType().info();
    }

    get formatOnChange() {
        return this.#fieldType().formatOnChange();
    }

    get search() {
        return this.#fieldType().search();
    }

    get searchConfig() {
        return this.#fieldType().searchConfig();
    }

    get hasSearch() {
        return this.#fieldType().hasSearch();
    }

    get additionalProperties() {
        return this.#fieldType().additionalProperties();
    }

    get hashFunction() {
        return this.#fieldType().hashFunction();
    }

    get hideLabel() {
        return this.#fieldType().hideLabel();
    }

    get usesCustomPrint() {
        return this.#fieldType().usesCustomPrint();
    }

    isEmpty(value = this.rawValue, context = 'model') {
        return this.#fieldType().isEmpty(value, this.record, context);
    }

    async isValidAsync(value = this.rawValue) {
        return (await this.errorsAsync(value)).length === 0;
    }

    isValid(value = this.rawValue) {
        return this.errors(value).length === 0;
    }

    async isValidValueAsync(inputValue) {
        return (await this.errorsAsync(this.parse(inputValue))).length === 0;
    }

    isValidValue(inputValue) {
        return this.isValid(this.parse(inputValue));
    }

    errors(value = this.rawValue) {
        return this.#fieldType().validate(this.fieldName, value, null, this.record);
    }

    async errorsAsync(value = this.rawValue) {
        return this.#fieldType().validateAsync(this.fieldName, value, null, this.record);
    }

    readableErrors(value = this.rawValue) {
        return this.errors(value)
            .map(error => ({
                ...error,
                label: this.#fieldType().label(value, this.record, 'model'),
            }))
            .map(error => `${error.label} ${error.name}`);
    }

    parse(inputValue, context = 'model') {
        return this.#fieldType().parse(inputValue, this.record, context);
    }

    format(value = this.rawValue, context = 'model') {
        return this.#fieldType().format(value, this.record, context);
    }

    print(value = this.rawValue) {
        return this.#fieldType().print(value, this.record);
    }

    defaultValue(value, context = 'model') {
        const valueToResolve = arguments.length === 0 ? this.rawValue : value;
        return this.#fieldType().defaultValue(valueToResolve, this.record, context);
    }

    options() {
        return this.record.optionsForField(this.fieldName);
    }

    /**
     * @param {string} query
     * @param {AbortSignal} [signal]
     * @returns {Promise<import('./field-type-builder').Suggestion[]>}
     */
    suggestions(query, signal) {
        return this.record.suggestionsForField(this.fieldName, query, signal);
    }

    onValueChange() {
        return this.#fieldType().onValueChange(this.record);
    }

    refreshOptions() {
        return this.record.refreshOptions();
    }

    whenOptionsReady() {
        return this.record.whenOptionsReady();
    }

    onChange(fn) {
        this.addEventListener('change', fn);
    }

    allowInputChar(char) {
        return this.#fieldType().allowInputChar(char);
    }

    match(searchText, value = this.rawValue) {
        return this.#fieldType().match(searchText, value);
    }

    cellClasses(value = this.rawValue) {
        return this.#fieldType().cellClasses(value, this.record);
    }

    textAlign(value = this.rawValue, context = 'model') {
        return this.#fieldType().textAlign(value, this.record, context);
    }

    field(nameOrIndex) {
        return new Field(this.record, `${this.fieldName}.${nameOrIndex}`);
    }

    maxValueCount() {
        return this.#fieldType().maxValueCount();
    }

    minValueCount() {
        return this.#fieldType().minValueCount();
    }
}
