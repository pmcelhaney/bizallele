import { field, Recordset } from 'bizallele';
import { html } from 'lit';

export const prefixFilter = field.filter((text, value) =>
    value.toLowerCase().startsWith(text.toLowerCase())
);
export const substringFilter = field.filter((text, value) =>
    value.toLowerCase().includes(text.toLowerCase())
);

export function sortCases(table: Recordset<any>) {
    const sizes = [
        ...new Set(table.allRecords.map(record => record.values.shirtSize)),
    ] as string[];
    const sizeColumn = table.column('shirtSize');
    return html`<section class="case-comparison"
        ><h3>Alphabetic order versus size order</h3
        ><p
            >The same sizes produce different orders. The table uses
            compareShirtSizes.</p
        ><div class="comparison-grid"
            ><div
                ><h4>Alphabetic order</h4
                ><p>${[...sizes].sort().join(' → ')}</p></div
            ><div
                ><h4>T-shirt size order</h4
                ><p
                    >${[...sizes].sort((left, right) => sizeColumn.compare(left, right)).join(' → ')}</p
                ></div
            ></div
        ></section
    >`;
}
