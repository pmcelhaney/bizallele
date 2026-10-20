import { field, Recordset } from 'bizallele';
import { compareShirtSizes, shirtOrders } from '../../shirt-size-example';
export const recordset = new Recordset(
    {
        firstName: field
            .label('First name')
            .compareFunction((left, right) =>
                Math.sign(left.localeCompare(right))
            ),
        lastName: field
            .label('Last name')
            .compareFunction((left, right) =>
                Math.sign(left.localeCompare(right))
            ),
        shirtSize: field
            .label('T-shirt size')
            .compareFunction(compareShirtSizes),
    },
    shirtOrders.map(order => ({ ...order }))
);
