import { field, Record } from 'bizallele';

export const isInternational = (record: Record<any>) =>
    record.getField('country') !== 'US';
export const accountFields = {
    country: field.label('Country code').required(),
    taxId: field
        .label('Tax ID')
        .required(isInternational)
        .visible(isInternational)
        .validator({
            name: 'must contain two uppercase letters followed by six digits',
            validate: (value, _viewValue, record) =>
                !isInternational(record) ||
                value === '' ||
                /^[A-Z]{2}\d{6}$/.test(String(value)),
        }),
};
export const createAccount = (country = 'US', taxId = '') =>
    new Record(accountFields, { country, taxId });
