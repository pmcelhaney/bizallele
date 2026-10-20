import './fdl-code-snippet';
import { LitElement, html, css, type PropertyValues } from 'lit';
import { highlightSourceCode, highlightModifier } from './highlight-javascript';
import { exampleTheme } from './example-theme';

/** A collapsible live example with source tabs and slotted example content. */
export class FdlExample extends LitElement {
    static properties = {
        heading: { type: String },
        expanded: { type: Boolean },
        filenames: { attribute: false },
        sources: { attribute: false },
        activeTab: { state: true },
        modifier: { type: String },
        fullscreen: { state: true },
        fullscreenError: { state: true },
        fullscreenTab: { state: true },
        editing: { state: true },
        savedSources: { state: true },
        saving: { state: true },
        editError: { state: true },
    };
    heading = 'Example';
    expanded = true;
    modifier = '';
    filenames: readonly string[] = [];
    sources: Readonly<Record<string, string>> = {};
    private activeTab = '';
    private fullscreen = false;
    private fullscreenError = '';
    private fullscreenTab = '';
    private editing = '';
    private drafts: Record<string, string> = {};
    private savedSources: Record<string, string> = {};
    private saving = false;
    private editError = '';
    private preview?: HTMLIFrameElement;
    private pendingPreview?: HTMLIFrameElement;
    private previewListener?: (event: MessageEvent) => void;
    private previewTimeout?: ReturnType<typeof setTimeout>;

    private sourceFor(filename: string) {
        return this.savedSources[filename] ?? this.sources[filename] ?? '';
    }

    private startEditing(filename: string) {
        this.drafts[filename] ??= this.sourceFor(filename);
        this.editing = filename;
        this.editError = '';
        this.updateComplete.then(() => {
            const editor =
                this.shadowRoot?.querySelector<HTMLTextAreaElement>(
                    '.code-editor'
                );
            if (!editor) return;
            // Assigning the source value leaves the caret at the end of the file.
            editor.setSelectionRange(0, 0);
            editor.focus({ preventScroll: true });
            editor.scrollTop = 0;
            editor.scrollLeft = 0;
        });
    }

    private cancelEditing() {
        delete this.drafts[this.editing];
        this.editing = '';
        this.editError = '';
    }

    private stopPendingPreview() {
        clearTimeout(this.previewTimeout);
        if (this.previewListener)
            window.removeEventListener('message', this.previewListener);
        this.pendingPreview?.remove();
        this.pendingPreview = undefined;
    }

    private restoreOriginal() {
        this.stopPendingPreview();
        this.preview?.remove();
        this.preview = undefined;
        this.savedSources = {};
        this.drafts = {};
        this.editing = '';
        this.saving = false;
        this.editError = '';
        this.shadowRoot
            ?.querySelector('slot:not([name])')
            ?.removeAttribute('hidden');
    }

    disconnectedCallback() {
        this.restoreOriginal();
        super.disconnectedCallback();
    }

