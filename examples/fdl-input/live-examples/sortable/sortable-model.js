import { field, Recordset } from 'bizallele';
import { shirtOrders } from '../../shirt-size-example';
export const recordset = new Recordset(
    {
        firstName: field
            .label('First name')
            .compareFunction((left, right) => left.localeCompare(right)),
        lastName: field
            .label('Last name')
            .compareFunction((left, right) => left.localeCompare(right)),
        shirtSize: field.label('T-shirt size').sortable(false),
    },
    shirtOrders.map(order => ({ ...order }))
);
