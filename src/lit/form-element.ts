/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PropertyValues, html, css, nothing } from 'lit';
import { RecordElement } from './record-context';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { property, state, customElement } from 'lit/decorators.js';
import Record from '../record.js';
import { ListeningElementMixin } from '../utilities/listening-element';
import { Events } from '../types/events.types';
import { SuggestionsController } from './suggestions-controller';

const ListeningElement = ListeningElementMixin(RecordElement);
let nextFormElementId = 0;

class FormElement extends ListeningElement {
    constructor() {
        super();
        this.field = '';
        this.showValidationErrors = false;
    }

    dispatchEvent: any;

    @property({ type: String, reflect: true })
    public field: string;

    /**
     * Whether this adapter should expose the field's synchronous model validation errors.
     * Set true to reveal errors explicitly, in addition to automatic blur/submit display.
     */
    @property({ type: Boolean, attribute: 'show-validation-errors' })
    public showValidationErrors: boolean;

    /** Empty-choice text belongs to this control, not to the option data. */
    @property({ type: String, attribute: 'select-prompt' })
    public selectPrompt?: string;

    @state()
    private validationRevealed = false;

    private validationRecord?: Record<any>;
    private validationField?: string;
    private lastCommittedValid = true;
    private lastCommittedVisible = true;
    private validationForm?: HTMLFormElement;

    /** Clear touched/submitted display state after the application resets its Record. */
    public resetValidation() {
        this.validationRevealed = false;
        this.showValidationErrors = false;
        this.snapshotValidation();
        this.updateValidationAccessibility();
    }

    private snapshotValidation() {
        if (!this.record || !this.field) return;
        const field = this.record.field(this.field);
        this.lastCommittedValid = field.valid;
        this.lastCommittedVisible = field.visible;
    }

    private readonly recordChange = () => {
        if (this.element) void this.destructureFieldType();
    };

    private readonly recordBlur = (event: Event) => {
        if (!this.record || !this.field) return;
        const field = this.record.field(this.field);
        const blurredField = (event as CustomEvent<{ field: string }>).detail.field;
        if (
            blurredField === this.field ||
            (this.lastCommittedValid &&
                this.lastCommittedVisible &&
                field.visible &&
                !field.empty &&
                !field.valid)
        ) {
            this.validationRevealed = true;
        }
        this.snapshotValidation();
        this.updateValidationAccessibility();
        this.requestUpdate();
    };

    private readonly fieldFocusOut = (event: FocusEvent) => {
        const next = event.relatedTarget;
        if (next instanceof Node && (this.contains(next) || this.shadowRoot?.contains(next)))
            return;
        this.record?.announceBlur(this.field);
    };

    private readonly formSubmit = () => {
        this.validationRevealed = true;
        this.updateValidationAccessibility();
        this.requestUpdate();
    };

    private readonly formReset = (event: Event) => {
        queueMicrotask(() => {
            if (!event.defaultPrevented && this.isConnected) this.resetValidation();
        });
    };

    private connectValidation() {
        if (this.validationRecord !== this.record || this.validationField !== this.field) {
            this.validationRecord?.removeEventListener('blur', this.recordBlur);
            this.validationRecord?.removeEventListener('change', this.recordChange);
            this.validationRecord = this.record;
            this.validationField = this.field;
            this.validationRevealed = false;
            this.snapshotValidation();
        }
        this.validationRecord?.addEventListener('blur', this.recordBlur);
        this.validationRecord?.addEventListener('change', this.recordChange);
        this.validationForm?.removeEventListener('submit', this.formSubmit);
        this.validationForm?.removeEventListener('reset', this.formReset);
        let ancestor: Element | null = this.parentElement;
        let current: Element = this;
        while (true) {
            if (!ancestor) {
                const root = current.getRootNode();
                if (!(root instanceof ShadowRoot)) break;
                ancestor = root.host;
            }
            if (ancestor instanceof HTMLFormElement) break;
            current = ancestor;
            ancestor = ancestor.parentElement;
        }
        this.validationForm = ancestor instanceof HTMLFormElement ? ancestor : undefined;
        this.validationForm?.addEventListener('submit', this.formSubmit);
        this.validationForm?.addEventListener('reset', this.formReset);
    }

