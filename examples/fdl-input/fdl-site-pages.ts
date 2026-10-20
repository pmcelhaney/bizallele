import './fdl-code-snippet';
import { documentationPages, renderReference } from './reference-pages';
import './fdl-example';
import compositionSource from './composition-view.ts?raw';
import compositionModelSource from './composition-rules.ts?raw';
import specializationSource from './specialization-view.ts?raw';
import specializationModelSource from './specialization-model.ts?raw';
import learningSource from './learning-view.ts?raw';
import learningModelSource from './learning-model.ts?raw';
import { renderChangeRule } from './change-rule-page';
import { renderEditableRecordset } from './editable-recordset-page';
import { renderIntegration } from './integration-page';
import { renderQuickstart } from './quickstart-page';
import { renderCategoryOverview } from './category-overview';
import type { ExplorerRecipe } from './modifier-explorer-recipes';
import { html } from 'lit';
import './fdl-delivery-experiment';
import './fdl-specialization-experiment';
import './fdl-learning-path';
import type { LearningState } from './fdl-learning-path';
import './fdl-composition-experiment';
import { highlightJavaScript, highlightMarkup } from './highlight-javascript';

export const sitePages = [
    { id: 'home', title: 'Home' },
    { id: 'how-it-works', title: 'How it Works' },
    { id: 'quickstart', title: 'Your first form' },
    { id: 'integration', title: 'Adapter and API contracts' },
    { id: 'reference', title: 'Documentation library' },
    { id: 'editable-recordset', title: 'Edit a recordset' },
    { id: 'change-a-rule', title: 'Change and test a rule' },
    { id: 'learn', title: 'Learn by exploring' },
    { id: 'composition', title: 'Combine the rules' },
    { id: 'categories', title: 'Modifier categories' },
    { id: 'contributing', title: 'Contributing' },
    ...documentationPages.map(function (page) {
        return { id: page.id, title: page.title };
    }),
] as const;
export type SitePage = (typeof sitePages)[number]['id'];

const definition = `import { field, Record } from 'bizallele';

const fields = {
    name: field.label('Name').required(),
};

const person = new Record(fields, { name: '' });
person.isValid(); // false

person.setField('name', 'Ada');
person.isValid(); // true`;

function renderModelDiagram(part: 'field' | 'record' | 'recordset') {
    const captions = {
        field: 'One field → one column',
        record: 'One record → one row',
        recordset: 'One recordset → the whole table',
    };
    return html`<figure class="model-diagram model-diagram--${part}">
        <table>
            <caption>${captions[part]}</caption>
            <thead
                ><tr
                    ><th scope="col">Name</th><th scope="col">City</th></tr
                ></thead
            >
            <tbody>
                <tr><td>Ada</td><td>London</td></tr>
                <tr><td>Grace</td><td>New York</td></tr>
            </tbody>
        </table>
    </figure>`;
}

