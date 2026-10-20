import './fdl-code-snippet';
import { html } from 'lit';
import { highlightJavaScript } from './highlight-javascript';

export const firstFormSource = `import { html, render } from 'lit';
import { field, Record } from 'bizallele';
import 'bizallele/lit/fdl-field';
import 'bizallele/lit/fdl-record';

const account = new Record(
    {
        name: field.label('Account name').required(),
        country: field.label('Country code').defaultValue('US'),
        taxId: field
            .label('Tax ID')
            .required(record => record.getField('country') !== 'US'),
    },
    { name: '', country: 'US', taxId: '' }
);
let checked = false;
const root = document.getElementById('app') || document.body;
const update = () =>
    render(
        html\`
            <fdl-record .record=\${account}>
                <fdl-field
                    field="name"
                    .showValidationErrors=\${checked}
                ></fdl-field>
                <fdl-field field="country"></fdl-field>
                <fdl-field
                    field="taxId"
                    .showValidationErrors=\${checked}
                ></fdl-field>
                <button
                    @click=\${() => {
                        checked = true;
                        update();
                    }}
                >
                    Check account
                </button>
                <p role="status">
                    \${
                        checked
                            ? account.isValid()
                                ? 'Valid.'
                                : account.readableRecordErrors().join('. ')
                            : 'Not checked yet.'
                    }
                </p>
            </fdl-record>
        \`,
        root
    );
account.addEventListener('change', update);
update();`;

export function renderQuickstart() {
    return html`<article class="site-page"
        ><h1 tabindex="-1">Your first form</h1>
        <p class="description"
            >Install the model and Lit elements, and display your first
            validation error.</p
        >
        <p
            >You’ll build an account form where Name is required and changing
            Country code from US to CA makes Tax ID required. Check the empty
            form, fill the required values, and watch it become valid.</p
        >
        <h2>Create a local application</h2>
        <p
            >Publication as <code>bizallele</code> is pending. Once it is
            published, create a new application and install the package. Lit
            supplies the components; Vite runs the application locally.</p
        >
        <fdl-code-snippet>
            <pre class="code"><code>mkdir bizallele-first-form
cd bizallele-first-form
npm init -y
npm install bizallele lit
npm install --save-dev vite@8.3.4 typescript@6.0.3</code></pre>
        </fdl-code-snippet>
        <p
            >No repository checkout or package build is needed. The npm package
            includes compiled JavaScript, TypeScript declarations, and the
            <code>bizallele/lit/fdl-field</code> adapter used below.</p
        >
        <p
            >Create an <code>index.html</code> with the following body and save
            the complete script below as <code>main.ts</code> beside it. Add the
            <code>tsconfig.json</code> below, then run <code>npx vite</code> and
            open the local URL it prints. The installed package contains
            compiled JavaScript; your application’s TypeScript is handled by
            Vite.</p
        >
        <fdl-code-snippet>
            <pre class="code"><code>&lt;div id="app"&gt;&lt;/div&gt;
&lt;script type="module" src="/main.ts"&gt;&lt;/script&gt;</code></pre>
        </fdl-code-snippet>
        <fdl-code-snippet>
            <pre
                class="code"
            ><code>${highlightJavaScript(firstFormSource)}</code></pre>
        </fdl-code-snippet>
        <h3>tsconfig.json</h3>
        <fdl-code-snippet>
            <pre class="code"><code>{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": [],
    "noEmit": true
  },
  "include": ["main.ts"]
}</code></pre>
        </fdl-code-snippet>
        <p
            >Run <code>npx tsc --noEmit</code> to type-check this consumer
            independently of the documentation site.</p
        >
        <p
            >Press Check account with an empty name to expose its error. Enter a
            name, then change Country code to CA: Tax ID becomes required. Enter
            it and check again. Initial values are explicit;
            <code>defaultValue()</code> applies when clearing the record, and
            does not replace constructor values.</p
        >
        <h2>Use the modifier examples in this repository</h2>
        <p
            >The model and view files on modifier pages run inside this
            repository’s example environment. Their model imports use
            <code>bizallele</code>, and their field and table imports use
            <code>bizallele/lit/</code>. The source tabs display the exact files
            that run the live examples. Copy the model, view, and any local
            sample-data or style files into your app; the Lit elements ship with
            the package. Run <code>npm install</code> and
            <code>npm run docs:dev</code> in this checkout to explore them.</p
        >
        <h2>Integrate your component stack</h2>
        <p
            >The supplied adapter uses Lit. A React design system needs an
            integration that subscribes to Record changes, sends edits through
            <code>parseAndSetField()</code>, and maps field state to the
            existing components. Keep the field rules; implement that semantic
            integration in your component layer. Read
            <a href="#integration">the adapter and API contracts</a> for state
            mapping, accessibility checks, and current limits.</p
        >
        <p
            >Your application owns submission, routing, persistence,
            server-error mapping, and when errors are shown. The example adapter
            requires synchronous validators. Use async Record APIs with a
            dedicated adapter for asynchronous validation and pending server
            requests. Submit Record data explicitly: shadow-root controls do not
            provide application form submission.</p
        >
        <p
            >Next: <a href="#required">conditional requiredness</a>,
            <a href="#options">option lists</a>,
            <a href="#formatter">formatting</a>, and
            <a href="#how-it-works">the model and component boundary</a>.</p
        >
    </article>`;
}