    private readonly controlId = `form-element-control-${++nextFormElementId}`;

    private readonly labelId = `${this.controlId}-label`;

    private readonly errorId = `${this.controlId}-error`;

    @state()
    private element?: any;

    private suggestionsController?: SuggestionsController;

    private controlRecord?: Record<any>;
    private controlField?: string;

    async firstUpdated() {
        if (this.element && this.controlRecord === this.record && this.controlField === this.field)
            return;
        if (!this.record) return;
        if (!this.field) throw new Error('OmegaFormElement: field is required');
        const field = this.record.field(this.field);
        const typeahead = field.hasSuggestions && !field.hasMultipleValues;
        const controlTag = typeahead
            ? 'input'
            : field.hasOptions
              ? 'select'
              : field.hasRowCount
                ? 'textarea'
                : 'input';
        this.suggestionsController?.dispose();
        this.suggestionsController = undefined;
        const controlVersion = ++this.optionsRequestVersion;
        this.optionsRequest = undefined;
        this.controlRecord = this.record;
        this.controlField = this.field;
        if (this.element?.localName !== controlTag) {
            this.element = document.createElement(controlTag);
            this.addListenersToElement();
        }
        this.element.loading = false;
        this.syncSelectPrompt();
        this.addListenersToRecord();
        await this.destructureFieldType();
        if (typeahead && this.isConnected && controlVersion === this.optionsRequestVersion) {
            this.suggestionsController = new SuggestionsController(this.element, field, () =>
                this.requestUpdate()
            );
        }
    }

    private optionsRequest?: Promise<unknown>;
    private optionsRequestVersion = 0;

    private composing = false;
    private parsingNativeInput = false;

    private get nativeTextControl(): HTMLInputElement | HTMLTextAreaElement | undefined {
        return this.element instanceof HTMLInputElement ||
            this.element instanceof HTMLTextAreaElement
            ? this.element
            : undefined;
    }

    private acceptedInput(text: string) {
        return [...text]
            .filter(character => this.record?.field(this.field).allowInputChar(character))
            .join('');
    }

    private filterNativeInput() {
        const control = this.nativeTextControl;
        if (!control) return;
        const value = control.value;
        const accepted = this.acceptedInput(value);
        if (accepted === value) return;
        const { selectionStart, selectionEnd, selectionDirection } = control;
        control.value = accepted;
        if (selectionStart !== null && selectionEnd !== null) {
            control.setSelectionRange(
                this.acceptedInput(value.slice(0, selectionStart)).length,
                this.acceptedInput(value.slice(0, selectionEnd)).length,
                selectionDirection ?? undefined
            );
        }
    }

    addListenersToElement() {
        if (this.nativeTextControl) {
            this.listenTo(this.element, 'blur', () => {
                if (
                    !this.suggestionsController &&
                    !['checkbox', 'radio', 'file'].includes(this.element.type)
                ) {
                    this.element.value = this.record?.field(this.field).focusedInputValue;
                }
            });
            this.listenTo(this.element, 'beforeinput', (event: Event) => {
                if (this.suggestionsController || !(event instanceof InputEvent)) return;
                if (
                    !this.composing &&
                    !event.isComposing &&
                    event.data &&
                    event.inputType.startsWith('insert') &&
                    this.acceptedInput(event.data) === ''
                ) {
                    event.preventDefault();
                }
            });
            this.listenTo(this.element, 'compositionstart', () => {
                this.composing = true;
            });
            this.listenTo(this.element, 'compositionend', () => {
                this.composing = false;
                if (!this.suggestionsController)
                    this.element.dispatchEvent(
                        new Event('input', { bubbles: true, composed: true })
                    );
            });
        }
        Events.forEach(e => {
            this.listenTo(this.element, e, async (event: any) => {
                if (this.suggestionsController || this.composing || event.isComposing) return;
                this.filterNativeInput();
                let value;
                if (event.detail) {
                    value = event.detail.value ?? event.detail.values ?? event.detail;
                } else if (this.element instanceof HTMLSelectElement && this.element.multiple) {
                    value = [...this.element.selectedOptions].map(option => option.value);
                } else if (
                    this.element instanceof HTMLInputElement &&
                    ['checkbox', 'radio'].includes(this.element.type)
                ) {
                    value = this.element.checked;
                } else {
                    value = event.target.value;
                }
                // An input echo must not replace an unfinished decimal, cleared text, or the caret.
                this.parsingNativeInput = e === 'input' && Boolean(this.nativeTextControl);
                try {
                    const boundField = this.record?.field(this.field);
                    if (boundField) boundField.value = value;
                } finally {
                    this.parsingNativeInput = false;
                }
                this.record?.field(this.field).onValueChange();
                this.element.dispatchEvent(new CustomEvent('update', { detail: { value, event } }));
            });
        });
    }

