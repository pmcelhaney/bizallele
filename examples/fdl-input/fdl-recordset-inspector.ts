import './fdl-code-snippet';
import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import type { Recordset } from 'bizallele';
import type { Record } from 'bizallele';
import {
    FdlRecordInspector,
    storedValue,
    fieldStatus,
    statusIcon,
    inspectIcon,
} from './fdl-record-inspector';

const events = [
    'page-changed',
    'counts-changed',
    'updated',
    'loading',
    'error',
];

/** Read-only inspection of the current view and stored values of a recordset. */
export class FdlRecordsetInspector extends LitElement {
    static properties = {
        recordset: { attribute: false },
        fields: { attribute: false },
        collapsed: { type: Boolean, reflect: true },
        showClasses: { state: true },
        showAllRows: { state: true },
    };

    recordset?: Recordset<any>;
    fields?: readonly string[];
    collapsed = false;
    private showClasses = false;
    private showAllRows = false;
    private selectedRecord?: Record<any>;
    private selectedRowNumber?: number;
    private classNumbers = new Map<string, number>();
    private observedRecordset?: Recordset<any>;
    private observedRecords = new Set<Record<any>>();
    private readonly handleChange = this.refresh.bind(this);

    connectedCallback() {
        super.connectedCallback();
        this.observe();
        this.requestUpdate();
    }

    disconnectedCallback() {
        this.release();
        super.disconnectedCallback();
    }

    protected willUpdate(_changed: PropertyValues<this>) {
        this.observe();
    }

    private release() {
        for (const event of events)
            this.observedRecordset?.removeEventListener(
                event,
                this.handleChange
            );
        for (const record of this.observedRecords)
            record.removeEventListener('change', this.handleChange);
        this.observedRecordset = undefined;
        this.observedRecords.clear();
    }

    private observe() {
        if (this.observedRecordset !== this.recordset) {
            this.release();
            this.classNumbers.clear();
            this.selectedRecord = undefined;
            this.selectedRowNumber = undefined;
            this.observedRecordset = this.recordset;
            for (const event of events)
                this.observedRecordset?.addEventListener(
                    event,
                    this.handleChange
                );
        }
        const records = new Set(this.recordset?.allRecords ?? []);
        if (this.selectedRecord && !records.has(this.selectedRecord)) {
            this.selectedRecord = undefined;
            this.selectedRowNumber = undefined;
        }
        for (const record of this.observedRecords)
            if (!records.has(record))
                record.removeEventListener('change', this.handleChange);
        for (const record of records)
            if (!this.observedRecords.has(record))
                record.addEventListener('change', this.handleChange);
        this.observedRecords = records;
    }

    private refresh() {
        this.requestUpdate();
    }

    private toggle() {
        this.collapsed = !this.collapsed;
    }

    private async inspectRecord(record: Record<any>, rowNumber: number) {
        this.selectedRecord = record;
        this.selectedRowNumber = rowNumber;
        this.requestUpdate();
        await this.updateComplete;
        const inspector = this.renderRoot.querySelector('fdl-record-inspector');
        await inspector?.updateComplete;
        inspector?.shadowRoot
            ?.querySelector<HTMLButtonElement>('.back-button')
            ?.focus();
    }

    private async backToRecordset() {
        const record = this.selectedRecord;
        this.selectedRecord = undefined;
        this.selectedRowNumber = undefined;
        this.requestUpdate();
        await this.updateComplete;
        const records = this.showAllRows
            ? this.recordset?.allRecords
            : this.recordset?.currentPage;
        const index = record ? (records?.indexOf(record) ?? -1) : -1;
        const buttons =
            this.renderRoot.querySelectorAll<HTMLButtonElement>('.inspect-row');
        if (index >= 0) buttons[index]?.focus();
        else
            this.renderRoot
                .querySelector<HTMLButtonElement>('header button')
                ?.focus();
    }

    private classMarkers(classes: readonly string[]) {
        return this.showClasses && classes.length
            ? html`<span class="class-markers"
                  >${classes.map(
                      name =>
                          html`<span
                              class="class-number"
                              data-tone=${(this.classNumbers.get(name)! - 1) % 4}
                              title=${`CSS class ${this.classNumbers.get(name)}: ${name}`}
                              aria-label=${`CSS class ${this.classNumbers.get(name)}: ${name}`}
                              >${this.classNumbers.get(name)}</span
                          >`
                  )}</span
              >`
            : '';
    }

