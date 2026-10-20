// Defines delivery fields, conditional rules, ZIP validation, and store lookup.
import { field, Record } from 'bizallele';
import {
    deliveryMethodOptions,
    shippingStateOptions,
    storesByZip,
} from './delivery-data';

function whenDeliveryMethodRequiresAddress(record: Record<any>) {
    return record.getField('fulfillment') === 'ship';
}

function whenPickingUp(record: Record<any>) {
    return record.getField('fulfillment') === 'pickup';
}

function isValidZip(zip: unknown) {
    return typeof zip === 'string' && /^[0-9]{5}$/.test(zip);
}

function whenZipIsInvalid(record: Record<any>) {
    return !isValidZip(record.getField('pickupZip'));
}

async function loadStoresForZip(zip: string) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return storesByZip[zip] || [];
}

const pickupStoreOptions = {
    fields: ['pickupZip'],
    fetch: (record: Record<any>) =>
        loadStoresForZip(record.getField('pickupZip')),
};
const postalZipValidator = {
    name: 'must contain five digits',
    validate: (zip: unknown) => isValidZip(zip),
};

// Reusable address rules; the delivery record decides when an address is needed.
const addressFields = {
    street: field.label('Street address').required(),
    city: field.label('City').required(),
    state: field.label('State').required().options(shippingStateOptions),
    zip: field.label('ZIP code').required().validator(postalZipValidator),
};

const shippingAddressValidator = {
    name: 'must contain a complete shipping address',
    validate: (value: any, _viewValue: unknown, record: Record<any>) =>
        !whenDeliveryMethodRequiresAddress(record) ||
        new Record(addressFields, value ?? {}).isValid(),
};

export function createDelivery() {
    return new Record(
        // prettier-ignore
        {
            fulfillment: field
                .label('Delivery method')
                .options(deliveryMethodOptions),
            address: field
                .label('Shipping address')
                .semanticType('address')
                .record(addressFields)
                .visible(whenDeliveryMethodRequiresAddress)
                .required(whenDeliveryMethodRequiresAddress)
                .validator(shippingAddressValidator),
            pickupZip: field
                .label('Pickup ZIP code')
                .visible(whenPickingUp)
                .required(whenPickingUp)
                .validator({
                    ...postalZipValidator,
                    validate: (zip: unknown, _viewValue: unknown, record: Record<any>) =>
                        !whenPickingUp(record) || isValidZip(zip),
                }),
            store: field
                .label('Pickup store')
                .visible(whenPickingUp)
                .disabled(whenZipIsInvalid)
                .required(whenPickingUp)
                .options(pickupStoreOptions),
        },
        {
            fulfillment: 'ship',
            address: {
                street: '42 Orchard Street',
                city: 'Charlotte',
                state: 'NC',
                zip: '28202',
            },
            pickupZip: '28202',
            store: '',
        }
    );
}
