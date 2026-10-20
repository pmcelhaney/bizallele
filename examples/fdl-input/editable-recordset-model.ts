import { field, Recordset, Record } from 'bizallele';

export const shipmentFields = {
    id: field.label('Shipment').readOnly().sortable(false),
    quantity: field
        .label('Quantity')
        .sortable(false)
        .type('number')
        .parser(Number)
        .required()
        .textAlign('right')
        .reducer('sum')
        .validator({
            name: 'must be a positive whole number',
            validate: value => Number.isInteger(value) && value > 0,
        }),
    unitPrice: field
        .label('Unit price')
        .sortable(false)
        .type('number')
        .parser(Number)
        .textAlign('right')
        .validator({
            name: 'must be a non-negative number',
            validate: value => Number.isFinite(value) && value >= 0,
        }),
    status: field.label('Status').sortable(false),
    reason: field
        .label('Hold reason')
        .sortable(false)
        .required(record => record.getField('status') === 'hold'),
};
export const shipmentRows = [
    { id: 'S-101', quantity: 2, unitPrice: 10, status: 'ready', reason: '' },
    {
        id: 'S-102',
        quantity: 5,
        unitPrice: 20,
        status: 'hold',
        reason: 'Awaiting allocation',
    },
    { id: 'S-103', quantity: 1, unitPrice: 15, status: 'ready', reason: '' },
];
export const createShipments = () =>
    new Recordset(
        shipmentFields,
        shipmentRows.map(row => ({ ...row }))
    );
export const shipmentCharge = (record: Record<any>) =>
    record.getField('quantity') * record.getField('unitPrice');
export function shipmentTotals(records: Record<any>[]) {
    return {
        quantity: records.reduce(
            (sum, row) => sum + row.getField('quantity'),
            0
        ),
        charge: records.reduce((sum, row) => sum + shipmentCharge(row), 0),
    };
}
export async function applyShipmentView(
    shipments: Recordset<any>,
    status: string,
    descending: boolean
) {
    shipments.filter = row => !status || row.getField('status') === status;
    await shipments.sort({
        field: 'quantity',
        sort: descending ? 'descending' : 'ascending',
    });
    await shipments.requestImmediateUpdate();
}
