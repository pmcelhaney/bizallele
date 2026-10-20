import { record } from './validator-model.js';
import { html } from 'lit';
import 'bizallele/lit/fdl-field';

function preventSubmission(event) {
    event.preventDefault();
}

export function validatorView() {
    return html`
        <section class="validator-example">
            <h3>Email address</h3>
            <p
                >A simple check: no whitespace, one @, and a dot in the domain.
                Try ada@example.com.</p
            >
            <form @submit=${preventSubmission}>
                <fdl-field .record=${record} field="email"></fdl-field>
                <button type="submit">Check email</button>
            </form>
            ${record.isValid('email') ? html`<p class="result valid" role="status">Valid.</p>` : ''}
        </section>
        <section class="validator-example">
            <h3>Order quantity</h3>
            <p>Enter a whole number from 1 to 12. Try 2.5, 0, 13, then 3.</p>
            <form @submit=${preventSubmission}>
                <fdl-field .record=${record} field="orderQuantity"></fdl-field>
                <button type="submit">Check quantity</button>
            </form>
            ${record.isValid('orderQuantity') ? html`<p class="result valid" role="status">Valid.</p>` : ''}
        </section>
        <section class="validator-example">
            <h3>Username</h3>
            <p
                >Start with a letter and use only letters, numbers, or
                underscores. Try 7bad-name, then ada_7.</p
            >
            <form @submit=${preventSubmission}>
                <fdl-field .record=${record} field="username"></fdl-field>
                <button type="submit">Check username</button>
            </form>
            ${record.isValid('username') ? html`<p class="result valid" role="status">Valid.</p>` : ''}
        </section>
    `;
}
