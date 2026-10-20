import { field, Record } from 'bizallele';
export const record = new Record(
    {
        email: field
            .label('Email address')
            .type('email')
            .validator({
                name: 'must be a valid email address',
                validate: value =>
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
            }),
        orderQuantity: field
            .label('Order quantity')
            .type('number')
            .parser(Number)
            .validator({
                name: 'must be a whole number',
                validate: value => Number.isInteger(value),
            })
            .validator({
                name: 'must be between 1 and 12',
                validate: value => Number(value) >= 1 && Number(value) <= 12,
            }),
        username: field
            .label('Username')
            .validator({
                name: 'must start with a letter',
                validate: value => /^[A-Za-z]/.test(String(value)),
            })
            .validator({
                name: 'must contain only letters, numbers, or underscores',
                validate: value => /^[A-Za-z0-9_]+$/.test(String(value)),
            }),
    },
    { email: 'ada@', orderQuantity: 2.5, username: '7bad-name' }
);
