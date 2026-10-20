import { field, Record } from 'bizallele';
export const record = new Record(
    {
        lockedId: field.label('System ID').disabled(),
        approvalStatus: field.label('Approval status').options([
            { text: 'Draft', value: 'draft' },
            { text: 'Approved', value: 'approved' },
        ]),
        budget: field
            .label('Budget')
            .type('number')
            .disabled(
                record => record.getField('approvalStatus') === 'approved'
            ),
    },
    { lockedId: 'SYS-77', approvalStatus: 'draft', budget: 5000 }
);
