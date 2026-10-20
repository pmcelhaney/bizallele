# Example: Dog Walking Service

Imagine a scheduling form for a dog-walking business. It has four fields:
name, date, new-customer status, and comments, with these rules:

- Name is required, must be 2–20 characters, and is capitalized for display.
- The new-customer checkbox is disabled for unrecognized names.
- Dates are required, must be weekdays, cannot be holidays, and new customers may book only on Friday.
- Comments are required for new customers.

Putting these rules directly in a template or scattering them through event
handlers makes them difficult to reuse and maintain. With Bizallele, define the
rules alongside each field type; the view only decides where to render fields.

```js
import { string, boolean, date, Record } from 'bizallele';

const existingCustomers = ['Ada', 'Grace'];
const holidays = [new Date(2026, 11, 25).toDateString()];

const name = string.required().minLength(2).maxLength(20).formatter(capitalize);
const newCustomer = boolean
    .type('checkbox')
    .defaultValue(false)
    .disabled(record => !existingCustomers.includes(record.getField('name')));
const appointmentDate = date
    .required()
    .validator({ name: 'weekday', validate: isWeekday })
    .validator({ name: 'not-holiday', validate: isNotHoliday })
    .validator({
        name: 'new-customer-day',
        validate: isExistingCustomerOrNewCustomerDay,
    });
const comments = string.required(isNewCustomer);

const appointment = new Record(
    {
        name,
        newCustomer,
        date: appointmentDate,
        comments,
    },
    {
        name: '',
        newCustomer: false,
        date: null,
        comments: '',
    }
);

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function isNewCustomer(record) {
    return record.getField('newCustomer');
}

function isDate(value) {
    return value instanceof Date && !Number.isNaN(value.getTime());
}

function isWeekday(value) {
    return isDate(value) && value.getDay() !== 0 && value.getDay() !== 6;
}

function isNotHoliday(value) {
    return isDate(value) && !holidays.includes(value.toDateString());
}

function isExistingCustomerOrNewCustomerDay(value, _, record) {
    return isDate(value) && (!record.getField('newCustomer') || value.getDay() === 5);
}
```

This example validates model values: assign a JavaScript `Date` to `date`.
The `date` primitive does not parse native date-input strings automatically;
a date control needs an explicit parser and formatter. Field-setting callbacks
such as `required` receive `(record)`, while validators receive
`(modelValue, viewValue, record, options, field)`.