    render() {
        if (this.selectedRecord) {
            return html`<fdl-record-inspector
                .record=${this.selectedRecord}
                .heading=${`Record ${this.selectedRowNumber}`}
                .backLabel=${'Back to recordset'}
                .collapsed=${this.collapsed}
                @inspect-back=${this.backToRecordset}
            ></fdl-record-inspector>`;
        }
        const recordset = this.recordset;
        const fields = this.fields ?? recordset?.fieldNames ?? [];
        const activeClasses = new Set<string>();
        function normalize(classes: string[]) {
            return [
                ...new Set(
                    classes.flatMap(name => name.split(/\s+/)).filter(Boolean)
                ),
            ];
        }
        const columnClasses = fields.map(name =>
            normalize(recordset?.column(name).columnClasses() ?? [])
        );
        const displayedRecords =
            (this.showAllRows
                ? recordset?.allRecords
                : recordset?.currentPage) ?? [];
        const rows = displayedRecords.map(record => ({
            record,
            classes: normalize(
                fields.flatMap(name =>
                    recordset!.column(name).rowClasses(record)
                )
            ),
            cells: fields.map(name =>
                normalize(record.field(name).cellClasses())
            ),
        }));
        const markerWidths = fields.map((_, index) =>
            this.showClasses
                ? Math.max(0, ...rows.map(row => row.cells[index].length)) * 24
                : 0
        );
        for (const classes of [
            ...columnClasses,
            ...rows.flatMap(row => [row.classes, ...row.cells]),
        ]) {
            for (const name of classes) {
                if (!this.classNumbers.has(name))
                    this.classNumbers.set(name, this.classNumbers.size + 1);
                activeClasses.add(name);
            }
        }
        const action = this.collapsed
            ? 'Inspect recordset'
            : 'Collapse recordset inspector';
        return html`<section aria-label="Recordset Inspector">
            <header>
                <button
                    type="button"
                    class="inspector-icon"
                    aria-label=${action}
                    title=${action}
                    aria-expanded=${!this.collapsed}
                    aria-controls="recordset-details"
                    @click=${this.toggle}
                    >${inspectIcon()}</button
                >
                <div class="inspector-heading" ?hidden=${this.collapsed}>
                    <h3>Recordset Inspector</h3>
                    <p>See each record’s stored values and current state.</p>
                </div>
                ${
                    recordset &&
                    recordset.allRecords.some(record => !record.isValid())
                        ? html`<span
                              class="record-validity"
                              role="img"
                              aria-label="Invalid recordset"
                              title="Invalid recordset"
                              ?hidden=${this.collapsed}
                          >
                              ${statusIcon('Invalid')}
                          </span>`
                        : nothing
                }
            </header>
            <div id="recordset-details" ?hidden=${this.collapsed}>
                ${
                    recordset
                        ? html`
                              <div class="counts" role="status">
                                  <p
                                      ><strong
                                          >${recordset.filteredCount}</strong
                                      >
                                      of
                                      <strong>${recordset.totalCount}</strong>
                                      records match;
                                      ${recordset.currentPage.length} shown on
                                      this page.</p
                                  >
                                  <p
                                      >Page ${recordset.pageNumber} ·
                                      ${recordset.pageSize} records per page ·
                                      ${recordset.allRecords.length} records
                                      loaded.</p
                                  >
                                  <p
                                      >${
                                          recordset.sortColumns.length
                                              ? `Sorted by ${recordset.sortColumns.map((column: { field: string; sort: string }) => `${column.field} ${column.sort === 'ascending' ? '↑' : '↓'}`).join(', then ')}.`
                                              : 'Original order; no sort selected.'
                                      }</p
                                  >
                                  ${recordset.isLoading ? html`<p>Loading records…</p>` : ''}
                              </div>
                              <div
                                  class="view-controls"
                                  role="group"
                                  aria-label="Inspector display"
                              >
                                  <label class="row-toggle">
                                      <input
                                          type="checkbox"
                                          .checked=${this.showAllRows}
                                          @change=${(event: Event) => {
                                              this.showAllRows = (
                                                  event.target as HTMLInputElement
                                              ).checked;
                                          }}
                                      />Show all rows
                                  </label>
                                  ${
                                      activeClasses.size
                                          ? html`<label class="class-toggle">
                                                <input
                                                    type="checkbox"
                                                    .checked=${this.showClasses}
                                                    @change=${(
                                                        event: Event
                                                    ) => {
                                                        this.showClasses = (
                                                            event.target as HTMLInputElement
                                                        ).checked;
                                                    }}
                                                />Show CSS classes
                                            </label>`
                                          : ''
                                  }
                              </div>
                              <div
                                  class="table-scroll"
                                  tabindex="0"
                                  role="region"
                                  aria-label=${this.showAllRows ? 'All loaded rows stored values' : 'Visible rows stored values'}
                              >
                                  <table
                                      aria-label=${this.showAllRows ? 'All loaded rows' : 'Visible rows'}
                                  >
                                      <thead
                                          ><tr>
                                              <th
                                                  scope="col"
                                                  class="row-status"
                                              ></th>
                                              <th scope="col">Row</th>
                                              ${fields.map((name, index) => html`<th scope="col">${name}${this.classMarkers(columnClasses[index])}</th>`)}
                                          </tr></thead
                                      >
                                      <tbody
                                          >${rows.map(
                                              (
                                                  { record, classes, cells },
                                                  index
                                              ) =>
                                                  html` <tr
                                                      @click=${() => this.inspectRecord(record, (this.showAllRows ? 1 : recordset.firstRecordNumberOnPage) + index)}
                                                  >
                                                      <td class="row-status"
                                                          >${this.classMarkers(classes)}${!record.isValid() ? statusIcon('Invalid') : ''}</td
                                                      >
                                                      <th scope="row"
                                                          ><button
                                                              type="button"
                                                              class="inspect-row"
                                                              aria-label=${`Inspect record ${(this.showAllRows ? 1 : recordset.firstRecordNumberOnPage) + index}`}
                                                              title="Inspect record"
                                                              >${(this.showAllRows ? 1 : recordset.firstRecordNumberOnPage) + index}</button
                                                          ></th
                                                      >
                                                      ${fields.map(
                                                          (name, fieldIndex) =>
                                                              html`<td
                                                                  data-field=${name}
                                                                  data-align=${record.field(name).textAlign() ?? 'left'}
                                                                  ><span
                                                                      class="stored-cell"
                                                                      style=${`--marker-width: ${markerWidths[fieldIndex]}px`}
                                                                      >${fieldStatus(record, name)}<span>${storedValue(record.getField(name))}</span>${this.classMarkers(cells[fieldIndex])}</span
                                                                  ></td
                                                              >`
                                                      )}
                                                  </tr>`
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                              ${rows.length ? '' : html`<p>${this.showAllRows ? 'No records loaded.' : 'No records on this page.'}</p>`}
                              ${
                                  this.showClasses && activeClasses.size
                                      ? html`<div
                                            class="class-legend"
                                            aria-label="CSS class legend"
                                        >
                                            ${[...this.classNumbers].filter(([name]) => activeClasses.has(name)).map(([name, number]) => html`<span class="class-entry"><span class="class-number" data-tone=${(number - 1) % 4} title=${`CSS class ${number}: ${name}`}>${number}</span><code>${name}</code></span>`)}
                                        </div>`
                                      : ''
                              }
                              <p class="note"
                                  >Values are stored values before formatting.
                                  Icons on the left indicate applicable states;
                                  the row status covers the complete record.</p
                              >
                              <details
                                  ><summary>Inspect full JSON</summary
                                  ><fdl-code-snippet>
                                      <pre>
${JSON.stringify(
                                              {
                                                  visibleRows:
                                                      recordset.currentPage.map(
                                                          record =>
                                                              record.values
                                                      ),
                                                  ...(this.showAllRows
                                                      ? {
                                                            allRows:
                                                                displayedRecords.map(
                                                                    record =>
                                                                        record.values
                                                                ),
                                                        }
                                                      : {}),
                                                  totalRecords:
                                                      recordset.totalCount,
                                                  loadedRecords:
                                                      recordset.allRecords
                                                          .length,
                                                  matchingRecords:
                                                      recordset.filteredCount,
                                                  pageNumber:
                                                      recordset.pageNumber,
                                                  pageSize: recordset.pageSize,
                                                  sortColumns:
                                                      recordset.sortColumns,
                                              },
                                              null,
                                              2
                                          )}</pre>
                                  </fdl-code-snippet>
                              </details>
                          `
                        : html`<p>No recordset selected.</p>`
                }
            </div>
        </section>`;
    }

    static styles = [
        FdlRecordInspector.styles,
        css`
            #recordset-details {
                padding-top: 16px;
            }
            .counts {
                color: #64748b;
                font-size: 0.75rem;
                line-height: 1.6;
            }
            .counts p {
                margin: 4px 0;
            }
            .counts p:first-child {
                margin-top: 0;
                color: #334155;
                font-size: 0.875rem;
            }
            .counts strong {
                color: #0f172a;
                font-variant-numeric: tabular-nums;
            }
            .view-controls {
                display: flex;
                flex-wrap: wrap;
                gap: 4px 20px;
                margin: 12px 0;
            }
            .table-scroll {
                overflow-x: auto;
                border: 1px solid var(--example-border);
                border-radius: 8px;
            }
            .table-scroll:focus-visible,
            summary:focus-visible {
                outline: 3px solid #4338ca;
                outline-offset: 3px;
            }
            table {
                table-layout: auto;
                min-width: 100%;
                width: 100%;
                font-size: 0.8125rem;
            }
            th,
            td {
                min-width: 72px;
                padding: 10px 12px;
                border-color: #e2e8f0;
                vertical-align: middle;
            }
            thead th {
                background: #f1f5f9;
                color: #475569;
                font-family: ui-monospace, monospace;
                font-size: 0.75rem;
            }
            th:first-child,
            th:last-child {
                width: auto;
            }
            tbody th {
                width: 44px;
                min-width: 44px;
                color: #64748b;
                font-size: 0.75rem;
                font-weight: 500;
                font-variant-numeric: tabular-nums;
            }
            td {
                font-family: ui-monospace, monospace;
                white-space: nowrap;
                overflow-wrap: normal;
            }
            tbody tr:nth-child(even) {
                background: #f8fafc;
            }
            tbody tr:last-child > * {
                border-bottom: 0;
            }
            tbody tr:hover {
                background: #eef2ff;
            }
            tbody tr {
                cursor: pointer;
            }
            tbody tr:focus-within {
                background: #eef2ff;
            }
            .inspect-row {
                min-width: 32px;
                min-height: 32px;
                padding: 4px;
                border: 1px solid var(--example-border);
                border-radius: 6px;
                background: white;
                color: #525252;
                font: inherit;
                cursor: pointer;
            }
            .row-status {
                min-width: 24px;
                width: 24px;
                padding-inline: 6px;
            }
            .stored-cell {
                position: relative;
                padding-inline-end: var(--marker-width);
                display: flex;
                align-items: center;
                gap: 6px;
            }
            [data-align='right'] .stored-cell {
                justify-content: flex-end;
                text-align: right;
                font-variant-numeric: tabular-nums;
            }
            [data-align='center'] .stored-cell {
                justify-content: center;
                text-align: center;
            }
            .class-markers {
                display: inline-flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 4px;
                margin-inline-start: 6px;
                vertical-align: middle;
            }
            .stored-cell .class-markers {
                position: absolute;
                inset-inline-end: 0;
                margin: 0;
                flex-wrap: nowrap;
            }
            .row-status .class-markers {
                flex-wrap: nowrap;
                margin-inline-start: 0;
            }
            .row-toggle,
            .class-toggle {
                display: flex;
                align-items: center;
                gap: 6px;
                margin: 0;
                min-height: 44px;
                font-size: 0.8125rem;
                cursor: pointer;
            }
            .row-toggle input,
            .class-toggle input {
                margin: 0;
                accent-color: #4338ca;
                width: 16px;
                height: 16px;
            }
            .class-legend {
                display: flex;
                flex-wrap: wrap;
                gap: 8px 16px;
                padding: 12px;
                margin-top: 12px;
                border: 1px solid var(--example-border);
                border-radius: 8px;
                background: #f8fafc;
                font-size: 0.8125rem;
            }
            .class-entry {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                color: #334155;
            }
            .class-entry code {
                overflow-wrap: anywhere;
            }
            .class-number {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 20px;
                height: 20px;
                padding: 0 4px;
                border: 1px solid #c7d2fe;
                border-radius: 5px;
                background: #eef2ff;
                color: #3730a3;
                font:
                    600 0.6875rem/1 ui-monospace,
                    monospace;
                flex-shrink: 0;
            }
            .class-number[data-tone='1'] {
                border-color: #fcd34d;
                background: #fffbeb;
                color: #92400e;
            }
            .class-number[data-tone='2'] {
                border-color: #99f6e4;
                background: #f0fdfa;
                color: #115e59;
            }
            .class-number[data-tone='3'] {
                border-color: #f5d0fe;
                background: #fdf4ff;
                color: #86198f;
            }
            .field-status:not(:has(.status-icon)) {
                display: none;
            }
            .note {
                margin: 12px 0;
                color: #64748b;
                font-size: 0.75rem;
                line-height: 1.6;
            }
            summary {
                cursor: pointer;
                padding: 12px 0;
                min-height: 44px;
                border-top: 1px solid var(--example-border);
                border-radius: 0;
                background: transparent;
                color: #262626;
                font-size: 0.875rem;
                font-weight: 600;
            }
            pre {
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                font-size: 0.8125rem;
            }
        `,
    ];
}

customElements.define('fdl-recordset-inspector', FdlRecordsetInspector);

declare global {
    interface HTMLElementTagNameMap {
        'fdl-recordset-inspector': FdlRecordsetInspector;
    }
}