    private closeMultipleMenu = (event: Event) => {
        const menu = this.shadowRoot?.querySelector<HTMLDetailsElement>('.multiple-values');
        if (menu?.open && !event.composedPath().includes(menu)) menu.open = false;
    };

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this.closeMultipleMenu);
        this.addEventListener('focusout', this.fieldFocusOut);
        this.connectValidation();
        if (this.element) {
            this.addListenersToElement();
            this.controlRecord = undefined;
            void this.firstUpdated();
        }
    }

    disconnectedCallback() {
        this.optionsRequestVersion++;
        this.suggestionsController?.dispose();
        this.suggestionsController = undefined;
        document.removeEventListener('click', this.closeMultipleMenu);
        this.removeEventListener('focusout', this.fieldFocusOut);
        this.validationRecord?.removeEventListener('blur', this.recordBlur);
        this.validationRecord?.removeEventListener('change', this.recordChange);
        this.validationForm?.removeEventListener('submit', this.formSubmit);
        this.validationForm?.removeEventListener('reset', this.formReset);
        super.disconnectedCallback();
    }

    private finishMultipleSelection(event: Event) {
        const menu = (event.currentTarget as HTMLElement).closest('details')!;
        menu.open = false;
        menu.querySelector('summary')?.focus();
    }

    private renderMultipleSelect(select: HTMLSelectElement) {
        const selected = [...select.selectedOptions];
        const invalid = this.visibleValidationErrors().length > 0;
        select.hidden = true;
        return html`<div class="control">
            ${select}
            <details
                class="multiple-values"
                ?data-disabled=${select.disabled}
                @keydown=${(event: KeyboardEvent) => {
                    if (event.key === 'Escape') {
                        this.finishMultipleSelection(event);
                        event.stopPropagation();
                    }
                }}
            >
                <summary
                    id=${`${this.controlId}-trigger`}
                    aria-labelledby=${`${this.labelId} ${this.controlId}-selection`}
                    aria-disabled=${select.disabled ? 'true' : nothing}
                    aria-required=${select.required ? 'true' : nothing}
                    aria-invalid=${invalid ? 'true' : nothing}
                    aria-describedby=${invalid ? this.errorId : nothing}
                    tabindex=${select.disabled ? '-1' : '0'}
                    @click=${(event: Event) => {
                        if (select.disabled) event.preventDefault();
                    }}
                >
                    <span id=${`${this.controlId}-selection`}
                        >${selected.length === 0 ? 'Select…' : selected.length === 1 ? selected[0].textContent : `${selected.length} selected`}</span
                    >
                    <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"></path></svg>
                </summary>
                <div class="multiple-menu">
                    <fieldset ?disabled=${select.disabled}>
                        <legend class="visually-hidden"
                            >${this.record?.field(this.field).label}</legend
                        >
                        <p class="multiple-hint">Select any combination.</p>
                        <div class="multiple-options"
                            >${[...select.options].map(
                                option =>
                                    html` <label
                                        ><input
                                            type="checkbox"
                                            .checked=${option.selected}
                                            ?disabled=${option.disabled}
                                            @change=${(event: Event) => {
                                                option.selected = (
                                                    event.target as HTMLInputElement
                                                ).checked;
                                                select.dispatchEvent(new Event('input'));
                                            }}
                                        /><span>${option.textContent}</span></label
                                    >`
                            )}
                        </div>
                    </fieldset>
                    <div class="multiple-actions">
                        <button
                            type="button"
                            ?disabled=${select.disabled}
                            @click=${() => {
                                [...select.options].forEach(option => {
                                    option.selected = false;
                                });
                                select.dispatchEvent(new Event('input'));
                            }}
                            >Clear selection</button
                        >
                        <button type="button" @click=${this.finishMultipleSelection}>Done</button>
                    </div>
                </div>
            </details>
            ${this.renderValidationErrors()}
        </div>`;
    }

    addListenersToRecord() {
        this.connectValidation();
    }

    async destructureFieldType() {
        const boundField = this.record?.field(this.field);
        /**
         * used to conform to a components API where the property may not
         * be assignable via a field type modifier
         */
        const properties = boundField?.additionalProperties ?? {};
        Object.keys(properties).forEach((key: string) => {
            this.element[key] = properties[key];
        });
        /**
         * assign all standard properties we can from the modifiers
         */
        if (this.element instanceof HTMLInputElement) {
            const type = boundField?.type;
            if (boundField?.hasSuggestions && !boundField.hasMultipleValues)
                this.element.type = 'text';
            else if (typeof type === 'string') this.element.type = type;
        }
        // Native selects use option identities, not formatted labels. Keep all
        // selected identities intact between native input and change events.
        if (this.element instanceof HTMLSelectElement) {
            this.element.multiple = boundField?.hasMultipleValues ?? false;
            this.syncSelectValue();
        } else if (
            this.element instanceof HTMLInputElement &&
            ['checkbox', 'radio'].includes(this.element.type)
        ) {
            this.element.checked = Boolean(boundField?.rawValue);
        } else if (this.element instanceof HTMLInputElement && this.element.type === 'file') {
            // Browsers only allow clearing a file picker programmatically.
            if (!boundField?.rawValue) this.element.value = '';
        } else if (!this.parsingNativeInput) {
            // @ts-ignore
            this.element.value = boundField?.focusedInputValue;
        }
        this.element.id = this.controlId;
        this.element.required = boundField?.required;
        this.element.visible = boundField?.visible;
        this.element.readonly = boundField?.readOnly;
        this.element.label = boundField?.label;
        this.element.inline = boundField?.inline;
        this.element.segmented = boundField?.segmented;
        this.element.empty = boundField?.empty;
        this.element.disabled = Boolean(this.element.loading) || boundField?.disabled;
        this.element.name = this.field;
        this.element.rows = boundField?.rowCount;
        this.element.maxLength = boundField?.maxLength;
        this.element.minLength = boundField?.minLength;
        this.element.placeholder = boundField?.placeholder;
        if (this.element instanceof HTMLSelectElement) {
            this.element.toggleAttribute('multiple', boundField?.hasMultipleValues ?? false);
        } else {
            this.element.multiple = boundField?.hasMultipleValues;
        }
        this.element.accept = boundField?.accept;
        this.element.autocomplete = boundField?.autocomplete;
        this.element.autofocus = boundField?.autofocus;
        // `list` is an attribute on native inputs; assigning it as a property
        // expects an HTMLDataListElement and silently drops a string id.
        const list = boundField?.list;
        if (list) this.element.setAttribute('list', list);
        else this.element.removeAttribute('list');
        this.element.max = boundField?.max;
        this.element.pattern = boundField?.pattern;
        this.element.step = boundField?.step;
        this.element.hashFunction = boundField?.hashFunction;
        this.element.record = this.record;

        /**
         * some uglier APIs we should attempt to clean up in omega/field-type - these don't really
         * follow form elements standard html attributes
         */
        this.element.fieldModel = this.record?.field(this.field);
        this.element.field = this.record?.field(this.field); // weird name here, we need to deprecate this and fieldModel
        this.element.formatOnChange = boundField?.formatOnChange;
        this.element.searchConfig = boundField?.searchConfig;
        this.element.hasSearch = boundField?.hasSearch;
        this.element.hasFilter = boundField?.hasFilter;
        this.element.readonlyexception = boundField?.readOnlyException;
        this.element.readOnly = boundField?.readOnly; // case change only on omega-frequency - should update there and remove this
        this.element.readOnlyException = boundField?.readOnlyException; // case change only on omega-frequency - should update there and remove this
        this.element.parseDynamicRange = boundField?.parseDynamicRange;
        this.element.dateDisabledFunction =
            boundField?.selectionDisabledFunctions?.dateDisabledFunction;
        this.element.hideSelectAll = boundField?.hideSelectAll;
        this.element.maxValueCount = boundField?.maxValueCount();

        this.suggestionsController?.sync();

        if (boundField?.hasSuggestions && !boundField.hasMultipleValues) {
            // Complete options, if present, remain owned by Record reconciliation.
        } else if (boundField?.hasOptions && boundField.disabled) {
            // Invalidate pending UI work without fetching or erasing its options.
            this.optionsRequestVersion++;
            this.optionsRequest = undefined;
            this.element.loading = false;
            this.element.removeAttribute('aria-busy');
            this.element.disabled = true;
        } else if (boundField?.hasOptions) {
            const request = boundField!.options();
            if (request !== this.optionsRequest) {
                this.optionsRequest = request;
                const version = ++this.optionsRequestVersion;
                this.element.loading = true;
                this.element.disabled = true;
                this.element.setAttribute('aria-busy', 'true');
                this.requestUpdate();
                try {
                    const options = (await request) as Array<{ text: unknown; value: unknown }>;
                    // Only the latest dependency values may populate this control.
                    if (version !== this.optionsRequestVersion) return;
                    if (this.element instanceof HTMLSelectElement) {
                        this.element.replaceChildren(
                            ...options.map(option => {
                                const nativeOption = document.createElement('option');
                                nativeOption.value = String(option.value);
                                nativeOption.textContent = String(option.text);
                                return nativeOption;
                            })
                        );
                        this.syncSelectPrompt();
                        this.syncSelectValue();
                    } else {
                        this.element.options = options;
                        this.element.items = options;
                        this.element.radios = options;
                    }
                } finally {
                    if (version === this.optionsRequestVersion) {
                        this.element.loading = false;
                        this.element.disabled = boundField.disabled;
                        this.element.removeAttribute('aria-busy');
                        this.requestUpdate();
                    }
                }
            }
        }
        this.updateValidationAccessibility();
        this.requestUpdate();
    }

    private syncSelectPrompt() {
        if (
            !(this.element instanceof HTMLSelectElement) ||
            this.record?.field(this.field).hasMultipleValues
        )
            return;
        let prompt = this.element.querySelector(
            'option[data-select-prompt]'
        ) as HTMLOptionElement | null;
        const suppliedEmpty = [...this.element.options].some(
            option => option !== prompt && option.value === ''
        );
        if (suppliedEmpty || this.selectPrompt === undefined) {
            prompt?.remove();
            return;
        }
        if (!prompt) {
            prompt = document.createElement('option');
            prompt.value = '';
            prompt.setAttribute('data-select-prompt', '');
            this.element.prepend(prompt);
        }
        prompt.textContent = this.selectPrompt;
    }

    private syncSelectValue() {
        const select = this.element as HTMLSelectElement;
        const value = (this.record as any)?.field(this.field).rawValue;
        if (select.multiple) {
            const selectedValues = (Array.isArray(value) ? value : [value]).map(String);
            [...select.options].forEach(option => {
                option.selected = selectedValues.includes(option.value);
            });
        } else {
            select.value = String(value ?? '');
        }
    }

    protected updated(changedProperties: PropertyValues) {
        if (changedProperties.has('record') || changedProperties.has('field')) {
            this.connectValidation();
            if (this.record && this.field) void this.firstUpdated();
            else {
                this.optionsRequestVersion++;
                this.suggestionsController?.dispose();
                this.suggestionsController = undefined;
                this.element = undefined;
            }
        }
        if (changedProperties.has('selectPrompt')) this.syncSelectPrompt();
        this.updateValidationAccessibility();
        this.suggestionsController?.afterRender();
    }

    protected get validationErrorsVisible(): boolean {
        return this.showValidationErrors || this.validationRevealed;
    }

    private visibleValidationErrors() {
        if (!this.validationErrorsVisible || !this.record || !this.field) return [];
        if (!this.record.field(this.field).visible) return [];
        return this.record.field(this.field).readableErrors();
    }

    private updateValidationAccessibility() {
        if (!this.element) return;
        const hasVisibleErrors = this.visibleValidationErrors().length > 0;
        if (hasVisibleErrors) this.element.setAttribute('aria-invalid', 'true');
        else this.element.removeAttribute('aria-invalid');

        const describedBy = new Set(
            (this.element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
        );
        describedBy.delete(this.errorId);
        if (hasVisibleErrors) describedBy.add(this.errorId);

        if (describedBy.size > 0) {
            this.element.setAttribute('aria-describedby', [...describedBy].join(' '));
        } else {
            this.element.removeAttribute('aria-describedby');
        }
    }

    renderRequired() {
        if (!this.record) return nothing;
        if (!this.record.field(this.field).required) return nothing;
        if (this.record.field(this.field).readOnly) return nothing;
        return html`<span class="required">&nbsp;*</span>`;
    }

    renderLabel() {
        if (!this.record) return nothing;
        const field = this.record.field(this.field);
        if (!field.label) return nothing;
        if (field.hideLabel) return nothing;
        if (!field.visible) return nothing;
        return html`<label
            id=${this.labelId}
            for=${this.controlId}
            @click=${() => this.shadowRoot?.querySelector<HTMLElement>('.multiple-values summary')?.focus()}
            >${field.label}${this.renderRequired()}<slot name="label"></slot
        ></label>`;
    }

    renderValidationErrors() {
        const errors = this.visibleValidationErrors();
        if (errors.length === 0) return nothing;
        return html`<div class="validation-error" id=${this.errorId}>${errors.join('. ')}</div>`;
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    renderElement() {
        if (!this.record) return nothing;
        if (!this.element) return nothing;
        const field = this.record.field(this.field);
        if (!field.visible) return nothing;
        if (this.element.readonly && !field.usesCustomPrint) {
            const hasVisibleErrors = this.visibleValidationErrors().length > 0;
            return html`<div class="control">
                <output
                    id=${this.controlId}
                    name=${this.field}
                    aria-labelledby=${this.labelId}
                    aria-invalid=${hasVisibleErrors ? 'true' : nothing}
                    aria-describedby=${hasVisibleErrors ? this.errorId : nothing}
                    >${this.record.field(this.field).value}</output
                >
                ${this.renderValidationErrors()}
            </div>`;
        }
        if (this.element instanceof HTMLSelectElement && this.element.multiple)
            return this.renderMultipleSelect(this.element);
        this.element.hidden = false;
        return html`<div class="control">
            <div class="control-input" ?data-loading=${this.element.loading}>
                ${this.element} ${this.suggestionsController?.render() ?? nothing}
                ${this.element.loading ? html`<span class="options-spinner" aria-hidden="true"></span>` : nothing}
            </div>
            ${this.element.loading ? html`<p class="options-loading" role="status">Loading choices…</p>` : nothing}
            ${this.renderValidationErrors()}
        </div>`;
    }

    render() {
        return [this.renderLabel(), this.renderElement()];
    }

    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }
            :host {
                display: flex;
                flex-flow: row;
                flex-wrap: var(--field-flex-wrap, wrap);
                align-items: center;
                color: var(--field-color);
                font-weight: var(--field-font-weight);
            }
            :host([no-align]) {
                align-items: unset;
            }
            :host([no-align]) .label {
                padding-top: 7px;
            }
            .control {
                font-size: var(--field-control-font-size);
                font-weight: var(--field-control-font-weight);
                flex: var(--field-control-width, 250px) 3 1;
            }
            .control-input {
                position: relative;
            }
            .suggestions {
                position: absolute;
                z-index: 10;
                inset: 100% 0 auto;
                background: white;
                border: 1px solid #94a3b8;
                border-radius: 6px;
                box-shadow: 0 8px 20px #0f172a24;
            }
            .suggestions[hidden] {
                display: none;
            }
            .suggestions ul {
                list-style: none;
                margin: 0;
                padding: 0;
                max-height: 16rem;
                overflow: auto;
            }
            .suggestions li {
                padding: 10px 14px;
                cursor: pointer;
            }
            .suggestions li[aria-selected='true'] {
                outline: 2px solid currentColor;
                outline-offset: -2px;
                background: #e2e8f0;
            }
            .suggestions p {
                padding: 8px 14px;
                margin: 0;
                font-size: 0.875rem;
            }
            .control-input[data-loading] select {
                padding-right: 3.5rem;
            }
            .options-spinner {
                position: absolute;
                right: 2rem;
                top: calc(50% - 8px);
                width: 16px;
                height: 16px;
                border: 2px solid #94a3b8;
                border-top-color: #2563eb;
                border-radius: 50%;
                animation: options-spin 0.7s linear infinite;
                pointer-events: none;
            }
            .options-loading {
                margin: 6px 0 0;
                font-size: 0.875rem;
            }
            @keyframes options-spin {
                to {
                    transform: rotate(360deg);
                }
            }
            @media (prefers-reduced-motion: reduce) {
                .options-spinner {
                    animation: none;
                }
            }
            .multiple-values {
                position: relative;
            }
            .multiple-values summary {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                min-height: 48px;
                padding: 10px 14px;
                border: 1px solid #94a3b8;
                border-radius: 6px;
                background: white;
                font: inherit;
                cursor: pointer;
                list-style: none;
            }
            .multiple-values summary::-webkit-details-marker {
                display: none;
            }
            .multiple-values summary svg {
                width: 16px;
                height: 16px;
                flex-shrink: 0;
                fill: none;
                stroke: #64748b;
                stroke-width: 1.5;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            .multiple-values summary:focus-visible {
                outline: 3px solid #2563eb;
                outline-offset: 3px;
            }
            .multiple-values summary[aria-invalid='true'] {
                border-color: #a42b20;
            }
            .multiple-values[data-disabled] summary {
                background: #e2e8f0;
                border-style: dashed;
                color: #475569;
                cursor: not-allowed;
            }
            .multiple-menu {
                position: absolute;
                z-index: 10;
                inset: calc(100% + 6px) 0 auto;
                min-width: 240px;
                padding: 12px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background: white;
                box-shadow: 0 12px 28px #0f172a24;
            }
            .multiple-menu fieldset {
                border: 0;
                padding: 0;
                margin: 0;
            }
            .visually-hidden {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
            }
            .multiple-hint {
                margin: 6px 0 10px;
                font-size: 0.875rem;
                color: #475569;
                line-height: 1.5;
            }
            .multiple-options {
                display: grid;
                gap: 2px;
                max-height: 240px;
                overflow: auto;
            }
            .multiple-options label {
                display: flex;
                align-items: center;
                gap: 10px;
                min-height: 36px;
                margin: 0;
                font-size: 1rem;
                cursor: pointer;
            }
            .multiple-options input[type='checkbox'] {
                width: 20px;
                height: 20px;
                min-height: 0;
                padding: 0;
                margin: 0;
                accent-color: #2563eb;
                flex-shrink: 0;
            }
            .multiple-actions {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                margin-top: 12px;
                border-top: 1px solid #e2e8f0;
                padding-top: 8px;
            }
            .multiple-actions button {
                min-height: 36px;
                border: 0;
                background: none;
                color: #2563eb;
                font: inherit;
                text-decoration: underline;
                cursor: pointer;
            }
            .required {
                color: var(--error);
            }
            label {
                flex: 1 1 var(--field-label-width, 200px);
                font-size: var(--label, 14px);
                font-weight: var(--label-font-weight, 400);
                color: var(--label-color);
                margin-bottom: var(--field-label-margin-bottom, 4px);
                max-width: var(--field-label-max-width, none);
            }
        `;
    }
}

export const FormElementTagName = 'form-element';
// @ts-ignore
customElements.define('form-element', FormElement);
export default FormElement;
