/* eslint-disable @treasury/filename-match-export */
// TODO rename this file to record.js (lowercase)

import clone from './helpers/clone.js';
import deepEquals from './utilities/deep-equality';
import FieldType from './field-type.js';
import Field from './field.js';
import { resolveRecordFieldType } from './internal-field-type.js';

/**
 * @template [T = unknown]
 */
export default class Record extends EventTarget {
    /**
     * @param {Object.<string, import('./types/field-definition.types').FieldDefinition<any>>} fieldTypes
     * @param {T} values
     */
    constructor(fieldTypes, values) {
        super();
        this.cachedFields = {};
        /** @type {Object.<string, FieldType<any>>} */
        this.fieldTypes = Object.fromEntries(
            Object.entries(fieldTypes).map(([name, definition]) => [name, definition.valueOf()])
        );
        /**
         * The backing object used to hydrate the record.
         * @type {T}
         * @public
         */
        this.values =
            values || console.error('You are passing undefined values', fieldTypes, values);
        this.initialValues = clone(values);
        this.listeners = {};
        /** @type {boolean} View model property used by <omega-table> to track detail row state. */
        this.isExpanded = false;
        this.optionsRevision = 0;
        this.optionsRefresh = Promise.resolve();
        this.refreshOptions();
    }

    /**
     * Reconcile selections against the latest options, independently of any UI.
     * Calls in the same turn are coalesced; obsolete responses cannot clear values.
     * @returns {Promise<void>}
     */
    refreshOptions() {
        const revision = ++this.optionsRevision;
        this.optionsRefresh = Promise.resolve().then(async () => {
            if (revision !== this.optionsRevision) return;
            const results = await Promise.all(
                Object.entries(this.fieldTypes)
                    .filter(
                        ([field, fieldType]) =>
                            fieldType.hasOptions() && !this.field(field).disabled
                    )
                    .map(async ([field, fieldType]) => {
                        try {
                            return { field, fieldType, options: await this.optionsForField(field) };
                        } catch {
                            // A failed lookup is not an empty list of available choices.
                            return undefined;
                        }
                    })
            );
            if (revision !== this.optionsRevision) return;
            const changes = {};
            for (const result of results) {
                if (!result || !Array.isArray(result.options)) continue;
                const { field, fieldType, options } = result;
                const current = this.getField(field);
                if (current === undefined || current === null || current === '') continue;
                const available = value => options.some(option => deepEquals(option.value, value));
                if (fieldType.hasMultipleValues() && Array.isArray(current)) {
                    const retained = current.filter(available);
                    if (retained.length !== current.length) changes[field] = retained;
                } else if (!available(current)) {
                    changes[field] = undefined;
                }
            }
            this.setFields(changes);
        });
        return this.optionsRefresh;
    }

    /** Load choices only when the field's declared state permits editing. */
    optionsForField(field) {
        const fieldType = resolveRecordFieldType(this, field);
        if (this.field(field).disabled) return Promise.resolve([]);
        return fieldType.options(this);
    }

    /**
     * Query partial suggestions without reconciling the current selection.
     * @param {string} field
     * @param {string} query
     * @param {AbortSignal} [signal]
     * @returns {Promise<import('./field-type-builder').Suggestion[]>}
     */
    async suggestionsForField(field, query, signal) {
        const fieldType = resolveRecordFieldType(this, field);
        if (this.field(field).disabled) return [];
        return fieldType.suggestions(query, this, signal);
    }

    /** Wait until option reconciliation and any resulting dependency changes settle. */
    async whenOptionsReady() {
        let pending;
        do {
            pending = this.optionsRefresh;
            await pending;
        } while (pending !== this.optionsRefresh);
    }

    get hasChanged() {
        return !deepEquals(this.initialValues, this.values);
    }

    /**
     *
     * @param {string} field
     * @param {*} context
     */
    getFormattedField(field, context) {
        return this.field(field).format(this.getField(field), context);
    }

    /**
     *
     * @param {string} field
     * @param {number} [index]
     */
    print(field, index) {
        const value = index === undefined ? this.getField(field) : this.getField(field)[index];
        return this.field(field).print(value);
    }

    /**
     *
     * @param {string} field
     * @param {any} value
     */
    parse(field, value) {
        return this.field(field).parse(value);
    }

    /**
     *
     * @param {{(event:CustomEvent):any}} callback
     * @deprecated - use `this.listenTo(record,'change',callback)` instead
     */
    onChange(callback) {
        console.warn(
            "Record#onChange() is deprecated. Use this.listenTo(record, 'change', callback) instead."
        );
        this.addEventListener('change', callback);
    }

    /**
     *
     * @param {string} field
     */
    announceChange(field) {
        this.refreshOptions();
        this.dispatchEvent(new CustomEvent('change', { detail: { field } }));
    }

    /**
     *
     * @param {string} field
     */
    announceBlur(field) {
        this.dispatchEvent(new CustomEvent('blur', { detail: { field } }));
    }

    errors() {
        return Object.keys(this.values).map(key => {
            if (resolveRecordFieldType(this, key).hasParts) {
                return resolveRecordFieldType(this, key)
                    .parts()
                    .map(part =>
                        part.type.validate(part.key, this.values[key][part.key], null, this)
                    );
            }
            return this.field(key).errors();
        });
    }

    async errorsAsync() {
        return Promise.all(
            Object.keys(this.values).map(key => {
                const fieldType = resolveRecordFieldType(this, key);
                if (fieldType.hasParts) {
                    return Promise.all(
                        fieldType
                            .parts()
                            .map(part => this.field(`${key}.${part.key}`).errorsAsync())
                    );
                }
                return this.field(key).errorsAsync();
            })
        );
    }

