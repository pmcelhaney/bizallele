import { field, Record, Recordset } from 'bizallele';

import { prefixFilter, substringFilter } from '../../comparison-examples';
export const probes = new Record(
    {
        filterProbe: field.label('Search names'),
        matchRule: field.label('Filter matching rule').options([
            { text: 'Starts with', value: 'prefix' },
            { text: 'Contains', value: 'contains' },
        ]),
    },
    { filterProbe: 'ar', matchRule: 'prefix' }
);
export const recordset = new Recordset(
    {
        name: field
            .label('Name')
            .filter((text, value) =>
                (probes.getField('matchRule') === 'contains'
                    ? substringFilter
                    : prefixFilter
                )
                    .valueOf()
                    .match(text, value)
            ),
        team: field.label('Team'),
    },
    [
        { name: 'Ada', team: 'Research' },
        { name: 'Grace', team: 'Platform' },
        { name: 'Margaret', team: 'Research' },
    ]
);