    private saveFile() {
        const filename = this.editing;
        if (!filename || this.saving) return;
        this.saving = true;
        this.editError = '';
        this.stopPendingPreview();
        const files = Object.fromEntries(
            this.filenames.map(file => [
                file,
                file === filename ? this.drafts[file] : this.sourceFor(file),
            ])
        );
        const iframe = document.createElement('iframe');
        iframe.title = `${this.heading}: edited preview`;
        iframe.className = 'edited-preview';
        iframe.hidden = true;
        iframe.src = new URL('example-preview.html', document.baseURI).href;
        this.pendingPreview = iframe;
        let styles = '';
        let ancestor: Node | null = this;
        while (ancestor) {
            if (ancestor instanceof ShadowRoot) {
                for (const sheet of (
                    ancestor as ShadowRoot & {
                        adoptedStyleSheets?: CSSStyleSheet[];
                    }
                ).adoptedStyleSheets ?? []) {
                    styles += Array.from(
                        sheet.cssRules,
                        rule => rule.cssText
                    ).join('\n');
                }
                for (const style of ancestor.querySelectorAll('style'))
                    styles += style.textContent;
                ancestor = ancestor.host;
            } else ancestor = ancestor.parentNode;
        }
        const computed = getComputedStyle(this);
        styles += `:root { ${Array.from(computed)
            .filter(name => name.startsWith('--'))
            .map(name => `${name}: ${computed.getPropertyValue(name)};`)
            .join(' ')} }`;
        function cleanMarkup(element: Element): Element {
            const clone = element.cloneNode(false) as Element;
            // Recreate component instances, rather than copying their rendered light DOM.
            if (!customElements.get(element.localName)) {
                for (const child of element.childNodes) {
                    clone.append(
                        child instanceof Element
                            ? cleanMarkup(child)
                            : child.cloneNode(true)
                    );
                }
            }
            return clone;
        }
        const markup = Array.from(this.children)
            .filter(child => !child.hasAttribute('slot'))
            .map(child => cleanMarkup(child).outerHTML)
            .join('');
        const fail = (message: string) => {
            this.editError = message;
            this.saving = false;
            this.stopPendingPreview();
        };
        this.previewListener = (event: MessageEvent) => {
            if (
                !iframe.contentWindow ||
                event.source !== iframe.contentWindow ||
                event.origin !== location.origin
            )
                return;
            if (event.data.type === 'example-ready')
                iframe.contentWindow!.postMessage(
                    { type: 'example-run', files, markup, styles },
                    location.origin
                );
            if (event.data.type === 'example-error') fail(event.data.message);
            if (
                event.data.type === 'example-saved' &&
                this.pendingPreview === iframe
            ) {
                clearTimeout(this.previewTimeout);
                this.preview?.remove();
                this.preview = iframe;
                this.pendingPreview = undefined;
                iframe.hidden = false;
                this.shadowRoot!.querySelector(
                    'slot:not([name])'
                )!.setAttribute('hidden', '');
                this.savedSources = files;
                delete this.drafts[filename];
                this.editing = '';
                this.saving = false;
                if (!this.fullscreen) this.activeTab = '';
                this.updateComplete.then(() =>
                    this.shadowRoot
                        ?.querySelector<HTMLButtonElement>(
                            this.fullscreen
                                ? '.tab-panel:not([hidden]) .edit-toolbar button'
                                : '#example-tab-0'
                        )
                        ?.focus()
                );
            }
            if (event.data.type === 'example-height')
                iframe.style.height = `${Math.max(100, Math.min(10000, event.data.height))}px`;
        };
        window.addEventListener('message', this.previewListener);
        this.previewTimeout = setTimeout(
            () => fail('The preview did not finish loading. Try saving again.'),
            30000
        );
        this.shadowRoot!.querySelector('.preview-container')!.append(iframe);
    }

    private renderSource(filename: string, index: number) {
        if (this.editing === filename)
            return html` <div class="edit-toolbar">
                    <button ?disabled=${this.saving} @click=${this.saveFile}
                        >${this.saving ? 'Saving…' : 'Save and run'}</button
                    >
                    <button
                        ?disabled=${this.saving}
                        @click=${this.cancelEditing}
                        >Cancel</button
                    >
                    <span
                        >Edits apply to this preview until you leave or reload
                        the page.</span
                    >
                </div>
                <textarea
                    class="code-editor"
                    aria-label=${`Edit ${filename}`}
                    spellcheck="false"
                    .value=${this.drafts[filename]}
                    ?disabled=${this.saving}
                    @input=${(event: Event) => {
                        this.drafts[filename] = (
                            event.target as HTMLTextAreaElement
                        ).value;
                    }}
                    @keydown=${(event: KeyboardEvent) => {
                        if (
                            (event.ctrlKey || event.metaKey) &&
                            event.key === 's'
                        ) {
                            event.preventDefault();
                            this.saveFile();
                        }
                    }}
                ></textarea>
                ${this.editError ? html`<pre class="edit-error" role="alert">${this.editError}</pre>` : ''}`;
        return html`<div class="edit-toolbar"
                ><button
                    ?disabled=${this.saving || !!this.editing}
                    @click=${() => this.startEditing(filename)}
                    >Edit</button
                ></div
            >
            <fdl-code-snippet>
                <pre
                    class="code"
                    tabindex="0"
                    aria-label=${`${filename} source code`}
                ><code>${this.modifier && index === 0 ? highlightModifier(this.sourceFor(filename), this.modifier) : highlightSourceCode(this.sourceFor(filename))}</code></pre>
            </fdl-code-snippet>`;
    }

