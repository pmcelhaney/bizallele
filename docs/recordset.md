# Recordset

A `Recordset` manages a collection of `Record` instances. It can fetch data,
sort and filter it, paginate the visible records, and report collection-level
validation errors.

Supply a map of field definitions built from `field` or the primitives. The
recordset prepares their runtime behavior once and shares it across every row.
`column(name)` returns the table-facing facade for a field. Use it for sorting,
aggregation, filtering, column classes, alignment, and width guidance.

Use the same definition map for every row:

```js
import { boolean, Recordset, string } from 'bizallele';

const fields = {
    id: string,
    title: string,
    isFavorite: boolean,
};
```

## Columns

Use `column(name)` when a table needs behavior for one of the recordset's
columns:

```js
const amount = reports.column('amount');

amount.sortable();
amount.compare(10, 20);
amount.minColumnWidth();
amount.columnClasses();
amount.cellClasses(125, reports.currentPage[0]);
```

`Column` is distinct from `record.field(name)`: a `Field` is bound to one
record and handles record-specific behavior, while a `Column` represents the
same field across the table. Use `record.field(name)` for values, validation,
formatting, visibility, and disabled state.

## Fetching data

Pass a fetch function as the second constructor argument. The function receives
one request object and may return data synchronously or as a promise. It can
return either an array of row values or `{ data, totalCount, summary }`.

```js
const reports = new Recordset(fields, async ({ parameters, startIndex, pageSize, sort }) => {
    const response = await reportsApi.fetch({
        type: parameters.type,
        startIndex,
        pageSize,
        sort,
    });

    return {
        data: response.items.map(report => ({
            id: report.id,
            title: report.customTitle ?? report.title,
            isFavorite: report.favorite,
        })),
        totalCount: response.totalCount,
    };
});

await reports.requestRefresh();
```

The request object contains `parameters`, `startIndex`, `pageSize`, `page`,
`sort`, and `isFirstFetch`. Set `parameters`, `sortColumns`, `pageNumber`, or
`pageSize` to request an updated view. Those setters schedule an update; use
`recordset.updating` when code needs to wait for it.

```js
reports.parameters = { type: 'standard' };
reports.sortColumns = [{ field: 'title', sort: 'ascending' }];
await reports.updating;
```

## Client-side and server-side data

When the fetched `totalCount` is nonzero and equals the number of returned rows, the
`Recordset` treats the data as client-side: it sorts, filters, and slices the
current page locally. Otherwise, it treats the data as server-side and the
fetch function must return the requested page and honor the requested sort.
The recordset still applies its local predicate and comparator to returned rows,
but does not slice them again; `filteredCount` uses the server's `totalCount`.
An empty response also follows this server-side path.

Pages are one-based (`pageNumber` and request `page`); `pageIndex` and request
`startIndex` are zero-based. Construction alone does not load rows: call
`requestRefresh()` for the first load, even when supplying an array.

Client-side updates reuse loaded data. Changing `parameters` schedules a view
update but does not itself invalidate that cache. Call `requestRefresh()`
after changing parameters when the fetch function needs to run again.

For client-side filtering, assign a predicate that receives each `Record`:

```js
reports.filter = record => record.field('isFavorite').rawValue;
await reports.updating;
```

Useful read-only properties include `allRecords`, `currentPage`,
`filteredCount`, `totalCount`, `isLoading`, and `hasChanged`.

## ExampleRecordset

`ExampleRecordset` is intended for prototypes and demos. It creates the given
number of rows using an explicit row factory owned by the application.

```js
import ExampleRecordset from 'bizallele/example-recordset';

const exampleReports = new ExampleRecordset(fields, 100, index => ({
    id: String(index + 1),
    title: `Report ${index + 1}`,
    isFavorite: false,
}));
await exampleReports.requestRefresh();
```

The row factory receives a zero-based index and returns a complete data row
matching the fields. This replaces the removed `exampleValue()` field modifier;
move former per-field generators into this factory. Existing two-argument
`ExampleRecordset(fields, count)` calls must supply the third argument.
