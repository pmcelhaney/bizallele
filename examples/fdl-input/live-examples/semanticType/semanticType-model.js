import { field, Record } from 'bizallele';
export const record = new Record(
    {
        address: field
            .label('Shipping address')
            .semanticType('address')
            .record({
                street: field.label('Street').required(),
                city: field.label('City').required(),
                state: field.label('State').required(),
                zip: field.label('ZIP code').required(),
            })
            .visible(record => record.getField('fulfillment') === 'ship'),
    },
    {
        fulfillment: 'ship',
        address: {
            street: '1 Main Street',
            city: 'New York',
            state: 'NY',
            zip: '10001',
        },
    }
);
