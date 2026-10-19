import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import documentationPages from 'virtual:fdl-documentation';

export { documentationPages };

export function renderReference(page: string) {
    const document = documentationPages.find(function (entry) {
        return entry.id === page;
    });
    if (!document)
        return html`<article class="site-page reference-page">
            <h1 tabindex="-1">Documentation library</h1>
            <p
                >API contracts, integration guides, contributor guidance, and
                architecture decisions. These pages are built from the same
                source as this version of the library.</p
            >
            ${[
                [
                    'API and integration',
                    function (file: string) {
                        return /^docs\/(field-type|record|recordset|form-element|adapter-contract|scheduling-example|prisma|openapi|zod)\.md$/.test(
                            file
                        );
                    },
                ],
                [
                    'Architecture and project guides',
                    function (file: string) {
                        return (
                            file.startsWith('docs/') &&
                            !file.startsWith('docs/adr/') &&
                            !/^docs\/(field-type|record|recordset|form-element|adapter-contract|scheduling-example|prisma|openapi|zod)\.md$/.test(
                                file
                            )
                        );
                    },
                ],
                [
                    'Architecture decisions',
                    function (file: string) {
                        return file.startsWith('docs/adr/');
                    },
                ],
                [
                    'Repository and contribution',
                    function (file: string) {
                        return !file.startsWith('docs/');
                    },
                ],
            ].map(
                ([title, matches]) =>
                    html`<section
                        ><h2>${title}</h2
                        ><ul>
                            ${documentationPages
                                .filter(function (entry) {
                                    return (
                                        matches as (file: string) => boolean
                                    )(entry.file);
                                })
                                .map(
                                    entry =>
                                        html`<li
                                            ><a href=${`#${entry.id}`}
                                                >${entry.title}</a
                                            ></li
                                        >`
                                )}
                        </ul></section
                    >`
            )}
        </article>`;
    return html`<article class="site-page reference-page">
        <p><a href="#reference">← Documentation library</a></p>
        <nav class="reference-toc" aria-label="On this page">
            <strong>On this page</strong>
            <ul
                >${document.headings.filter(heading => heading.level === 2).map(heading => html`<li><a href=${`#${document.id}?section=${encodeURIComponent(heading.id)}`}>${heading.title}</a></li>`)}</ul
            >
        </nav>
        <div class="reference-content">${unsafeHTML(document.html)}</div>
    </article>`;
}