    /**
     *
     * @returns {number}
     */
    errorCount() {
        return this.errors()
            .flat()
            .reduce((a, b) => a.concat(b), []).length;
    }

    hasErrors() {
        return this.errorCount() > 0;
    }

    readableRecordErrors() {
        const fieldValidationErrors = Object.keys(this.values).map(key => {
            if (resolveRecordFieldType(this, key).hasParts) {
                return resolveRecordFieldType(this, key)
                    .parts()
                    .map(part => this.field(`${key}.${part.key}`).errors());
            }
            return this.field(key)
                .errors()
                .map(v => ({
                    ...v,
                    label: resolveRecordFieldType(this, key).label(
                        this.getField(key),
                        this,
                        'model'
                    ),
                }));
        });
        return fieldValidationErrors
            .map(field => field.map(error => `${error.label}: ${error.name}`))
            .flat();
    }

    /**
     *
     * @param {*} field string
     * @returns {array}
     */
    readableFieldErrors(field) {
        return this.field(field).readableErrors();
    }

    /**
     * Checks the validity of a field based on the fields validators.
     *
     * @param {string} [key] Field name string
     * @param {*} [value] Value for the field, defaults to whatever is in the record.
     *
     * @returns {boolean} Returns if the field is valid
     */
    isValid(key, value = this.values[key]) {
        if (key) {
            return this.field(key).isValid(value);
        }

        return !this.hasErrors();
    }

    async isValidAsync(key, value = this.values[key]) {
        if (key) {
            return this.field(key).isValidAsync(value);
        }

        return (await this.errorsAsync()).flat(2).length === 0;
    }

    get invalidValues() {
        const invalidValues = [];
        Object.keys(this.fieldTypes).forEach(key => {
            if (!this.isValid(key)) {
                invalidValues.push(key);
            }
        });
        return invalidValues;
    }

    hasRequiredValues() {
        return !Object.keys(this.fieldTypes).some(field => {
            const isFieldRequired = this.field(field).required;
            const valueIsNotZero = this.values[field] !== 0;
            const isFalsyValue = !this.values[field];
            if (isFieldRequired && !this.values[field]) {
                console.warn(field, 'is required and has a falsy value of', this.values[field]);
            }
            return isFieldRequired && valueIsNotZero && isFalsyValue;
        });
    }

    /**
     * @param {string} field
     * @param {import('./types/field-definition.types').FieldDefinition<any>} fieldType
     * @param {*} value
     */
    addField(field, fieldType, value) {
        this.fieldTypes = { ...this.fieldTypes, [field]: fieldType.valueOf() };
        this.values = { ...this.values, [field]: value };
        this.announceChange(field);
    }

    /**
     *
     * @template {keyof T} R
     * @param  {R} field
     * @param {T[R]} value
     */
    setField(field, value) {
        /** @type { string[] }  */
        const parts = field.split('.');
        let target = this.values;

        while (parts.length > 1) {
            target = target[parts.shift()];
        }

        target[parts.shift()] = value;
        this.announceChange(field);
    }

    /**
     *
     * @param {object} fields
     */
    setFields(fields) {
        Object.keys(fields).forEach(field => {
            this.setField(field, fields[field]);
        });
    }

    /**
     *
     * @param {string} fieldName
     * @param {*} formattedValue
     */
    parseAndSetField(fieldName, formattedValue) {
        this.field(fieldName).value = formattedValue;
    }

    /**
     * Gets the value of a field
     * @template {keyof T} R
     * @param {R} field
     * @returns {T[R]}
     */
    getField(field) {
        const parts = field.split('.');
        let target = this.values;
        /*
         This recursively gets nested object values,
         returning the nested property until we traverse into the final
         descendent
        */
        while (parts.length > 1) {
            target = target[parts.shift()];
        }
        return target[parts.shift()];
    }

    /**
     *
     * @param {string} field
     */
    hasField(field) {
        return this.getField(field) !== undefined;
    }

    reset() {
        this.values = clone(this.initialValues);
        Object.keys(this.values).map(field => this.announceChange(field));
    }

    clear() {
        const defaultValues = {};
        for (const key of Object.keys(this.fieldTypes)) {
            defaultValues[key] = this.field(key).defaultValue(undefined, 'model');
        }
        this.values = defaultValues;
        Object.keys(this.values).forEach(field => this.announceChange(field));
    }

    allowInputChar(field, char) {
        return this.field(field).allowInputChar(char);
    }

    /**
     *
     * @param {string} name
     * @returns {Field}
     */
    field(name) {
        if (!this.cachedFields[name]) this.cachedFields[name] = new Field(this, name);

        return this.cachedFields[name];
    }

    /**
     *
     * @param {(keyof T)[]} [fields]
     * @returns {Record}
     */
    clone(fields) {
        /** @type {T} */
        let clonedValues;
        const proto = Object.getPrototypeOf(this.values);

        // treat POJOs as simple objects
        if (proto.constructor === Object) {
            const fieldsToClone = fields ?? Object.keys(this.fieldTypes);
            const entries = Object.entries(this.values).map(([fieldName, value]) => {
                if (!fieldsToClone.includes(fieldName)) {
                    value = this.field(fieldName).defaultValue(undefined, 'model');
                }

                return [fieldName, value];
            });
            clonedValues = Object.fromEntries(entries);
        }
        // support class instances stored in records
        else {
            clonedValues = clone(this.values);
        }

        return new Record(this.fieldTypes, clonedValues);
    }

    hashOfFields(fields) {
        return JSON.stringify(
            Object.entries(this.values).filter(([key]) => !fields || fields.includes(key))
        );
    }
}
