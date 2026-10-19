import { hasStreetNumber, type CompositionRules } from './composition-rules';
export {
    compositionFields,
    compositionRecord,
    defaultCompositionRules,
    hasStreetNumber,
    type CompositionRules,
} from './composition-rules';

export const addressCases = [
    { id: 'empty', title: 'Empty', value: '' },
    {
        id: 'numbered',
        title: 'With a street number',
        value: '42 Orchard Street',
    },
    {
        id: 'unnumbered',
        title: 'Without a street number',
        value: 'Orchard Street',
    },
] as const;
export const addressCase = (value: string) =>
    value === '' ? 'empty' : hasStreetNumber(value) ? 'numbered' : 'unnumbered';

export function compositionExplanation(
    rules: CompositionRules,
    method: string,
    value: string
) {
    return {
        visibility:
            rules.visibility === 'all'
                ? 'Both delivery methods show the address.'
                : `The shipping predicate is ${method === 'ship'}.`,
        requiredness:
            rules.requiredness === 'always'
                ? 'The required rule always applies.'
                : rules.requiredness === 'never'
                  ? 'No required rule is declared.'
                  : `The shipping predicate is ${method === 'ship'}.`,
        format:
            rules.validation === 'off'
                ? 'No format validator is declared.'
                : value === ''
                  ? 'The format validator accepts an empty value; requiredness is checked separately.'
                  : hasStreetNumber(value)
                    ? 'The stored address passes the street-number check.'
                    : 'The stored address fails the street-number check.',
    };
}

export function compositionRuleChanges(
    saved: CompositionRules,
    current: CompositionRules
) {
    const descriptions = {
        visibility: {
            label: 'Show address',
            values: { all: 'both methods', shipping: 'shipping only' },
        },
        requiredness: {
            label: 'Require address',
            values: {
                never: 'never',
                shipping: 'shipping only',
                always: 'always',
            },
        },
        validation: {
            label: 'Format check',
            values: { off: 'off', on: 'street number' },
        },
    };
    return (Object.keys(descriptions) as (keyof CompositionRules)[])
        .filter(key => saved[key] !== current[key])
        .map(key => {
            const description = descriptions[key];
            const values = description.values as { [value: string]: string };
            return `${description.label}: ${values[saved[key]]} → ${values[current[key]]}`;
        });
}
