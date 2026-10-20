import * as lit from 'lit';
import * as keyed from 'lit/directives/keyed.js';
import * as unsafeHtml from 'lit/directives/unsafe-html.js';
import * as staticHtml from 'lit/static-html.js';
import * as bizallele from 'bizallele';
import * as inputTypes from 'bizallele/types/input-types.types';
import * as recordContext from 'bizallele/lit/record-context';
import 'bizallele/lit/fdl-address';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-record';
import 'bizallele/lit/fdl-table';
import { createExampleLoader } from './example-module-loader';
import originalSources from 'virtual:example-sources';

function report(type: string, extra: object = {}) {
    parent.postMessage({ type, ...extra }, location.origin);
}

window.addEventListener('error', event =>
    report('example-error', { message: event.message })
);
window.addEventListener('unhandledrejection', event =>
    report('example-error', { message: String(event.reason) })
);
window.addEventListener('message', async event => {
    if (
        event.source !== parent ||
        event.origin !== location.origin ||
        event.data.type !== 'example-run'
    )
        return;
    try {
        const { files, markup, styles } = event.data;
        const sources = { ...originalSources };
        const modelFile = Object.keys(files).find(
            file => !file.endsWith('.css')
        )!;
        const modelPath = Object.keys(sources).find(
            path => path === `./${modelFile}` || path.endsWith(`/${modelFile}`)
        );
        if (!modelPath) throw new Error(`Source unavailable: ${modelFile}`);
        const directory = modelPath.slice(0, modelPath.lastIndexOf('/') + 1);
        for (const [filename, source] of Object.entries(files))
            sources[directory + filename] = source as string;
        const style = document.createElement('style');
        style.textContent = `${styles}\nhtml, body { margin: 0; } body { font-family: system-ui, sans-serif; } #example { display: flow-root; }\n${files['example.css'] ?? ''}`;
        document.head.append(style);
        const load = createExampleLoader(sources, {
            lit,
            'lit/directives/keyed.js': keyed,
            'lit/directives/unsafe-html.js': unsafeHtml,
            'lit/static-html.js': staticHtml,
            bizallele: bizallele,
            'bizallele/types/input-types.types': inputTypes,
            'bizallele/lit/record-context': recordContext,
            'bizallele/lit/fdl-address': {},
            'bizallele/lit/fdl-field': {},
            'bizallele/lit/fdl-record': {},
            'bizallele/lit/fdl-table': {},
        });
        const content = document.createElement('template');
        content.innerHTML = markup;
        // Documentation reset controls are replaced by the frame's Restore original button.
        content.content
            .querySelectorAll('.section-bar')
            .forEach(element => element.remove());
        const tags = new Set(
            Array.from(
                content.content.querySelectorAll('*'),
                element => element.localName
            ).filter(tag => tag.includes('-'))
        );
        for (const tag of tags) {
            if (customElements.get(tag)) continue;
            const entry = Object.keys(sources).find(
                path =>
                    sources[path].includes(`customElements.define('${tag}'`) ||
                    sources[path].includes(`customElements.define("${tag}"`)
            );
            if (!entry)
                throw new Error(`Cannot find example component: ${tag}`);
            load(entry);
        }
        // Compile every displayed module, including one removed from the view's imports.
        for (const filename of Object.keys(files))
            if (!filename.endsWith('.css')) load(directory + filename);
        document.querySelector('#example')!.append(content.content);
        async function settle(root: ParentNode) {
            for (const element of Array.from(root.children)) {
                if ('updateComplete' in element)
                    await (element as any).updateComplete;
                await settle(element);
                if (element.shadowRoot) await settle(element.shadowRoot);
            }
        }
        await settle(document.body);
        // Example CSS must reach the same component shadow roots as its original styles.
        if ('example.css' in files) {
            const observed = new WeakSet<Node>();
            function applyStyles(root: Document | ShadowRoot) {
                if (!observed.has(root)) {
                    observed.add(root);
                    if (root instanceof ShadowRoot) {
                        const styledRoot = root as ShadowRoot & {
                            adoptedStyleSheets: CSSStyleSheet[];
                        };
                        if ('replaceSync' in CSSStyleSheet.prototype) {
                            function stylesheet(css: string) {
                                const sheet =
                                    new CSSStyleSheet() as CSSStyleSheet & {
                                        replaceSync(css: string): void;
                                    };
                                sheet.replaceSync(css);
                                return sheet;
                            }
                            const original = stylesheet(
                                originalSources[directory + 'example.css'] ?? ''
                            );
                            const selectors = new Set(
                                Array.from(
                                    original.cssRules,
                                    rule => (rule as CSSStyleRule).selectorText
                                )
                            );
                            function withoutExampleRules(sheet: CSSStyleSheet) {
                                const rules = Array.from(sheet.cssRules);
                                const remaining = rules.filter(
                                    rule =>
                                        !selectors.has(
                                            (rule as CSSStyleRule).selectorText
                                        )
                                );
                                return remaining.length === rules.length
                                    ? sheet
                                    : stylesheet(
                                          remaining
                                              .map(rule => rule.cssText)
                                              .join('\n')
                                      );
                            }
                            styledRoot.adoptedStyleSheets = [
                                ...styledRoot.adoptedStyleSheets.map(
                                    withoutExampleRules
                                ),
                                stylesheet(files['example.css']),
                            ];
                        } else {
                            const editedSheet = document.createElement('style');
                            editedSheet.textContent = files['example.css'];
                            root.append(editedSheet);
                        }
                    }
                    new MutationObserver(() => applyStyles(root)).observe(
                        root,
                        { childList: true, subtree: true }
                    );
                }
                for (const element of root.querySelectorAll('*'))
                    if (element.shadowRoot) applyStyles(element.shadowRoot);
            }
            applyStyles(document);
        }
        report('example-saved');
        const observer = new ResizeObserver(() =>
            report('example-height', { height: document.body.scrollHeight })
        );
        observer.observe(document.body);
    } catch (error) {
        report('example-error', {
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
report('example-ready');
