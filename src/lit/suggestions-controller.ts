import { html, nothing } from 'lit';
import type Field from '../field.js';

type Suggestion = { text: string; value: unknown };

/** Per-control query state: suggestions are never an exhaustive set of valid values. */
export class SuggestionsController {
    private version = 0;
    private abort?: AbortController;
    private items: Suggestion[] = [];
    private active = -1;
    private open = false;
    private loading = false;
    private failed = false;
    private composing = false;
    private selected?: Suggestion;

    constructor(
        private input: HTMLInputElement,
        private field: Field,
        private update: () => void
    ) {
        input.type = 'text';
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.addEventListener('input', this.onInput);
        input.addEventListener('focus', this.onFocus);
        input.addEventListener('blur', this.onBlur);
        input.addEventListener('keydown', this.onKeydown);
        input.addEventListener('compositionstart', this.onCompositionStart);
        input.addEventListener('compositionend', this.onCompositionEnd);
        this.sync();
    }

    private readonly onCompositionStart = () => {
        this.composing = true;
        this.close();
    };
    private readonly onCompositionEnd = () => {
        this.composing = false;
        void this.search();
    };
    private readonly onInput = (event: Event) => {
        if (this.composing || (event as InputEvent).isComposing) return;
        void this.search();
    };
    private readonly onFocus = () => void this.search();
    private readonly onBlur = () => this.sync();
    private readonly onKeydown = (event: KeyboardEvent) => {
        if (this.composing || event.isComposing) return;
        if (event.key === 'Escape') {
            if (this.open) event.preventDefault();
            this.sync();
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!this.open) void this.search();
            else if (this.items.length) {
                this.active =
                    (this.active +
                        (event.key === 'ArrowDown' ? 1 : this.active < 0 ? 0 : -1) +
                        this.items.length) %
                    this.items.length;
                this.refresh();
            }
        } else if (event.key === 'Enter' && this.open) {
            // Do not submit the form while the user is choosing a suggestion.
            event.preventDefault();
            if (this.active >= 0) this.choose(this.items[this.active]);
        }
    };

    private get available() {
        return this.field.visible && !this.field.disabled && !this.field.readOnly;
    }

    private async search() {
        this.close();
        if (!this.available) return;
        const version = this.version;
        this.abort = new AbortController();
        this.open = true;
        this.loading = true;
        this.refresh();
        try {
            const items = await this.field.suggestions(this.input.value, this.abort.signal);
            if (version !== this.version) return;
            this.items = items;
        } catch {
            if (version !== this.version) return;
            this.failed = true;
        } finally {
            if (version === this.version) {
                this.loading = false;
                this.refresh();
            }
        }
    }

    private close() {
        this.version++;
        this.abort?.abort();
        this.abort = undefined;
        this.items = [];
        this.active = -1;
        this.open = false;
        this.loading = false;
        this.failed = false;
        this.refresh();
    }

    /** Record changes invalidate requests, including changes to query dependencies. */
    sync() {
        this.close();
        // This input edits a search query, not the committed model value. Native
        // value constraints (including required) must not validate query text.
        this.input.required = false;
        this.input.setAttribute('aria-required', String(this.field.required));
        for (const attribute of ['maxlength', 'minlength', 'pattern', 'min', 'max', 'step', 'list'])
            this.input.removeAttribute(attribute);
        if (this.selected && !Object.is(this.selected.value, this.field.rawValue))
            this.selected = undefined;
        this.input.value = this.selected?.text ?? String(this.field.focusedInputValue ?? '');
    }

    private choose(item: Suggestion) {
        if (!this.available) return;
        this.close();
        this.field.rawValue = item.value;
        this.selected = item;
        this.sync();
        this.field.onValueChange();
        this.input.dispatchEvent(new CustomEvent('update', { detail: { value: item.value } }));
    }

    private refresh() {
        this.input.setAttribute('aria-expanded', String(this.open));
        this.input.setAttribute('aria-controls', `${this.input.id}-suggestions`);
        this.input.setAttribute('aria-busy', String(this.loading));
        if (this.active >= 0)
            this.input.setAttribute(
                'aria-activedescendant',
                `${this.input.id}-suggestion-${this.active}`
            );
        else this.input.removeAttribute('aria-activedescendant');
        this.update();
    }

    afterRender() {
        if (this.active < 0) return;
        const root = this.input.getRootNode() as ShadowRoot;
        root.querySelector<HTMLElement>(
            `#${this.input.id}-suggestion-${this.active}`
        )?.scrollIntoView?.({ block: 'nearest' });
    }

    render() {
        return html`<div class="suggestions" ?hidden=${!this.open}>
            <ul id=${`${this.input.id}-suggestions`} role="listbox" aria-label="Suggestions">
                ${this.items.map(
                    (item, index) =>
                        html`<li
                            id=${`${this.input.id}-suggestion-${index}`}
                            role="option"
                            aria-selected=${String(index === this.active)}
                            @mousedown=${(event: MouseEvent) => event.preventDefault()}
                            @click=${() => this.choose(item)}
                            >${item.text}</li
                        >`
                )}
            </ul>
            <p role="status"
                >${!this.open ? nothing : this.loading ? 'Loading suggestions…' : this.failed ? 'Suggestions could not be loaded. Type to retry.' : this.items.length ? `${this.items.length} suggestions available.` : 'No suggestions found.'}</p
            >
        </div>`;
    }

    dispose() {
        this.close();
        this.input.removeEventListener('input', this.onInput);
        this.input.removeEventListener('focus', this.onFocus);
        this.input.removeEventListener('blur', this.onBlur);
        this.input.removeEventListener('keydown', this.onKeydown);
        this.input.removeEventListener('compositionstart', this.onCompositionStart);
        this.input.removeEventListener('compositionend', this.onCompositionEnd);
        for (const attribute of [
            'role',
            'aria-autocomplete',
            'aria-expanded',
            'aria-controls',
            'aria-busy',
            'aria-activedescendant',
            'aria-required',
        ])
            this.input.removeAttribute(attribute);
    }
}
