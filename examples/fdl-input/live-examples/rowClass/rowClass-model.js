import { field, Recordset } from 'bizallele';
export const recordset = new Recordset(
    {
        status: field
            .label('Status')
            .rowClass('invoice-row')
            .rowClass(record =>
                record.getField('status') === 'Disputed'
                    ? ['disputed-row', 'needs-review']
                    : []
            ),
        owner: field.label('Owner'),
    },
    [
        { status: 'Disputed', owner: 'Ada' },
        { status: 'Paid', owner: 'Grace' },
    ]
);
