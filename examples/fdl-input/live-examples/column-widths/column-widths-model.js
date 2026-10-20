import { field, Record, Recordset } from 'bizallele';
export const settings = new Record(
    {
        minimum: field
            .label('Minimum width')
            .parser(Number)
            .options(
                [80, 110, 140].map(value => ({ text: `${value}px`, value }))
            ),
        preferred: field
            .label('Preferred width')
            .parser(Number)
            .options(
                [160, 200, 240].map(value => ({
                    text: `${value}px`,
                    value,
                }))
            ),
        maximum: field
            .label('Maximum width')
            .parser(Number)
            .options(
                [260, 320, 400].map(value => ({
                    text: `${value}px`,
                    value,
                }))
            ),
    },
    { minimum: 110, preferred: 160, maximum: 260 }
);
export const recordset = new Recordset(
    {
        constrained: field
            .label('Constrained column')
            .minColumnWidth(() => settings.getField('minimum'))
            .targetColumnWidth(() => settings.getField('preferred'))
            .maxColumnWidth(() => settings.getField('maximum')),
        flexible: field.label('Flexible column').minColumnWidth(80),
    },
    [
        {
            constrained: 'Resize between the limits',
            flexible: 'Uses the remaining space',
        },
    ]
);