export function renderSitePage(
    page: SitePage,
    learningState?: LearningState,
    compositionView?: HTMLElement,
    recipes: readonly ExplorerRecipe[] = []
) {
    if (page === 'reference' || page.startsWith('reference/'))
        return renderReference(page);
    if (page === 'change-a-rule') return renderChangeRule();
    if (page === 'editable-recordset') return renderEditableRecordset();
    if (page === 'integration') return renderIntegration();
    if (page === 'quickstart') return renderQuickstart();
    if (page === 'categories') return renderCategoryOverview(recipes);
    if (page === 'composition')
        return html`<article class="site-page"
            ><h1 tabindex="-1">Combine the rules</h1
            ><fdl-example
                heading="Combine the rules"
                .filenames=${['composition-rules.ts', 'composition-view.ts']}
                .sources=${{ 'composition-rules.ts': compositionModelSource, 'composition-view.ts': compositionSource }}
                >${compositionView ?? html`<fdl-composition-experiment></fdl-composition-experiment>`}</fdl-example
            ></article
        >`;
    if (page === 'learn')
        return html`<article class="site-page"
            ><h1 tabindex="-1">Learn by exploring</h1
            ><p class="description"
                >Build one delivery example from a field into a collection.
                Follow the questions in order or jump to the one you want to
                investigate.</p
            ><fdl-example
                heading="Learn by exploring"
                .filenames=${['learning-model.ts', 'learning-view.ts']}
                .sources=${{ 'learning-model.ts': learningModelSource, 'learning-view.ts': learningSource }}
                ><fdl-learning-path
                    .session=${learningState}
                ></fdl-learning-path></fdl-example
        ></article>`;
    if (page === 'home')
        return html` <article class="site-page">
            <h1 tabindex="-1">Genetic code for business rules.</h1>
            <p
                >Bizallele is an open source JavaScript and TypeScript library
                that makes business rules first-class entities, independent of
                UI frameworks and design systems. Define how your data behaves,
                and reuse the same rules across forms, tables, and
                <a href="#reference/docs/backend-validation"
                    >server-side validation</a
                >.</p
            >
            <p
                >Keep validation, formatting, dependencies, and conditional
                field state in a shared model. The definitions carry the rules;
                your components choose how to express them.</p
            >
            <p
                >Compose small field definitions into records and tables.
                Specialize them for different contexts without changing the
                originals.</p
            >
            <p
                >Already have a data schema? Bizallele can read existing
                <a href="#reference/docs/prisma">Prisma schemas</a>,
                <a href="#reference/docs/openapi">OpenAPI specifications</a>,
                and
                <a href="#reference/docs/zod">Zod schemas</a>
                to create field definitions, which you can extend with your
                application’s rules.</p
            >
            <p
                >Bizallele works with any framework. Plug it into your existing
                design system or start with the built-in example components.
                Accessibility is baked into those components, with labelled
                controls, keyboard interaction, and validation messages
                connected to the fields they describe.</p
            >
            <fdl-delivery-experiment></fdl-delivery-experiment>
            <p
                >A field definition describes how to turn input into a stored
                value, format it for display, check whether it is valid, and
                determine whether it is required, visible, or editable. These
                rules can depend on other values in the record: a delivery
                address, for example, can be required only when the customer
                chooses shipping.</p
            >
            <p
                >Without a shared model, that same rule can end up in a form’s
                input handlers, a separate validation function, and a table’s
                editing logic. Bizallele keeps the rule in the field definition.
                A form, a table, and a validation check can all use it, so
                changing the rule does not mean finding and updating several
                copies. You can also test it without rendering a screen.</p
            >
            <p
                >Small, composable abstractions give humans and coding agents
                less room to make mistakes. Declare a rule once; the model
                enforces it wherever it is used. Clear affordances in the
                example components make required fields, available choices, and
                validation feedback visible to the person using the form.</p
            >
            <p
                >Your UI components read Bizallele’s field behavior and record
                state to render controls and display validation messages. The
                application chooses the layout and workflow, and CSS controls
                the appearance. You can reuse the same model across different
                interfaces.</p
            >
            <h2>Three parts of the model</h2>
            <div class="model-concepts">
                <section class="model-concept" aria-labelledby="model-field">
                    <h3 id="model-field">Field</h3>
                    <p
                        >A field is a container for one element of data. Its
                        definition encapsulates rules such as what makes a value
                        valid and how to format it for display.</p
                    >
                    <p class="model-analogy">Like a column in a database.</p>
                    ${renderModelDiagram('field')}
                    <p class="model-example"
                        >The <strong>Name</strong> field has the same rules in
                        every record. For example, a name may be required and
                        displayed as text.</p
                    >
                    <fdl-code-snippet>
                        <pre><code>${highlightJavaScript(`const fields = {
    name: field.label('Name').required(),
    city: field.label('City'),
};`)}</code></pre>
                    </fdl-code-snippet>
                </section>
                <section class="model-concept" aria-labelledby="model-record">
                    <h3 id="model-record">Record</h3>
                    <p
                        >A record is a collection of fields bound to particular
                        values. Each field’s rules apply to its value in that
                        record.</p
                    >
                    <p class="model-analogy">Like a row in a database.</p>
                    ${renderModelDiagram('record')}
                    <p class="model-example"
                        >One record binds <strong>Name</strong> to “Ada” and
                        <strong>City</strong> to “London”.</p
                    >
                    <fdl-code-snippet>
                        <pre><code>${highlightJavaScript(`const person = new Record(fields, {
    name: 'Ada',
    city: 'London',
});`)}</code></pre>
                    </fdl-code-snippet>
                </section>
                <section
                    class="model-concept"
                    aria-labelledby="model-recordset"
                >
                    <h3 id="model-recordset">Recordset</h3>
                    <p
                        >A recordset is a collection of records that share field
                        definitions. You can work with the collection by sorting
                        and filtering its records.</p
                    >
                    <p class="model-analogy">Like a database table or view.</p>
                    ${renderModelDiagram('recordset')}
                    <p class="model-example"
                        >These two records form a
                        <strong>People</strong> recordset, with the same
                        <strong>Name</strong> and
                        <strong>City</strong> fields.</p
                    >
                    <fdl-code-snippet>
                        <pre><code>${highlightJavaScript(`const people = new Recordset(fields, [
    { name: 'Ada', city: 'London' },
    { name: 'Grace', city: 'New York' },
]);`)}</code></pre>
                    </fdl-code-snippet>
                </section>
            </div>
            <h2>From model to interface</h2>
            <p
                >The example components connect a field to a labelled control
                and a recordset to a table. Inspectors expose the stored values
                and field state alongside them. Your components can use the same
                model in any framework.</p
            >
            <p
                >Continue with <a href="#learn">Learn by exploring</a>, read
                <a href="#how-it-works">How it Works</a>, or read
                <a href="#integration">the adapter contract</a> for component
                responsibilities.</p
            >
            <div class="home-cta">
                <a class="primary" href="#quickstart"
                    >Build your first form <span aria-hidden="true">→</span></a
                >
            </div>
        </article>`;
    if (page === 'how-it-works')
        return html` <article class="site-page">
            <h1 tabindex="-1">How it Works</h1>
            <p class="description"
                >Define field behavior, attach it to record values, and let a
                component translate that state into an interface.</p
            >
            <h2>1. Define a field type</h2>
            <p
                >Start with the exported <code>field</code> instance and chain
                modifiers to add rules and metadata. Each modifier returns a new
                definition, so a shared base can be specialized for different
                uses.</p
            >
            <fdl-example
                heading="One base, independent specializations"
                .filenames=${['specialization-model.ts', 'specialization-view.ts']}
                .sources=${{ 'specialization-model.ts': specializationModelSource, 'specialization-view.ts': specializationSource }}
                ><fdl-specialization-experiment></fdl-specialization-experiment
            ></fdl-example>
            <h2>2. Create a record</h2>
            <p
                >A record connects field definitions to actual values and
                prepares their runtime behavior automatically. Parsing converts
                input into model values. Formatting produces display values.
                Validation checks the model against the declared rules.</p
            >
            <fdl-code-snippet>
                <pre
                    class="code markup"
                ><code>${highlightJavaScript(definition)}</code></pre>
            </fdl-code-snippet>
            <p
                >The record enforces requiredness without rendering a UI. A
                component reads the same rule to expose required state and its
                validation message.</p
            >
            <h2>3. Bind a component</h2
            ><p
                ><a href="#quickstart">Your first form</a> supplies the
                installation, adapter registration, and complete rendering setup
                for this binding.</p
            >
            <p
                >In these examples, <code>fdl-field</code> connects a record
                field to a native control. It handles the label, input events,
                and accessible field state. A view binds the record object using
                Lit’s property syntax:</p
            >
            <fdl-code-snippet>
                <pre
                    class="code markup"
                ><code>${highlightMarkup('<fdl-field .record=${person} field="name"></fdl-field>')}</code></pre>
            </fdl-code-snippet>
            <p
                >The component is the integration layer. Bizallele does not
                choose your page layout or visual theme. Other adapters can
                interpret the model for different interfaces.
                <a href="#integration">Integrate an existing component system</a
                >: read the adapter obligations, public types, composition
                rules, and current limits.</p
            >
            <h2>4. Express dependencies as predicates</h2>
            <p
                >For rules that depend on another field, a callback reads the
                current record. For example,
                <a href="#visible">visible()</a> can show an address only when
                shipping is selected.
                <a href="#required">required()</a> separately controls whether
                that address is required.</p
            >
            <h2>5. Reuse definitions in a collection</h2>
            <p
                >A <code>Recordset</code> applies field definitions to multiple
                records.
                <a href="#editable-recordset">Edit a recordset</a> demonstrates
                actual row identity, a shared detail editor, validation,
                filtering, sorting, and scoped totals. The table example reads
                comparison, filtering, formatting, and alignment behavior from
                those definitions. Read the
                <a href="#integration">Record and Recordset API references</a>
                for loading, events, and lifecycle. Start with
                <a href="#compareFunction">compareFunction()</a> or
                <a href="#filter">filter()</a>.</p
            >
            <h2>Who owns what?</h2>
            <dl class="concepts"
                ><dt>Bizallele</dt
                ><dd
                    >Reusable parsing, formatting, validation, dependencies, and
                    field state.</dd
                ><dt>Component</dt
                ><dd
                    >Accessible markup, labels, keyboard interaction, focus, and
                    input events.</dd
                ><dt>Application and CSS</dt
                ><dd>Workflow, page layout, and visual presentation.</dd></dl
            >
        </article>`;
    return html` <article class="site-page">
        <h1 tabindex="-1">Contributing</h1>
        <p class="description"
            >Contributions should keep field behavior, component semantics,
            documentation, and examples consistent.</p
        >
        <h2>Get the repository</h2>
        <p
            >Start with the
            <a href="https://github.com/pmcelhaney/bizallele"
                >Bizallele repository</a
            >
            and its <a href="#reference/AGENTS">contributor guide</a>. Read the
            <a href="#reference/docs/design-principles">design principles</a>
            before changing modifiers, components, or presentation.</p
        >
        <h2>Work in the root checkout</h2>
        <p
            >Check Git status before starting and preserve other tasks’ changes.
            Work directly on main in the repository root. Verify and commit each
            coherent batch, staging only its files. Create a branch or linked
            worktree only when explicitly requested, and keep commits local
            until a push is requested.</p
        >
        <h2>Install and run locally</h2>
        <fdl-code-snippet>
            <pre class="code markup"><code>npm install
npm run docs:dev</code></pre>
        </fdl-code-snippet>
        <p
            >Open the root URL printed by the local server to view this site.
            Changes to the example source update the preview.</p
        >
        <h2>Verify your changes</h2>
        <fdl-code-snippet>
            <pre class="code markup"><code>npm test
npm run typecheck
npm run docs:build</code></pre>
        </fdl-code-snippet>
        <p
            >Follow
            <a href="#change-a-rule"
                >a complete rule change with its source map and behavior
                tests</a
            >. Add focused coverage for behavior changes. If an exported API
            changes, update its public behavior, declarations, and documentation
            together. Check live examples in the browser, including keyboard
            interaction and narrow screens.</p
        >
        <h2>Keep the boundaries clear</h2>
        <ul
            ><li
                >Put reusable model rules in field types, records, or
                recordsets.</li
            ><li
                >Keep DOM structure, focus, and event handling in
                components.</li
            ><li>Use CSS for visual expression.</li
            ><li
                >Document adapter limitations instead of simulating unsupported
                behavior.</li
            ></ul
        >
        <h2>Submit a focused change</h2>
        <p
            >Verify and commit each coherent batch, stage only its files, and
            follow the repository’s integration workflow. Describe what changes,
            why it is needed, and how you checked it. Local previews do not
            authorize deployment.</p
        >
    </article>`;
}