    constructor() {
        super();
        this.addEventListener('fullscreenchange', this.syncFullscreen);
    }

    private syncFullscreen() {
        const root = this.getRootNode() as Document | ShadowRoot;
        this.fullscreen = root.fullscreenElement === this;
    }

    private async toggleFullscreen() {
        this.fullscreenError = '';
        try {
            if (this.fullscreen) {
                await this.ownerDocument.exitFullscreen();
            } else {
                await this.requestFullscreen();
            }
        } catch {
            this.fullscreenError =
                'Full screen is unavailable. Please try again.';
        }
    }

    protected willUpdate(_changed: PropertyValues<this>) {
        if (!this.filenames.includes(this.activeTab)) this.activeTab = '';
    }

    private selectTab(filename: string) {
        if (this.fullscreen) this.fullscreenTab = filename;
        else this.activeTab = filename;
    }

    private selectedFile() {
        if (this.filenames.includes(this.fullscreenTab))
            return this.fullscreenTab;
        return this.filenames.includes(this.activeTab)
            ? this.activeTab
            : this.filenames[0];
    }

    private renderTabs() {
        const tabs = this.fullscreen ? this.filenames : ['', ...this.filenames];
        const selected = this.fullscreen ? this.selectedFile() : this.activeTab;
        return html`<div
            class="tabs"
            role="tablist"
            aria-label=${`${this.heading} ${this.fullscreen ? 'source files' : 'views'}`}
        >
            ${tabs.map((filename, index) => {
                const panelIndex =
                    filename === '' ? 0 : this.filenames.indexOf(filename) + 1;
                return html`<button
                    id=${`example-tab-${panelIndex}`}
                    role="tab"
                    aria-selected=${selected === filename}
                    aria-controls=${`example-panel-${panelIndex}`}
                    tabindex=${selected === filename ? 0 : -1}
                    @click=${() => this.selectTab(filename)}
                    @keydown=${(event: KeyboardEvent) => this.navigateTabs(event, index)}
                    >${filename || 'Interactive example'}</button
                >`;
            })}
        </div>`;
    }

    render() {
        return html`<details ?open=${this.expanded}>
            <summary>
                <h2>${this.heading}</h2>
                <span class="expand-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </span>
            </summary>
            <div class="example-content">
                <slot name="description"></slot>
                <div class="view-controls">
                    ${this.fullscreen ? '' : this.renderTabs()}
                    ${Object.keys(this.savedSources).length ? html`<button class="restore-button" @click=${this.restoreOriginal}>Restore original</button>` : ''}
                    <button
                        type="button"
                        class="fullscreen-button"
                        ?hidden=${typeof this.requestFullscreen !== 'function'}
                        aria-label=${`${this.fullscreen ? 'Exit full screen' : 'Expand to full screen'}: ${this.heading}`}
                        aria-pressed=${this.fullscreen}
                        @click=${this.toggleFullscreen}
                    >
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d=${
                                    this.fullscreen
                                        ? 'M9 3v6H3m12-6v6h6M9 21v-6H3m12 6v-6h6'
                                        : 'M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6'
                                }
                            />
                        </svg>
                        ${this.fullscreen ? 'Exit full screen' : 'Full screen'}
                    </button>
                </div>
                <p
                    class="fullscreen-error"
                    role="status"
                    ?hidden=${!this.fullscreenError}
                    >${this.fullscreenError}</p
                >
                ${this.editError && !this.editing ? html`<p class="edit-error" role="alert">${this.editError}</p>` : ''}
                <div class="example-layout">
                    <div
                        id="example-panel-0"
                        class="tab-panel"
                        role=${this.fullscreen ? 'region' : 'tabpanel'}
                        aria-labelledby=${this.fullscreen ? 'interactive-heading' : 'example-tab-0'}
                        ?hidden=${!this.fullscreen && this.activeTab !== ''}
                    >
                        ${this.fullscreen ? html`<h3 id="interactive-heading">Interactive example</h3>` : ''}
                        <slot></slot>
                        <div class="preview-container"></div>
                    </div>
                    <div class="source-files">
                        ${this.fullscreen && this.filenames.length ? this.renderTabs() : ''}
                        ${this.filenames.map(
                            (filename, index) =>
                                html`<div
                                    id=${`example-panel-${index + 1}`}
                                    class="tab-panel"
                                    role="tabpanel"
                                    aria-labelledby=${`example-tab-${index + 1}`}
                                    ?hidden=${(this.fullscreen ? this.selectedFile() : this.activeTab) !== filename}
                                >
                                    ${this.renderSource(filename, index)}
                                </div>`
                        )}
                    </div>
                </div>
            </div>
        </details>`;
    }

