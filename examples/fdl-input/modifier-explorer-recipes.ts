import { modifierEntries } from './fdl-modifier-catalog';

export type ExplorerRecipe = {
    name: string;
    category: string;
    signature: string;
    title: string;
    description: string;
    prompt: string;
    steps: readonly string[];
    note: string;
    use: string;
    limitation?: string;
    deprecation?: string;
};

type Detail = [
    category: string,
    signature: string,
    title: string,
    prompt: string,
    steps: [string, string, string],
    note: string,
    use: string,
];

// The catalog owns the modifier inventory, definitions, and runnable examples.
// This view supplies the additional explanation needed for one modifier per page.
const details: { [name: string]: Detail } = {
    suggestions: [
        'Input',
        '(configuration)',
        'Search partial results without changing the committed value.',
        'Search for “lo”, then “zzzz”. Paris remains committed until you choose a result.',
        [
            'The provider receives the query, current record, and optional abort signal.',
            'Typing only changes the search query. Partial or empty results never reconcile the stored value.',
            'Choose London to commit it; Escape or blur restores the committed display without selecting.',
        ],
        'Use a fetch function or { fetch, text, value } configuration. Results may be synchronous or asynchronous. Repeated declarations replace the provider; there is no built-in cache. Suggestions are not an allowed-values constraint. If options() is also declared, its complete list remains authoritative for model reconciliation; the scalar Lit component still uses a combobox. This example supports scalar selection, not multiple-value suggestions.',
        'Typeahead for large directories and remote search where each response is only a partial list.',
    ],
    cellClass: [
        'Tables',
        '(classes)',
        'Apply fixed and conditional cell classes.',
        'Every expense cell receives amount-cell. The table highlights expenses exceeding the daily limit with high-value and over-limit as well.',
        [
            'cellClass(“amount-cell”) adds a class to every expense cell.',
            'The cellClass function returns [“high-value”, “over-limit”] above the daily limit, or [] otherwise.',
            'Both forms compose on the same field; CSS controls their appearance without changing the values.',
        ],
        'Pass a class name, an array of class names, or a function returning either. Return [] when no extra classes apply. Repeated calls accumulate in declaration order. Callbacks receive the field value and containing record. This is a presentation cue, not validation; use validator() when a condition should also invalidate the record.',
        'Consistent cell styling, thresholds, and exceptions.',
    ],
    columnClass: [
        'Tables',
        '(classes)',
        'Style the whole column.',
        'Compare the Expenses heading and cells with the Day column. Only the larger expense receives the extra cell-specific highlight.',
        [
            'columnClass adds shared expense-column and numeric-column classes.',
            'The table applies them to the col, th, and every td in that column.',
            'cellClass adds high-value only to the expense above 100.',
        ],
        'Pass a class name, an array, or a callback with no arguments returning either. Repeated declarations accumulate. A column has no owning record or cell value. Classes also apply to the heading and col when there are no rows; the spanning empty-state cell has no individual column.',
        'Column-wide presentation combined with value-specific exceptions.',
    ],
    compareFunction: [
        'Tables',
        '(compare)',
        'Define the comparison used for sorting.',
        'Sort T-shirt size to see XS through XXL in size order. First and last names sort alphabetically.',
        [
            'A comparator returns a negative value, zero, or a positive value.',
            'The table uses the field comparator when a heading is selected.',
            'compareShirtSizes orders sizes by their position in XS, S, M, L, XL, XXL.',
        ],
        'A comparator returns a negative number, zero, or a positive number to place the first value before, alongside, or after the second. It defines ordering, not equality or filtering. Keep the comparison consistent for all values the field can contain.',
        'Names, domain-specific ordering, and values with a custom sort rule.',
    ],
    defaultValue: [
        'Values',
        '(value)',
        'Restore a default when the record is cleared.',
        'Edit the document title, then clear the record to restore “Untitled document”.',
        [
            'The field definition declares a default value.',
            'The record starts with the supplied title, “Quarterly plan”.',
            'Record.clear() replaces its value with the default.',
        ],
        'A default is not a placeholder. It becomes stored data when clear() applies it; it does not overwrite an explicitly supplied initial value.',
        'Untitled documents, draft statuses, and meaningful reset values.',
    ],
    disabled: [
        'Conditional state',
        '(predicate?)',
        'Disable editing for a field.',
        'System ID is always disabled. Choose Approved to disable Budget; return to Draft to enable it.',
        [
            'disabled() declares a permanent disabled state; disabled(predicate) evaluates the record.',
            'The component exposes it through the native control.',
            'The record retains its system ID.',
        ],
        'Disabled controls and printed read-only values have different interaction semantics. Disabling a control is not a security boundary; application code can still update the record.',
        'System-managed identifiers and values unavailable in a workflow.',
    ],
    emptyWhen: [
        'Validation',
        '(predicate)',
        'Define when a value is considered empty.',
        'Compare the required Reference with Optional reference. Try N/A, a real reference, and whitespace in each.',
        [
            'The field adds a custom emptiness predicate.',
            'N/A counts as empty even though it contains characters.',
            'Both fields report emptiness as you type, but only the required field rejects an empty value.',
        ],
        'emptyWhen does not rewrite the value. Whitespace-only and blank values already count as empty; this predicate also treats N/A as empty. Required validation uses all emptiness rules on the finalized field, regardless of whether emptyWhen() is declared before or after required(). Reference is required, so an empty value fails validation. Optional reference omits required(), so the same empty value is valid.',
        'Sentinel values, imported blanks, and domain-specific missing data.',
    ],
    filter: [
        'Tables',
        '(matches)',
        'Define how filter text matches field values.',
        'Enter ar in Search names. Starts with matches no names; choose Contains to find Margaret.',
        [
            'The field defines how filter text matches a value.',
            'The table passes filter text and each cell value to the matcher.',
            'Matching rows remain in the view.',
        ],
        'This example starts with prefix matching: no name begins with ar. Choose Contains and Margaret appears because ar occurs inside the name. Filtering changes which records appear; it does not delete records from the source data.',
        'Prefix searches, case-insensitive lookup, and domain-specific matches.',
    ],
    hashFunction: [
        'Values',
        '(identity)',
        'Identify object values by a stable key.',
        'Change either employee ID. Separate objects share an identity only when the IDs match.',
        [
            'The example creates two distinct employee objects.',
            'The hash function extracts each employee ID.',
            'A consumer can compare the resulting keys to match object identity.',
        ],
        'This is an identity key, not a cryptographic hash. Keys must be stable and distinct for items your consumer needs to distinguish.',
        'Object-valued options and matching fetched objects to stored selections.',
    ],
    inputMask: [
        'Input',
        '(regex)',
        'Accept only characters that match the input mask.',
        'Type or paste digits, periods, and letters. Only digits and periods remain in the field.',
        [
            'The field declares a character-level regular expression.',
            'The input adapter checks entered characters against the mask.',
            'Matching characters are accepted; other characters are ignored.',
        ],
        'The mask filters user input; it does not validate the complete value. For example, multiple periods match this mask. Use a validator for whole-value rules. Programmatic record assignments are not filtered.',
        'Character filtering while typing or pasting.',
    ],
    label: [
        'Input',
        '(textOrFunction)',
        'Set a static or record-dependent label.',
        'Change the expense type and watch the Amount label change.',
        [
            'The label callback reads expenseType from the record.',
            'The component requests the current label.',
            'A record change updates the accessible label alongside the control.',
        ],
        'The label identifies the field. A placeholder is a temporary hint and should not replace a label. Keep dynamic labels clear outside the surrounding layout.',
        'Context-aware forms and reusable field definitions.',
    ],
    maxColumnWidth: [
        'Tables',
        '(pixels)',
        'Set the maximum column width.',
        'Drag the divider right, or focus it and use the arrow keys. The first column stops at 180px.',
        [
            'The field declares a maximum width.',
            'The table uses the limit when allocating column space.',
            'Resizing stops at the maximum and preserves the table width.',
        ],
        'This is width guidance for consumers that support it. It does not truncate stored data; wrapping, overflow, and typography remain presentation choices.',
        'Short codes and columns that should not consume spare space.',
    ],
    maxLength: [
        'Validation',
        '(length)',
        'Validate the maximum value length.',
        'The input caps typing at 12 characters. Assign an overlong model value to see Bizallele reject it too.',
        [
            'The field declares a maximum length of 12.',
            'The component exposes the native input constraint.',
            'Bizallele also validates length for values assigned through the model.',
        ],
        'The model-assignment button deliberately bypasses the native input cap. The record still reports an error, so imported and programmatic values follow the same rule as typed values.',
        'Short codes and externally constrained identifiers.',
    ],
    minColumnWidth: [
        'Tables',
        '(pixels)',
        'Set the minimum column width.',
        'Drag the divider left, or focus it and use the arrow keys. The first column stops at 110px.',
        [
            'The field declares a minimum width.',
            'The table allocates at least that amount of space.',
            'Resizing cannot shrink the column below the limit.',
        ],
        'Minimum widths can require horizontal scrolling on small screens. This is a consumer layout constraint, not a rule about the field value.',
        'Names, labels, and values that need a readable lower bound.',
    ],
    minLength: [
        'Validation',
        '(length)',
        'Validate the minimum value length.',
        'Choose a minimum length, then check a shorter code and a longer one. The entered value is preserved when the rule changes.',
        [
            'The field declares the selected minimum length (initially four).',
            'The component exposes the input hint.',
            'Record validation reports values that fall short.',
        ],
        'A minimum length is not a required rule. Empty values may be accepted unless required() is also declared; combine the rules when a value must be present.',
        'Access codes and non-empty values with a minimum useful length.',
    ],
    multipleValues: [
        'Input',
        '(min, max)',
        'Store multiple selected values in an array.',
        'Open the Skills dropdown and check any combination. Compare the stored array.',
        [
            'The field declares that its value contains multiple selections.',
            'The component renders a dropdown with a checkbox for each option.',
            'Selected option values are synchronized as an array.',
        ],
        'The declared cardinality limits are metadata in this adapter; it does not enforce the minimum or maximum selection count. Add an explicit validator if your record needs that guarantee.',
        'Skills, tags, and other collections drawn from known options.',
    ],
    options: [
        'Input',
        '(options)',
        'Supply choices from a list, a function, or an async function.',
        'Switch Department: Margaret Hamilton appears in both lists and stays selected. Then try Grace Hopper in Engineering and switch to Finance.',
        [
            'The function returns choices for the current department.',
            'The async function returns the same choices after a simulated directory lookup.',
            'A value shared by both lists stays selected. A selection missing from the refreshed choices is cleared.',
        ],
        'Both functions receive the current record. A regular function returns an array; an async function returns a promise of an array. A shared option remains selected after the list refreshes. If a stored value is absent from the new list, the record automatically clears it when the latest choices finish loading.',
        'Dependent dropdowns, shared choices, and asynchronously loaded directories.',
    ],
    parser: [
        'Values',
        '(parse)',
        'Convert input into a stored value.',
        'Edit the money value, including a dollar sign or commas, and compare the stored number.',
        [
            'The input supplies a display value.',
            'The parser strips currency punctuation and converts to a number.',
            'The record stores the parsed result for other consumers.',
        ],
        'A parser transforms data; it does not validate it. Your editing text stays unchanged while you type; currency formatting is applied when you leave the field. Production parsing should define how to handle malformed or locale-specific values.',
        'Currency input, normalization, and conversions into domain values.',
    ],
    placeholder: [
        'Input',
        '(text)',
        'Show hint text in an empty input.',
        'Type a project name. The hint disappears as soon as the field has a value.',
        [
            'The field supplies placeholder text.',
            'The component displays it while the input is empty.',
            'Typing stores a real value without copying the hint into the record.',
        ],
        'A placeholder is not a default or a label. It does not create a value, satisfy requiredness, or remain visible while someone edits.',
        'Short examples and input-format hints.',
    ],
    record: [
        'Adapter contracts',
        '(fields)',
        'Define a structured value with named child fields.',
        'Read the composite-field contract and current adapter limitation below.',
        [
            'The modifier records the child field definitions.',
            'A compatible consumer can render those children as one grouped control.',
            'The current native adapter does not provide that composite interaction.',
        ],
        'The value is a nested object whose child validation and rendering contract must be defined by a compatible adapter.',
        'Addresses, ranges, and other structured values.',
    ],
    recordset: [
        'Adapter contracts',
        '(fields)',
        'Define a repeated structured value with record-shaped rows.',
        'Read the nested-recordset contract and current adapter limitation below.',
        [
            'The modifier records the row field definitions.',
            'A compatible consumer can render and edit the rows as one grouped value.',
            'The current native adapter does not provide that nested recordset interaction.',
        ],
        'The value is an array of nested objects; row creation, deletion, validation, and rendering need an explicit compatible adapter.',
        'Line items, repeated contacts, and other structured collections.',
    ],
    readOnly: [
        'Conditional state',
        '(setting = true)',
        'Render printed output always or when a predicate is true.',
        'The owner is always printed. Switch to Submitted to print the request owner; switch back to edit.',
        [
            'readOnly() declares a permanent read-only state.',
            'A predicate reads the current workflow phase to control the request owner.',
            'Draft restores the input without losing its value.',
        ],
        'This adapter renders read-only values as text. The setting does not prevent application code from updating the model or replace application authorization.',
        'Review screens, submitted records, and values supplied by another system.',
    ],
    reducer: [
        'Values',
        '(functionOrName)',
        'Aggregate a collection of values.',
        'Edit any amount and watch the sum update from the same field reducer.',
        [
            'The field selects the built-in sum reducer.',
            'The consumer collects the three numeric values.',
            'aggregate() applies the reducer to produce a total.',
        ],
        'The reducer does not decide which rows to include. A consumer must choose whether totals cover all records, filtered records, or only the current page.',
        'Totals and other column-level aggregate results.',
    ],
    rowClass: [
        'Tables',
        '(classes)',
        'Compute row classes from a record.',
        'Compare the disputed row with the paid row. The status drives a row-wide treatment.',
        [
            'rowClass(“invoice-row”) adds one class to every row; a second call returns [“disputed-row”, “needs-review”] for disputed invoices.',
            'The table attaches those classes to the containing row.',
            'The theme applies the row treatment across its cells.',
        ],
        'Pass a class name, an array of class names, or a function of the record returning either. Repeated calls accumulate in declaration order. The classes are presentation hooks. A disputed row is still data, and its styling does not validate a workflow state or authorize an action.',
        'Exception rows and status-driven table treatments.',
    ],
    rowCount: [
        'Input',
        '(rows)',
        'Set the visible row count of a textarea.',
        'Choose 1, 4, or 10 rows to resize the textarea without changing your comment.',
        [
            'The example chooses a textarea in the component configuration.',
            'rowCount supplies its visible row count.',
            'The record stores the text independently of that viewport.',
        ],
        'Row count controls the initial visible size, not a line limit or a maximum character count. Users can enter more text than the visible area holds.',
        'Comments, descriptions, and longer notes.',
    ],
    search: [
        'Adapter contracts',
        '(config)',
        'Configure search metadata for a compatible adapter.',
        'Read the search contract and the current adapter limitation below.',
        [
            'The field records search configuration.',
            'A compatible component must implement the search interaction.',
            'The native adapter does not provide a search dialog or results view.',
        ],
        'A search configuration is not itself a search service. Data fetching, result presentation, selection, and accessibility need an explicit integration.',
        'Search-capable option controls with a defined integration.',
    ],
    semanticType: [
        'Adapter contracts',
        '(name)',
        'Declare domain meaning independently of the renderer.',
        'Read the semantic-type contract and current adapter limitation below.',
        [
            'The field records a domain-level name such as address or line-items.',
            'A compatible consumer can choose a specialized component from that meaning.',
            'The native adapter leaves component selection unchanged.',
        ],
        'A semantic type is a hint about meaning, not a control selector. Combine it with record() or recordset() when the value is structured.',
        'Specialized field adapters such as address or line-item editors.',
    ],
    sortable: [
        'Tables',
        '(enabled)',
        'Enable or disable column sorting.',
        'Sort by First name or Last name, then compare the T-shirt size heading, where sorting is disabled.',
        [
            'The T-shirt size field declares sortable(false).',
            'The table reads that metadata for each heading.',
            'Sortable headings expose actions; T-shirt size remains a plain heading.',
        ],
        'Disabling a heading action does not make values intrinsically unordered. Another consumer can still compare or sort the same data through a separate API.',
        'Computed, action, and descriptive columns with no useful sort action.',
    ],
    targetColumnWidth: [
        'Tables',
        '(pixels)',
        'Set a preferred column width.',
        'Inspect the preferred 140px column, then resize it with the divider or arrow keys.',
        [
            'The field declares a preferred width.',
            'The table starts from that width where its layout permits.',
            'The declared minimum and maximum still constrain resizing.',
        ],
        'A target is a preference, not a fixed width. The consumer may adjust it to available space and neighboring columns.',
        'A useful starting layout that still allows adjustment.',
    ],
    template: [
        'Display',
        '(render)',
        'Render different content for paid and unpaid invoices.',
        'Compare the paid invoice with the invoices that still have a balance due.',
        [
            'The record stores a numeric balance.',
            'The formatter supplies the dollar amount to the template.',
            'The template checks the raw balance: zero renders “✓ Paid in full”; otherwise it renders the amount with “Payment due”.',
        ],
        'The formatter supplies a display value to the template; the template can also read raw values from the record to choose its output. Templates leave stored values unchanged. This example returns Lit markup and uses CSS for its paid and payment-due treatments.',
        'Conditional labels, status summaries, and rich table cells.',
    ],
    textAlign: [
        'Tables',
        '(alignment)',
        'Align column headings and values.',
        'Compare the headings and names aligned left, center, and right.',
        [
            'Each field declares an alignment intent.',
            'The table reads the left, center, or right value.',
            'The table applies that alignment to both column headings and cells.',
        ],
        'Bizallele does not automatically right-align numbers. Examples with amounts, counts, totals, or percentages should declare right alignment explicitly.',
        'Consistent alignment across table consumers and exports.',
    ],
    type: [
        'Input',
        '(inputType)',
        'Explore all 21 native input types.',
        'Choose an input type to try its native control. Each selection starts with a suitable example value.',
        [
            'The field declares the selected input type.',
            'The component creates the corresponding native input control.',
            'Value controls update the record; checkbox and radio inputs store Booleans.',
        ],
        'Browser appearance and support vary. Native input types do not add Bizallele validation rules; declare business validation separately. Hidden inputs have no visible control, and buttons perform actions rather than edit values. File selection is local to your browser and is not uploaded.',
        'Text, dates, numbers, choices, and other native input modes.',
    ],
    validator: [
        'Validation',
        '(rule)',
        'Add named rules for emails, quantities, and usernames.',
        'Check each starting value, then try the valid values suggested beside each field.',
        [
            'The email rule checks a simple address shape.',
            'Quantity rules check an integer and a range; username rules check its first character and allowed characters.',
            'Validators accumulate. Each field must pass all its rules, and Bizallele supplies the corresponding error messages.',
        ],
        'The email checker is deliberately simple: it checks for non-whitespace text around @ and a dot in the domain. It does not cover every valid email format or verify that an address exists. These synchronous rules run in the model, independently of browser validation.',
        'Email format checks, order limits, and application-specific rules.',
    ],
};

export const additionalRecipes: ExplorerRecipe[] = modifierEntries
    .filter(entry => !['required', 'formatter', 'visible'].includes(entry.name))
    .map(entry => {
        const detail = details[entry.name];
        if (!detail)
            throw new Error(`Missing explorer detail for ${entry.name}`);
        const [category, signature, title, prompt, steps, note, use] = detail;
        return {
            name: entry.name,
            category,
            signature,
            title,
            description: entry.intent,
            prompt,
            steps,
            note,
            use,
            limitation: entry.limitation,
            deprecation:
                entry.name === 'rowCount'
                    ? 'Textarea sizing is a presentation concern. Move row-count configuration into fdl-field instead of FieldType.'
                    : undefined,
        };
    });
