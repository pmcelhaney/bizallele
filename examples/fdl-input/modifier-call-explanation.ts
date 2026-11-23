/** Learner-facing descriptions of the cookbook's modifier calls. Never evaluate source. */
export function explainModifierCall(
    chain: string,
    modifier: string,
    call: string
): string {
    const label = /\.label\(\s*(['"])(.*?)\1\s*\)/.exec(chain)?.[2];
    const target = label ? `“${label}”` : 'this field';
    const argument = call.slice(call.indexOf('(') + 1, -1).trim();
    const literal = /^(['"])([\s\S]*)\1$/.exec(argument)?.[2];
    const condition = conditionMeaning(argument);
    switch (modifier) {
        case 'label':
            return literal !== undefined
                ? `Labels this field “${literal}”.`
                : argument.includes("getField('expenseType')")
                  ? 'Updates this field’s label to include the selected expense type.'
                  : 'Calculates this field’s label from the current record.';
        case 'visible':
            return `Shows ${target} when ${condition}, otherwise hides it.`;
        case 'required':
            return !argument || argument === 'true'
                ? `Requires a value for ${target}; leaving it empty fails validation.`
                : argument === 'false'
                  ? `Makes ${target} optional.`
                  : `Requires a value for ${target} when ${condition}; otherwise it is optional.`;
        case 'disabled':
            return !argument || argument === 'true'
                ? `Disables editing of ${target}.`
                : argument === 'false'
                  ? `Enables editing of ${target}.`
                  : `Disables editing of ${target} when ${condition}; otherwise it can be edited.`;
        case 'readOnly':
            return argument === 'false'
                ? `Allows editing of ${target}.`
                : `Displays ${target} as read-only ${argument && argument !== 'true' ? `when ${condition}` : 'instead of allowing edits'}.`;
        case 'validator': {
            const rule = /\bname\s*:\s*(['"])(.*?)\1/.exec(argument)?.[2];
            return rule
                ? `Checks that ${target} ${rule}; a failing value makes the field invalid.`
                : `Checks ${target} against this validation rule; a failing value makes the field invalid.`;
        }
        case 'suggestions':
            return `Finds partial search results for ${target}; typing or receiving results does not change its stored value.`;
        case 'options': {
            const choices = [
                ...argument.matchAll(/\btext\s*:\s*(['"])(.*?)\1/g),
            ].map(match => `“${match[2]}”`);
            if (choices.length)
                return `Offers ${choices.join(', ')} as choices for ${target}.`;
            if (argument.includes('department'))
                return `Updates the available assignees to match the selected department${argument.includes('async') ? ', after the directory lookup finishes' : ''}.`;
            return `Supplies the available choices for ${target} from this options configuration.`;
        }
        case 'formatter':
            return /currency\.format/.test(argument)
                ? `Displays ${target} as US currency${argument.includes('input-focus') ? ', showing the plain number while editing' : ''}; the stored value stays unchanged.`
                : `Formats ${target} for display using this function; the stored value stays unchanged.`;
        case 'parser':
            return /Number/.test(argument)
                ? `Converts input for ${target} to a stored number${argument.includes('replace') ? ', removing dollar signs and commas first' : ''}.`
                : `Converts input for ${target} to its stored value using this function.`;
        case 'defaultValue':
            return `Restores ${target} to ${literal !== undefined ? `“${literal}”` : argument.includes('=>') ? 'the value calculated from the record' : argument} when Record.clear() is called.`;
        case 'emptyWhen':
            return `Treats ${target} as empty ${argument.includes('N/A') ? 'when its value is “N/A”' : 'when this empty-value test passes'}; required validation uses that result.`;
        case 'minLength':
            return `Requires ${target} to contain at least ${argument} characters when a value is provided.`;
        case 'maxLength':
            return `Rejects values for ${target} longer than ${argument} characters.`;
        case 'placeholder':
            return `Shows ${literal !== undefined ? `“${literal}”` : 'the calculated hint'} as a hint while ${target} is empty.`;
        case 'multipleValues':
            return `Lets ${target} store multiple selections rather than a single value.`;
        case 'textAlign':
            return `Aligns ${target} ${literal === 'center' ? 'in the center' : literal === 'right' ? 'to the right' : literal === 'left' ? 'to the left' : 'according to this alignment rule'}.`;
        case 'type':
            return `Uses ${literal ? `the “${literal}” input type` : 'the input type calculated from the record'} for ${target}.`;
        case 'sortable':
            return argument === 'false'
                ? `Prevents sorting the table by ${target}.`
                : `Allows sorting the table by ${target}.`;
        case 'compareFunction':
            return argument.includes('compareShirtSizes')
                ? 'Sorts T-shirt sizes in size order rather than alphabetically.'
                : `Sorts ${target} using ${argument.includes('localeCompare') ? 'locale-aware alphabetical order' : 'this comparison function'}.`;
        case 'filter':
            return `Matches ${target} ${argument.includes('startsWith') ? 'when it starts with the search text' : argument.includes('includes') ? 'when it contains the search text' : 'using this search rule'}${argument.includes('toLowerCase') ? ', ignoring letter case' : ''}.`;
        case 'inputMask':
            return `Defines ${argument === '/[0-9.]/' ? 'digits and periods' : 'the characters matching this pattern'} as the allowed input for ${target}; this adapter does not enforce the mask.`;
        case 'hashFunction':
            return `Identifies ${target} by ${argument.includes('.id') ? 'its ID, so objects with the same ID have the same identity' : 'the key returned by this function'}.`;
        case 'reducer':
            return literal === 'sum'
                ? `Adds the values of ${target} to produce a total.`
                : `Combines the values of ${target} using this aggregation function.`;
        case 'template':
            return argument.includes('Paid in full')
                ? 'Shows “Paid in full” for a zero balance; otherwise shows the formatted balance with “Payment due”.'
                : `Renders ${target} using this custom display template.`;
        case 'cellClass':
        case 'columnClass':
        case 'rowClass': {
            const scope =
                modifier === 'cellClass'
                    ? `${target} cells`
                    : modifier === 'columnClass'
                      ? `the ${target} column`
                      : 'the row';
            const threshold = /value\s*>\s*(\d+)/.exec(argument)?.[1];
            const classValues = argument.includes('=>')
                ? argument.slice(argument.indexOf('?') + 1)
                : argument;
            const classes = [...classValues.matchAll(/(['"])([^'"]+)\1/g)].map(
                match => `“${match[2]}”`
            );
            return `Adds ${classes.length ? classes.join(', ') : 'the calculated styling classes'} to ${scope}${threshold ? ` when the value exceeds ${threshold}; otherwise adds no classes` : argument.includes('Disputed') ? ' when the status is Disputed; otherwise adds no classes' : ''}.`;
        }
        case 'minColumnWidth':
            return `Keeps the ${target} column at least ${argument} pixels wide.`;
        case 'maxColumnWidth':
            return `Keeps the ${target} column at most ${argument} pixels wide.`;
        case 'targetColumnWidth':
            return `Gives the ${target} column a preferred width of ${argument} pixels.`;
        case 'rowCount':
            return `Requests ${argument} visible text rows for ${target} in the legacy textarea adapter.`;
        case 'search':
            return `Configures a search picker for ${target}; this adapter does not provide that picker.`;
        default:
            return `Configures ${target} with this ${modifier} rule.`;
    }
}

function conditionMeaning(argument: string): string {
    if (
        argument === 'whenDeliveryMethodRequiresAddress' ||
        /getField\(['"]fulfillment['"]\)\s*===\s*['"]ship['"]/.test(argument)
    )
        return 'the selected delivery method requires an address';
    if (/getField\(['"]method['"]\)\s*===\s*['"]ship['"]/.test(argument))
        return 'the selected delivery method is shipping';
    if (argument === 'isInternational') return 'the country is outside the US';
    const equality =
        /getField\(['"]([^'"]+)['"]\)\s*(===|!==)\s*['"]([^'"]+)['"]/.exec(
            argument
        );
    if (equality) {
        const names: { [key: string]: string } = {
            followUp: 'follow-up',
            approvalStatus: 'approval status',
            phase: 'phase',
            status: 'request status',
            country: 'country',
            condition: 'condition',
        };
        if (equality[1] === 'followUp' && equality[3] === 'yes')
            return 'follow-up is needed';
        return `the ${names[equality[1]] ?? equality[1]} is ${equality[2] === '!==' ? 'not ' : ''}${equality[3]}`;
    }
    return 'the condition supplied here is true';
}