    private navigateTabs(event: KeyboardEvent, index: number) {
        const tabs = this.fullscreen ? this.filenames : ['', ...this.filenames];
        let next: number;
        switch (event.key) {
            case 'ArrowRight':
                next = (index + 1) % tabs.length;
                break;
            case 'ArrowLeft':
                next = (index + tabs.length - 1) % tabs.length;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = tabs.length - 1;
                break;
            default:
                return;
        }
        event.preventDefault();
        this.selectTab(tabs[next]);
        this.shadowRoot!.querySelector<HTMLButtonElement>(
            `#example-tab-${tabs[next] === '' ? 0 : this.filenames.indexOf(tabs[next]) + 1}`
        )!.focus();
    }
    static styles = css`
        :host {
            display: block;
            margin: 24px 0 32px;
        }
        :host(:fullscreen) {
            --example-inspector-columns: minmax(0, 1fr);
            margin: 0;
            padding: 16px;
            overflow: auto;
            background: #fff;
        }
        :host(:fullscreen) details {
            min-height: 100%;
        }
        .example-layout,
        .source-files {
            display: contents;
        }
        :host(:fullscreen) .example-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            align-items: start;
            gap: 24px;
            margin-top: 20px;
        }
        :host(:fullscreen) .example-layout > .tab-panel {
            padding-top: 0;
        }
        :host(:fullscreen) .source-files {
            display: block;
            min-width: 0;
        }
        .example-layout > .tab-panel {
            min-width: 0;
        }
        slot[hidden],
        .edited-preview[hidden] {
            display: none;
        }
        .edited-preview {
            display: block;
            width: 100%;
            min-height: 180px;
            border: 0;
        }
        .edit-toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
        }
        .edit-toolbar span {
            color: #475569;
            font-size: 0.875rem;
        }
        .edit-toolbar button,
        .restore-button {
            min-height: 44px;
            padding: 8px 14px;
            border: 1px solid #bfcee8;
            border-radius: 6px;
            background: #f8fafc;
            color: #172554;
            font: inherit;
            cursor: pointer;
        }
        .edit-toolbar button:focus-visible,
        .restore-button:focus-visible,
        .code-editor:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 2px;
        }
        button:disabled {
            opacity: 0.6;
            cursor: wait;
        }
        .code-editor {
            display: block;
            width: 100%;
            min-height: 400px;
            resize: vertical;
            padding: 20px;
            border: 1px solid #bfcee8;
            border-radius: 8px;
            background: #0f172a;
            color: #e2e8f0;
            font: 0.875rem/1.7 monospace;
            tab-size: 2;
            white-space: pre;
            overflow: auto;
        }
        .edit-error {
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            color: #991b1b;
        }
        .code:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: -3px;
        }
        * {
            box-sizing: border-box;
        }
        details {
            border: 1px solid #bfcee8;
            border-radius: 12px;
            background: #fff;
        }
        summary {
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 48px;
            padding: 12px 16px;
            border-radius: 8px;
            background: #f8fafc;
            color: #172554;
            cursor: pointer;
            list-style: none;
            transition: background-color 160ms;
        }
        summary::-webkit-details-marker {
            display: none;
        }
        summary:hover {
            background: #f1f5f9;
        }
        summary:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 4px;
        }
        .expand-icon {
            display: grid;
            place-items: center;
            flex-shrink: 0;
            color: #475569;
        }
        svg {
            width: 24px;
            height: 24px;
            stroke: currentColor;
            stroke-width: 1.75;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        h2 {
            flex: 1;
            min-width: 0;
            margin: 0;
            font-size: 1rem;
            font-weight: 600;
            line-height: 1.5;
            overflow-wrap: anywhere;
        }
        .expand-icon {
            width: 24px;
            height: 24px;
            transition: transform 160ms;
        }
        details[open] > summary {
            border-bottom: 1px solid #bfcee8;
            border-radius: 8px 8px 0 0;
        }
        details[open] .expand-icon {
            transform: rotate(180deg);
        }
        .example-content {
            padding: 4px 24px 24px;
        }
        p {
            line-height: 1.6;
        }
        .view-controls {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
            margin-top: 20px;
        }
        .fullscreen-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 44px;
            margin-left: auto;
            padding: 8px 12px;
            border: 1px solid #bfcee8;
            border-radius: 6px;
            background: #f8fafc;
            color: #172554;
            font: inherit;
            cursor: pointer;
        }
        .fullscreen-button[hidden] {
            display: none;
        }
        .fullscreen-button:hover {
            background: #eff6ff;
        }
        .fullscreen-button:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 2px;
        }
        .tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            border-bottom: 1px solid var(--example-border);
        }
        .example-content > .tabs {
            margin-top: 24px;
        }
        h3 {
            margin: 0 0 12px;
            font-size: 1rem;
            overflow-wrap: anywhere;
        }
        .tabs button {
            border: 0;
            border-bottom: 3px solid transparent;
            border-radius: 4px 4px 0 0;
            padding: 10px 14px;
            background: transparent;
            color: #475569;
            cursor: pointer;
            font: inherit;
            font-weight: 600;
        }
        .tabs button[aria-selected='true'] {
            border-bottom-color: #2563eb;
            color: #1d4ed8;
            background: #eff6ff;
        }
        .tabs button:focus-visible {
            outline: 3px solid #2563eb;
            outline-offset: 2px;
        }
        .tab-panel {
            padding-top: 20px;
        }
        .code {
            max-height: 600px;
            margin: 0;
            padding: 20px;
            border-radius: var(--example-radius);
            background: #0f172a;
            color: #e2e8f0;
            font: 0.875rem/1.7 monospace;
            overflow: auto;
            tab-size: 2;
        }
        .code-line {
            display: inline-block;
            min-width: 100%;
            width: max-content;
            border-left: 4px solid transparent;
            padding: 0 8px;
        }
        .focused-line {
            border-left-color: #60a5fa;
            background: #1e3a5f;
        }
        .syntax-comment {
            color: #a5b4c8;
            font-style: italic;
        }
        .syntax-string,
        .syntax-regex {
            color: #a7f3d0;
        }
        .syntax-keyword {
            color: #c4b5fd;
        }
        .syntax-builtin {
            color: #7dd3fc;
        }
        .syntax-function {
            color: #93c5fd;
        }
        .syntax-number,
        .syntax-literal {
            color: #fdba74;
        }
        .syntax-punctuation {
            color: #cbd5e1;
        }
        ::slotted([slot='description']) {
            margin: 16px 0;
            line-height: 1.6;
        }
        @media (max-width: 480px) {
            .example-content {
                padding: 4px 16px 16px;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            summary,
            .expand-icon {
                transition: none;
            }
        }
        @media (forced-colors: active) {
            details,
            details[open] > summary,
            .expand-icon {
                border-color: CanvasText;
            }
            summary,
            summary:hover {
                background: Canvas;
                color: CanvasText;
            }
        }
        ${exampleTheme}
    `;
}
customElements.define('fdl-example', FdlExample);
