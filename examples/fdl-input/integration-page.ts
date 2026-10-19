import { html } from 'lit';
import { categoryIcon } from './category-icon';
function reference(file: string) {
    return `#reference/${file.replace(/\.md$/, '')}`;
}

export function renderIntegration() {
    return html`<article class="site-page integration-page"
        ><header class="integration-header">
            <span class="integration-eyebrow"
                >${categoryIcon('Adapter contracts')} Build your
                integration</span
            >
            <h1 tabindex="-1">Adapter and API contracts</h1>
            <p class="description"
                >Keep business behavior in the model and translate it into your
                component system’s accessible interface.</p
            >
        </header>
        <ol class="integration-flow" aria-label="From model to interface">
            <li
                >${categoryIcon('Values')}<div
                    ><strong>Model behavior</strong
                    ><span>Values, rules, and field state</span></div
                ></li
            >
            <li
                >${categoryIcon('Input')}<div
                    ><strong>Accessible components</strong
                    ><span>Controls, interaction, and focus</span></div
                ></li
            >
            <li
                >${categoryIcon('Display')}<div
                    ><strong>Visual theme</strong
                    ><span>Layout, color, and typography</span></div
                ></li
            >
        </ol>
        <p>
            The Lit elements used on this site are example implementations of
            this contract. You can build components in any framework using
            Bizallele’s model APIs. Your components do not need to extend
            <code>FormElement</code> or use the example custom-element names;
            they need to honor the same model behavior and accessible
            interaction responsibilities described below.
        </p>
        <h2>Public references</h2>
        <div class="integration-references">
            ${[
                [
                    'Values',
                    'FieldType',
                    'Setting types and modifier composition',
                    'docs/field-type.md',
                ],
                [
                    'Input',
                    'Record',
                    'Parsing, validation, change events, and reset',
                    'docs/record.md',
                ],
                [
                    'Tables',
                    'Recordset',
                    'Loading, identity, sorting, filtering, and pagination',
                    'docs/recordset.md',
                ],
                [
                    'Adapter contracts',
                    'Adapter contract',
                    'Component obligations and current limits',
                    'docs/adapter-contract.md',
                ],
                [
                    'Input',
                    'Lit FormElement',
                    'Integration with the example component layer',
                    'docs/form-element.md',
                ],
                [
                    'Validation',
                    'Design principles',
                    'Architecture boundaries and prohibited shortcuts',
                    'docs/design-principles.md',
                ],
            ].map(
                ([category, title, description, file]) => html`
                    <a class="integration-reference" href=${reference(file)}>
                        ${categoryIcon(category)}<span
                            ><strong>${title}</strong
                            ><span>${description}</span></span
                        ><span aria-hidden="true">→</span>
                    </a>
                `
            )}
        </div>
        <p class="integration-types"
            >Working in TypeScript? The
            <a href="#reference/docs/field-type?section=field-operations"
                >setting type reference</a
            >
            explains callback inputs and exported types. Browse the
            <a href="#reference">documentation library</a> for all API
            references, project guides, and architecture decisions.
        </p>
        <p
            >Starting from a Prisma schema?
            <a href="#reference/docs/prisma"
                >Translate Prisma fields into Bizallele definitions</a
            >, then add application behavior with ordinary modifiers.</p
        >
        <p
            >Starting from an API schema?
            <a href="#reference/docs/openapi"
                >Translate OpenAPI properties into Bizallele definitions</a
            >, including nested values, arrays, composition, and sibling
            validation rules.</p
        >
        <section
            class="integration-note"
            aria-labelledby="legacy-configuration"
        >
            <h2 id="legacy-configuration"
                >${categoryIcon('Adapter contracts')} Legacy example
                configuration</h2
            ><p
                >The current Lit adapter chooses a native
                <code>select</code> when a field provides options and chooses a
                <code>textarea</code> when <code>rowCount()</code> is
                configured. <code>rowCount()</code> remains a deprecated
                compatibility API for textarea sizing; new adapters should keep
                element choice and sizing in renderer configuration and
                styles.</p
            >
        </section>
        <h2>${categoryIcon('Values')} Composition rules</h2>
        <table
            ><thead
                ><tr
                    ><th scope="col">Modifier kind</th
                    ><th scope="col">Composition</th></tr
                ></thead
            ><tbody>
                <tr
                    ><th scope="row"
                        ><span class="integration-row-label"
                            >${categoryIcon('Values')}All modifiers</span
                        ></th
                    ><td
                        >Return a new definition; the source definition is
                        unchanged. Records prepare builders at their input
                        boundary.</td
                    ></tr
                >
                <tr
                    ><th scope="row"
                        ><span class="integration-row-label"
                            >${categoryIcon('Display')}Parsers and
                            formatters</span
                        ></th
                    ><td
                        >Run as ordered pipelines; each receives the preceding
                        result.</td
                    ></tr
                >
                <tr
                    ><th scope="row"
                        ><span class="integration-row-label"
                            >${categoryIcon('Validation')}Validators</span
                        ></th
                    ><td
                        >Accumulate named rules. Requiredness and visibility
                        remain independent.</td
                    ></tr
                >
                <tr
                    ><th scope="row"
                        ><span class="integration-row-label"
                            >${categoryIcon('Conditional state')}Visibility
                            predicates</span
                        ></th
                    ><td>All declared predicates must pass.</td></tr
                >
                <tr
                    ><th scope="row"
                        ><span class="integration-row-label"
                            >${categoryIcon('Values')}Scalar settings</span
                        ></th
                    ><td
                        >A later setting replaces the earlier value; inspect
                        each modifier’s reference for exceptions and
                        accumulation rules.</td
                    ></tr
                >
            </tbody></table
        >
        <h2
            >${categoryIcon('Input')} Map model state to component
            obligations</h2
        >
        <table
            ><thead
                ><tr
                    ><th scope="col">Model information</th
                    ><th scope="col">Adapter responsibility</th></tr
                ></thead
            ><tbody>
                <tr
                    ><th scope="row"
                        ><span class="integration-row-label"
                            >${categoryIcon('Input')}Label and
                            descriptions</span
                        ></th
                    ><td
                        >Give the interactive control an accessible name;
                        forward relationships into custom controls’ internal
                        DOM. A label on a custom-element host does not
                        automatically name an internal input.</td
                    ></tr
                >
                <tr
                    ><th scope="row"
                        ><span class="integration-row-label"
                            >${categoryIcon('Validation')}Requiredness and
                            validation errors</span
                        ></th
                    ><td
                        >Expose required state, readable error text,
                        aria-invalid, and a real description relationship. The
                        application chooses blur, touched, or submit timing;
                        changing an attribute does not enforce a business
                        rule.</td
                    ></tr
                >
                <tr
                    ><th scope="row"
                        ><span class="integration-row-label"
                            >${categoryIcon('Conditional state')}Disabled and
                            read-only</span
                        ></th
                    ><td
                        >Use native disabled behavior where appropriate and a
                        labelled output or suitable read-only control. Neither
                        state supplies authorization.</td
                    ></tr
                >
                <tr
                    ><th scope="row"
                        ><span class="integration-row-label"
                            >${categoryIcon('Conditional state')}Visibility</span
                        ></th
                    ><td
                        >Remove unavailable controls from interaction. Preserve
                        model values unless application policy explicitly clears
                        them. Decide where focus goes when a focused control
                        disappears.</td
                    ></tr
                >
                <tr
                    ><th scope="row"
                        ><span class="integration-row-label"
                            >${categoryIcon('Input')}Options and edited
                            values</span
                        ></th
                    ><td
                        >Implement the chosen control’s keyboard pattern. Send
                        edits through parseAndSetField and subscribe to Record
                        changes; unsubscribe when the view unmounts.</td
                    ></tr
                >
            </tbody></table
        >
        <h2
            >${categoryIcon('Adapter contracts')} Application decisions and
            current limits</h2
        >
        <p
            >Your application owns submission, routing, persistence,
            validation-display timing, pending requests, and server errors. The
            Lit adapter requires synchronous validators: its Field facade reads
            validity immediately, so a promise-returning validator throws even
            when error display is off. Use async Record APIs with a dedicated
            adapter for asynchronous validation. Its shadow-root controls do not
            define application submission. Custom composite controls, error
            summaries, live announcements, and focus routing need deliberate
            integration.</p
        >
        <p
            >Choose an announcement policy: show errors after an appropriate
            interaction, connect them to their fields, and decide when a summary
            or live status should announce changes. Avoid announcing every
            keystroke. Test the actual result with your target assistive
            technologies.</p
        >
        <h2>${categoryIcon('Validation')} Verify an adapter</h2>
        <ul class="integration-checklist"
            ><li
                >Use only a keyboard to enter, correct, and submit values;
                verify native and composite control patterns.</li
            ><li
                >Check names, descriptions, requiredness, and error
                announcements with a screen reader.</li
            ><li
                >Change conditional state while a related control has focus;
                verify focus recovery and retained data.</li
            ><li
                >Check read-only and disabled transitions, zoom, reflow, forced
                colors, and visible focus in the chosen design system.</li
            ></ul
        >
        <p
            >DOM relationships are useful evidence, but do not establish how
            assistive technologies announce an interface. Start with
            <a href="#quickstart">Your first form</a> and adapt its integration
            to your components.</p
        >
    </article>`;
}
