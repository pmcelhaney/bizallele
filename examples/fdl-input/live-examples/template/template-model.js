import { field, Recordset } from 'bizallele';
import { html } from 'lit';
const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});
export const recordset = new Recordset(
    {
        invoice: field.label('Invoice'),
        balance: field
            .label('Balance')
            .type('number')
            .parser(Number)
            .textAlign('right')
            .formatter((value, _record, context) =>
                context === 'input-focus'
                    ? String(value)
                    : currency.format(Number(value))
            )
            .template((formattedBalance, record) =>
                record.getField('balance') === 0
                    ? html`<span class="paid-balance">✓ Paid in full</span>`
                    : html`<span class="due-balance"
                          ><strong>${formattedBalance}</strong
                          ><small>Payment due</small></span
                      >`
            ),
    },
    [
        { invoice: '1048', balance: 1250 },
        { invoice: '1049', balance: 0 },
        { invoice: '1050', balance: 85.5 },
    ]
);
