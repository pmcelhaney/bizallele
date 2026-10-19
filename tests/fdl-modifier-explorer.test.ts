import type { FdlExample } from '../examples/fdl-input/fdl-example';
import type { FdlField } from '@pmcelhaney/bizallele/lit/fdl-field';
import FieldTypeBuilder from '../src/field-type-builder';
import { inputTypes } from '../src/types/input-types.types';
import { modifierPage, modifierPageGroups } from '../examples/fdl-input/modifier-page-groups';
import { relatedModifierNames } from '../examples/fdl-input/related-modifiers';
import { categoryDescriptions } from '../examples/fdl-input/category-icon';
import { displayedModifierSignatures as modifierSignatures } from '../examples/fdl-input/modifier-signatures';
import { exampleSource } from '../examples/fdl-input/modifier-example-source';
import '../examples/fdl-input/fdl-modifier-explorer';
import { explorerRecipes } from '../examples/fdl-input/fdl-modifier-explorer';
import { modifierEntries, FdlModifierCatalog } from '../examples/fdl-input/fdl-modifier-catalog';
import type { FdlModifierExplorer } from '../examples/fdl-input/fdl-modifier-explorer';

beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
});

async function stateText(host: HTMLElement): Promise<string> {
    const inspector =
        host.shadowRoot!.querySelector('fdl-record-inspector') ??
        host.shadowRoot!.querySelector('fdl-recordset-inspector');
    if (inspector) {
        await inspector.updateComplete;
        return inspector.shadowRoot!.textContent!;
    }
    return host.shadowRoot!.querySelector('.focused-state')!.textContent!;
}

const settle = async (page: FdlModifierExplorer) => {
    await page.updateComplete;
    await Promise.all(
        [...page.shadowRoot!.querySelectorAll('fdl-field')].map(
            field => (field as any).updateComplete
        )
    );
};

const openPage = async (hash = '#required') => {
    window.location.hash = hash;
    const page = document.createElement('fdl-modifier-explorer') as FdlModifierExplorer;
    document.body.append(page);
    await settle(page);
    return page;
};

afterEach(() => {
    document.body.replaceChildren();
    window.location.hash = '';
});

describe('modifier explorer', () => {
    it('retains a modifier experiment and source tab through reference and modifier detours until reset', async () => {
        const page = await openPage('#required');
        const root = page.shadowRoot!;
        const example = root.querySelector('fdl-example') as FdlExample;
        await example.updateComplete;
        const input = root.querySelector('fdl-field')!.shadowRoot!.querySelector('input')!;
        input.value = 'Ada Review';
        input.dispatchEvent(new Event('input'));
        root.querySelector<HTMLButtonElement>('.primary')!.click();
        await settle(page);
        expect(root.querySelector('.result')!.textContent).toContain('The record is valid');
        example.shadowRoot!.querySelector<HTMLButtonElement>('[role="tab"][id="example-tab-1"]')!.click();
        await example.updateComplete;

        for (const destination of ['#integration', '#formatter']) {
            window.location.hash = destination;
            window.dispatchEvent(new Event('hashchange'));
            await settle(page);
            window.location.hash = '#required';
            window.dispatchEvent(new Event('hashchange'));
            await settle(page);
            expect(root.querySelector('fdl-example')).toBe(example);
            expect(example.shadowRoot!.querySelector('[aria-selected="true"]')!.textContent).toContain('required-model.js');
            expect(root.querySelector('fdl-field')!.shadowRoot!.querySelector('input')!.value).toBe('Ada Review');
            expect(root.querySelector('.result')!.textContent).toContain('The record is valid');
        }

        example.shadowRoot!.querySelector<HTMLButtonElement>('#example-tab-0')!.click();
        await example.updateComplete;
        root.querySelector<HTMLButtonElement>('.reset')!.click();
        await settle(page);
        expect(await stateText(page)).toContain('(empty string)');
        expect(root.querySelector('.result')!.textContent).toContain('The model is invalid');
    });

    it('shows the populated address in the semantic-type example source', () => {
        const source = exampleSource('semanticType').definition;

        expect(source).toContain('address: field');
        expect(source).toContain(".semanticType('address')");
        expect(source).toContain("street: '1 Main Street'");
        expect(source).not.toContain('value: null');
    });

    it.each([
        [390, false],
        [800, false],
        [1024, true],
    ])(
        'keeps navigation links usable without tooltips at width %s with touch=%s',
        async (width, touch) => {
            const originalWidth = window.innerWidth;
            const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
            Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
            Object.defineProperty(window, 'matchMedia', {
                configurable: true,
                value: jest.fn(() => ({ matches: touch })),
            });
            try {
                const page = await openPage('#required');
                const link = page.shadowRoot!.querySelector<HTMLAnchorElement>(
                    '.modifier-list a[href="#formatter"]'
                )!;
                link.dispatchEvent(new MouseEvent('mouseenter'));
                link.dispatchEvent(new FocusEvent('focus'));
                await settle(page);
                expect(page.shadowRoot!.querySelector('#modifier-tooltip')).toBeNull();
                expect(link.getAttribute('aria-describedby')).toBe('');
                link.click();
                await settle(page);
                expect(window.location.hash).toBe('#formatter');
                expect(link.getAttribute('aria-current')).toBe('page');
                expect(page.shadowRoot!.querySelector('#modifier-tooltip')).toBeNull();
            } finally {
                Object.defineProperty(window, 'innerWidth', {
                    configurable: true,
                    value: originalWidth,
                });
                if (originalMatchMedia) {
                    Object.defineProperty(window, 'matchMedia', originalMatchMedia);
                } else {
                    delete (window as any).matchMedia;
                }
            }
        }
    );

    it('shows one modifier, supports next/back and direct links, and disables boundary controls', async () => {
        const page = await openPage('#cellClass');
        const root = page.shadowRoot!;
        expect(root.querySelector('h1')!.textContent).toBe('.cellClass(classes)');
        expect(root.querySelector<HTMLButtonElement>('.pager')!.disabled).toBe(true);
        root.querySelector<HTMLButtonElement>('.next')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toContain('.columnClass(classes)');
        root.querySelector<HTMLButtonElement>('.pager')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe('.cellClass(classes)');
        root.querySelector<HTMLAnchorElement>('a[href="#visible"]')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toContain('.visible(predicate)');
        expect(root.querySelector<HTMLButtonElement>('.next')!.disabled).toBe(true);
        expect(window.location.hash).toBe('#visible');
        window.location.hash = explorerRecipes[explorerRecipes.length - 1].name;
        window.dispatchEvent(new Event('hashchange'));
        await settle(page);
        expect(root.querySelector<HTMLButtonElement>('.next')!.disabled).toBe(true);
    });

    it('validates the actual Bizallele record and resets the demonstration', async () => {
        const page = await openPage();
        const root = page.shadowRoot!;
        root.querySelector<HTMLButtonElement>('.primary')!.click();
        await settle(page);
        expect(root.querySelector('.result')!.textContent).toContain('Legal name is required');
        const field = root.querySelector('fdl-field')!;
        const input = field.shadowRoot!.querySelector('input')!;
        input.value = 'Ada Lovelace';
        input.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelector('.result')!.textContent).toContain('The record is valid');
        expect(await stateText(page)).toContain('Ada Lovelace');
        root.querySelector<HTMLButtonElement>('.reset')!.click();
        await settle(page);
        expect(await stateText(page)).toContain('(empty string)');
        expect(root.querySelector('.result')!.textContent).toContain(
            'Check record shows its validation message'
        );
    });

    it('loads a formatter deep link and preserves the raw number', async () => {
        const page = await openPage('#formatter');
        expect(page.shadowRoot!.querySelector('.formatted strong')!.textContent).toBe('$1,250.00');
        const input = page
            .shadowRoot!.querySelector('fdl-field')!
            .shadowRoot!.querySelector('input')!;
        expect(input.value).toBe('1250');
        input.value = '42';
        input.dispatchEvent(new Event('input'));
        await settle(page);
        expect(page.shadowRoot!.querySelector('.formatted strong')!.textContent).toBe('$42.00');
        expect(await stateText(page)).toContain('42');
    });

    it('updates conditional visibility through the record without losing the address', async () => {
        const page = await openPage('#visible');
        const root = page.shadowRoot!;
        const select = root
            .querySelector('fdl-field[field="fulfillment"]')!
            .shadowRoot!.querySelector('select')!;
        select.value = 'pickup';
        select.dispatchEvent(new Event('input'));
        select.dispatchEvent(new Event('change'));
        await settle(page);
        expect(root.querySelector('.dependency-trace')).toBeNull();
        expect(select.value).toBe('pickup');
        expect(await stateText(page)).toContain('pickup');
        const address = root.querySelector('fdl-field[field="address"]')!;
        expect(address.shadowRoot!.querySelector('input')).toBeNull();
        expect(await stateText(page)).toContain('42 Orchard Street');
        select.value = 'ship';
        select.dispatchEvent(new Event('input'));
        select.dispatchEvent(new Event('change'));
        await settle(page);
        expect(address.shadowRoot!.querySelector('input')!.value).toBe('42 Orchard Street');
    });
});

describe('complete explorer', () => {
    it('covers the documented modifier inventory exactly once in alphabetical order', async () => {
        const page = await openPage();
        expect(explorerRecipes.map(recipe => recipe.name).sort()).toEqual(
            modifierEntries.map(entry => entry.name).sort()
        );
        expect(new Set(explorerRecipes.map(recipe => recipe.name)).size).toBe(
            explorerRecipes.length
        );
        const names = [...page.shadowRoot!.querySelectorAll('.modifier-list strong')].map(
            link => link.textContent!
        );
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
    });

    it('covers all public builder modifiers outside the compatibility-only surface', () => {
        const builder = new FieldTypeBuilder() as unknown as { [name: string]: unknown };
        const omitted = new Set([
            'accept',
            'additionalProperties',
            'autofocus',
            'autocomplete',
            'formatOnChange',
            'hideLabel',
            'list',
            'max',
            'onValueChange',
            'description',
            'hasSearch',
            'inline',
            'parseDynamicRange',
            'pattern',
            'readOnlyExceptionWhen',
            'segmented',
            'selectionDisabledFunctions',
            'step',
            'usesCustomPrint',
        ]);
        const expected = Object.getOwnPropertyNames(Object.getPrototypeOf(builder))
            .filter(
                name => !['constructor', 'copy', 'valueOf'].includes(name) && !omitted.has(name)
            )
            .filter(name => typeof builder[name] === 'function')
            .sort();
        expect(explorerRecipes.map(recipe => recipe.name).sort()).toEqual(expected);
    });

    it.each(explorerRecipes.map(recipe => [recipe.name, recipe] as const))(
        'opens the %s deep link with its example on the appropriate reference page',
        async (name, recipe) => {
            const page = await openPage(`#${name}`);
            const section = page.shadowRoot!.getElementById(name)!;
            expect(page.shadowRoot!.querySelectorAll('h1')).toHaveLength(1);
            expect(page.shadowRoot!.querySelector('#modifier-jump')).toBeNull();
            expect(page.shadowRoot!.querySelector('h1')!.textContent).toBe(
                modifierPage(name).title || `.${name}${recipe.signature}`
            );
            expect(section.querySelector('h2.modifier-signature')!.textContent).toBe(
                modifierSignatures[name]
            );
            const link = page.shadowRoot!.querySelector(`.modifier-list a[href="#${name}"]`)!;
            expect(link.querySelector('small')).toBeNull();
            expect(link.querySelector('.category-icon')!.getAttribute('data-category')).toBe(
                recipe.category
            );
            expect(
                link.querySelector(
                    '.category-icon path, .category-icon rect, .category-icon ellipse'
                )!.namespaceURI
            ).toBe('http://www.w3.org/2000/svg');
            expect(link.getAttribute('aria-label')).toBe(`${name} — ${recipe.category}`);
            link.dispatchEvent(new MouseEvent('mouseenter'));
            await settle(page);
            expect(page.shadowRoot!.querySelector('[role=tooltip]')!.textContent).toContain(
                modifierSignatures[name]
            );
            expect(page.shadowRoot!.querySelector('[role=tooltip]')!.textContent).toContain(
                recipe.title
            );
            link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            await settle(page);
            expect(page.shadowRoot!.querySelector('[role=tooltip]')).toBeNull();
            const option = [...page.shadowRoot!.querySelectorAll('.category-options label')].find(
                label => label.textContent?.trim() === recipe.category
            )!;
            expect(option.querySelector('.category-icon')!.getAttribute('data-category')).toBe(
                recipe.category
            );

            if (modifierPage(name).names.length > 1) {
                expect(
                    page.shadowRoot!.querySelector('fdl-column-widths, fdl-text-length')
                ).toBeTruthy();
                page.remove();
                return;
            }
            if (recipe.limitation) {
                expect(section.querySelector('fdl-example')).toBeNull();
                expect(section.querySelector('.limitation pre')!.textContent).toContain(
                    `.${name}(`
                );
                page.remove();
                return;
            }
            const frame = section.querySelector('fdl-example') as FdlExample;
            await frame.updateComplete;
            expect(frame.sources[exampleSource(name).modelFile]).toBe(
                exampleSource(name).definition
            );
            expect(frame.shadowRoot!.querySelector('.focused-line')).toBeTruthy();
            expect(page.shadowRoot!.querySelector('.chapter')).toBeNull();
            const categoryButton =
                page.shadowRoot!.querySelector<HTMLButtonElement>('.page-category-icon')!;
            expect(categoryButton.getAttribute('aria-label')).toBe(`Category: ${recipe.category}`);
            expect(
                categoryButton.querySelector('.category-icon')!.getAttribute('data-category')
            ).toBe(recipe.category);
            categoryButton.dispatchEvent(new FocusEvent('focus'));
            await settle(page);
            expect(page.shadowRoot!.querySelector('#category-tooltip strong')!.textContent).toBe(
                recipe.category
            );
            expect(page.shadowRoot!.querySelector('#category-tooltip > span')!.textContent).toBe(
                categoryDescriptions[recipe.category]
            );
            expect(categoryDescriptions[recipe.category].length).toBeGreaterThan(40);
            categoryButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            await settle(page);
            expect(page.shadowRoot!.querySelector('#category-tooltip')).toBeNull();
            expect(frame.sources[exampleSource(name).uiFile]).toBe(exampleSource(name).ui);
            expect(frame.sources['example.css']).toBe(exampleSource(name).styles || undefined);
            const demo = section.querySelector('.playground')!;
            expect(frame.contains(demo)).toBe(true);
            frame.shadowRoot!.querySelector('details')!.open = true;
            for (let index = 0; index < frame.filenames.length; index++) {
                frame
                    .shadowRoot!.querySelector<HTMLButtonElement>(`#example-tab-${index + 1}`)!
                    .click();
                await frame.updateComplete;
                const panel = frame.shadowRoot!.querySelector('[role="tabpanel"]:not([hidden])')!;
                expect(panel.querySelector('code')!.textContent).toBe(
                    frame.sources[frame.filenames[index]]
                );
                expect(section.querySelector('.playground')).toBe(demo);
            }
            if (!['required', 'formatter', 'visible'].includes(name)) {
                const catalog = section.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
                await catalog.updateComplete;
                expect(catalog.shadowRoot!.querySelectorAll('[data-modifier]')).toHaveLength(1);
                expect(catalog.shadowRoot!.querySelectorAll('.cookbook-recipe')).toHaveLength(0);
                if (recipe.limitation) {
                    expect(catalog.shadowRoot!.querySelector('.limitation')!.textContent).toContain(
                        'Adapter support needed'
                    );
                } else {
                    expect((await stateText(catalog)).length).toBeGreaterThan(1);
                }
            }
        }
    );

    it('keeps the current page and navigates within the filtered results', async () => {
        const page = await openPage();
        const root = page.shadowRoot!;
        const search = root.querySelector<HTMLInputElement>('#modifier-search')!;
        expect(root.querySelector('.match-count')).toBeNull();
        expect(search.getAttribute('aria-label')).toBe('Find a modifier');
        expect(root.querySelector('.search-label')).toBeNull();
        expect(root.querySelector('.modifier-search-field svg')!.getAttribute('aria-hidden')).toBe(
            'true'
        );
        search.value = 'tables';
        search.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(0);
        search.value = ' WIDTH ';

        search.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(3);
        expect(
            root
                .querySelector('.filter-status .match-count')!
                .textContent!.replace(/\s+/g, ' ')
                .trim()
        ).toBe(`(3 of ${explorerRecipes.length} shown)`);
        expect(root.querySelector('h1')!.textContent).toBe('.required(predicate?)');
        root.querySelector<HTMLButtonElement>('.next')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe('Column widths');
        expect(root.querySelector('.page-count')!.textContent).toContain('1 of 1');
        expect(root.querySelector('.page-count')!.textContent).toContain('Filtered pages');
        search.value = 'no matching modifier';
        search.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelector('.empty-search')!.textContent).toContain('No modifiers match');
    });

    it('opens a modifier from the list and resets its example', async () => {
        const page = await openPage();
        const root = page.shadowRoot!;
        root.querySelector<HTMLAnchorElement>('nav a[href="#defaultValue"]')!.click();
        await settle(page);
        let catalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
        await catalog.updateComplete;
        catalog.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
        await catalog.updateComplete;
        expect(await stateText(catalog)).toContain('Untitled document');
        root.querySelector<HTMLButtonElement>('.reset')!.click();
        await settle(page);
        catalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
        await catalog.updateComplete;
        expect(await stateText(catalog)).toContain('Quarterly plan');
    });
});

describe('extended model exercises', () => {
    it('recomputes an aggregate when its Bizallele-backed input changes', async () => {
        const page = await openPage('#reducer');
        const catalog = page.shadowRoot!.querySelector(
            'fdl-modifier-catalog'
        ) as FdlModifierCatalog;
        await catalog.updateComplete;
        const field = catalog.shadowRoot!.querySelector('fdl-field[field="secondAmount"]') as any;
        await field.updateComplete;
        const input = field.shadowRoot.querySelector('input') as HTMLInputElement;
        input.value = '300';
        input.dispatchEvent(new Event('input'));
        await catalog.updateComplete;
        expect(catalog.shadowRoot!.querySelector('.computed')!.textContent).toContain('$2,000.00');
        expect(await stateText(catalog)).toContain('2000');
    });

    it('shows actual hydrated and sorted table rows in the state panel', async () => {
        const page = await openPage('#sortable');
        const catalog = page.shadowRoot!.querySelector(
            'fdl-modifier-catalog'
        ) as FdlModifierCatalog;
        await catalog.updateComplete;
        const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
        await table.updateComplete;
        await table.recordset.requestImmediateUpdate();
        await catalog.updateComplete;
        await table.updateComplete;
        expect(await stateText(catalog)).toContain('Zulu');
        const sort = table.shadowRoot.querySelector(
            'button[title="Sort by Last name"]'
        ) as HTMLButtonElement;
        sort.click();
        await table.recordset.requestImmediateUpdate();
        await catalog.updateComplete;
        const state = JSON.parse(
            catalog
                .shadowRoot!.querySelector('fdl-recordset-inspector')!
                .shadowRoot!.querySelector('pre')!.textContent!
        );
        expect(state.visibleRows[0].lastName).toBe('Alpha');
        expect(state.sortColumns[0].field).toBe('lastName');
        expect(table.shadowRoot.querySelector('button[title="Sort by T-shirt size"]')).toBeNull();
        expect(table.shadowRoot.textContent).toContain('T-shirt size');
        expect(state.visibleRows.map((row: any) => row.shirtSize).sort()).toEqual(
            ['L', 'M', 'S', 'XL', 'XS', 'XXL'].sort()
        );
        expect(state.totalRecords).toBe(6);
    });

    it('rejects an overlong value assigned directly to the model', async () => {
        const page = await openPage('#maxLength');
        const catalog = page.shadowRoot!.querySelector('fdl-text-length') as any;
        await catalog.updateComplete;
        catalog.shadowRoot!.querySelector('.model-assignment')!.click();
        await catalog.updateComplete;
        const field = catalog.shadowRoot!.querySelector('fdl-field[field="code"]') as any;
        await field.updateComplete;
        expect(field.shadowRoot.querySelector('[aria-invalid="true"]')).toBeTruthy();
        expect(await stateText(catalog)).toContain('XXXXXXXXXXXXX');
    });
});

describe('category navigation filters', () => {
    it('keeps category choices in a dropdown and closes with Escape or an outside click', async () => {
        const page = await openPage();
        const menu = page.shadowRoot!.querySelector<HTMLDetailsElement>('.category-filters')!;
        expect(menu.open).toBe(false);
        expect(menu.querySelector('summary')!.textContent?.trim()).toBe('All categories');
        menu.open = true;
        menu.querySelector<HTMLInputElement>('input')!.click();
        await settle(page);
        expect(menu.open).toBe(true);
        expect(menu.querySelector('summary')!.getAttribute('aria-label')).not.toContain(
            'all categories'
        );
        menu.querySelector('input')!.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        );
        expect(menu.open).toBe(false);
        expect(page.shadowRoot!.activeElement).toBe(menu.querySelector('summary'));
        menu.open = true;
        window.dispatchEvent(new MouseEvent('click'));
        expect(menu.open).toBe(false);
    });

    it('combines categories with OR and search with AND, and clears both filters', async () => {
        const page = await openPage('#formatter');
        const root = page.shadowRoot!;
        const checkbox = (category: string) =>
            [...root.querySelectorAll<HTMLLabelElement>('.category-options label')]
                .find(label => label.textContent!.includes(category))!
                .querySelector<HTMLInputElement>('input')!;
        checkbox('Validation').click();
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(
            explorerRecipes.filter(recipe => recipe.category === 'Validation').length
        );
        expect(root.querySelector('h1')!.textContent).toContain('formatter');
        expect(root.querySelector('#modifier-jump')).toBeNull();
        checkbox('Tables').click();
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(
            explorerRecipes.filter(recipe => ['Validation', 'Tables'].includes(recipe.category))
                .length
        );
        const search = root.querySelector<HTMLInputElement>('#modifier-search')!;
        search.value = 'required';
        search.dispatchEvent(new Event('input'));
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(1);
        root.querySelector<HTMLButtonElement>('.clear-filters')!.click();
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(explorerRecipes.length);
        expect(root.querySelectorAll('.category-options input:checked')).toHaveLength(0);
        expect(root.querySelector('.match-count')).toBeNull();
        expect(search.value).toBe('');
    });

    it('shows all categories again when the last selected category is unchecked', async () => {
        const page = await openPage();
        const root = page.shadowRoot!;
        const input = root.querySelector<HTMLInputElement>('.category-options input')!;
        input.click();
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a').length).toBeLessThan(
            explorerRecipes.length
        );
        input.click();
        await settle(page);
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(explorerRecipes.length);
    });
});

describe('Bizallele site pages', () => {
    it('opens Home by default and separates site pages from the modifier reference', async () => {
        const page = await openPage('');
        const root = page.shadowRoot!;
        expect(root.querySelector('h1')!.textContent).toBe(
            'Genetic code for business rules.'
        );
        expect(root.querySelector('.site-page')!.textContent).toContain('Recordset');
        expect(root.querySelector('.site-nav a[href="#quickstart"]')?.textContent).toContain(
            'Your first form'
        );
        expect(root.querySelectorAll('.modifier-list a')).toHaveLength(explorerRecipes.length);
        expect(root.querySelector('a[href="../cookbook/"]')).toBeNull();
        expect(root.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    });

    it('navigates between documentation and modifiers, and responds to history changes', async () => {
        const page = await openPage('');
        const root = page.shadowRoot!;
        root.querySelector<HTMLAnchorElement>('.site-nav a[href="#how-it-works"]')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe('How it Works');
        expect(window.location.hash).toBe('#how-it-works');
        root.querySelector<HTMLAnchorElement>('.site-nav a[href="#contributing"]')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe('Contributing');
        root.querySelector<HTMLAnchorElement>('.modifier-list a[href="#formatter"]')!.click();
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe('.formatter(fn)');
        expect(root.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
        window.location.hash = 'home';
        window.dispatchEvent(new Event('hashchange'));
        await settle(page);
        expect(root.querySelector('h1')!.textContent).toBe(
            'Genetic code for business rules.'
        );
        expect(document.title).toBe('Home — Bizallele');
    });
});

it('parses formatted money input in the surviving documentation example', async () => {
    const page = await openPage('#parser');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const field = catalog.shadowRoot!.querySelector('fdl-field') as any;
    await field.updateComplete;
    const input = field.shadowRoot.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('$1,000.00');
    input.value = '$1,500.00';
    input.dispatchEvent(new Event('input'));
    await catalog.updateComplete;
    expect(await stateText(catalog)).toContain('1500');
});

it('defines valid, reciprocal related links for every modifier', () => {
    const names = new Set(explorerRecipes.map(recipe => recipe.name));
    for (const recipe of explorerRecipes) {
        const related = relatedModifierNames(recipe.name);
        expect(related.length).toBeGreaterThan(0);
        expect(related).not.toContain(recipe.name);
        expect(related).toEqual([...new Set(related)].sort((a, b) => a.localeCompare(b, 'en')));
        for (const name of related) {
            expect(names.has(name)).toBe(true);
            expect(relatedModifierNames(name)).toContain(recipe.name);
        }
    }
});
it.each(explorerRecipes.map(recipe => recipe.name))('lists related modifiers on %s', async name => {
    const page = await openPage(`#${name}`);
    if (modifierPage(name).names.length > 1) {
        expect(page.shadowRoot!.querySelectorAll('.page-sections a')).toHaveLength(
            modifierPage(name).names.length
        );
        return;
    }
    const section = page.shadowRoot!.getElementById(name)!.querySelector('.related-modifiers')!;
    const links = Array.from(section.querySelectorAll('a'));
    expect(section.querySelector('h3')!.textContent).toBe('Related modifiers');
    expect(links.map(link => link.getAttribute('href'))).toEqual(
        relatedModifierNames(name).map(related => `#${related}`)
    );
    expect(section.querySelectorAll('li span').length).toBe(links.length);
});
it('links cell styling alternatives in both directions', async () => {
    expect(relatedModifierNames('cellClass')).toContain('rowClass');
    const page = await openPage('#cellClass');
    const link = page.shadowRoot!.querySelector<HTMLAnchorElement>(
        '.related-modifiers a[href="#rowClass"]'
    )!;
    expect(link.textContent).toBe('.rowClass()');
    link.click();
    await settle(page);
    expect(page.shadowRoot!.activeElement).toBe(page.shadowRoot!.querySelector('h1'));
    expect(page.shadowRoot!.querySelector('h1')!.textContent).toBe('.rowClass(classes)');
    expect(
        page.shadowRoot!.querySelector('.related-modifiers a[href="#cellClass"]')
    ).not.toBeNull();
});

it('updates emptiness and validation for required and optional references as they are edited', async () => {
    const page = await openPage('#emptyWhen');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const demo = catalog.shadowRoot!.querySelector('.focused-demo')!;
    expect(demo.querySelector('button')).toBeNull();
    expect(demo.querySelectorAll('fdl-field')).toHaveLength(2);
    for (const name of ['emptyCode', 'optionalEmptyCode']) {
        const field = demo.querySelector(`fdl-field[field="${name}"]`) as any;
        await field.updateComplete;
        const input = field.shadowRoot.querySelector('input') as HTMLInputElement;
        expect(input.required).toBe(name === 'emptyCode');
        for (const [value, empty] of [
            ['N/A', true],
            ['REF-42', false],
            ['   ', true],
            ['', true],
        ] as const) {
            input.value = value;
            input.dispatchEvent(new Event('input'));
            await catalog.updateComplete;
            const inspector = catalog.shadowRoot!.querySelector('fdl-record-inspector')!;
            await inspector.updateComplete;
            const status = inspector.shadowRoot!.querySelector(`[data-field="${name}"]`)!;
            expect(inspector.record!.field(name).empty).toBe(empty);
            expect(!!status.querySelector('[aria-label="Invalid"]')).toBe(name === 'emptyCode' && empty);
        }
    }
});

it.each(modifierPageGroups)(
    'groups $title on one page with stable sections and working member links',
    async group => {
        const page = await openPage(`#${group.names[0]}`);
        const root = page.shadowRoot!;
        expect(root.querySelector('h1')!.textContent).toBe(group.title);
        expect([...root.querySelectorAll('.modifier-section')].map(section => section.id)).toEqual(
            group.names
        );
        const original = root.querySelectorAll('fdl-modifier-catalog');
        const target = group.names[group.names.length - 1];
        root.querySelector<HTMLAnchorElement>(`.page-sections a[href="#${target}"]`)!.click();
        await settle(page);
        expect(window.location.hash).toBe(`#${target}`);
        expect(root.activeElement).toBe(
            root.getElementById(target)!.querySelector('.modifier-signature')
        );
        expect([...root.querySelectorAll('fdl-modifier-catalog')]).toEqual([...original]);
        expect(root.querySelector('.page-count')!.textContent).toContain(
            `of ${explorerRecipes.length - modifierPageGroups.reduce((total, group) => total + group.names.length - 1, 0)}`
        );
    }
);

it('resets the consolidated read-only example', async () => {
    const page = await openPage('#readOnly');
    const root = page.shadowRoot!;
    const conditional = root.querySelector(
        'fdl-modifier-catalog[modifier="readOnly"]'
    ) as FdlModifierCatalog;
    await conditional.updateComplete;
    const field = conditional.shadowRoot!.querySelector('fdl-field[field="phase"]') as any;
    await field.updateComplete;
    const select = field.shadowRoot.querySelector('select') as HTMLSelectElement;
    select.value = 'submitted';
    select.dispatchEvent(new Event('input'));
    await conditional.updateComplete;
    root.getElementById('readOnly')!.querySelector<HTMLButtonElement>('.reset')!.click();
    await settle(page);
    const reset = root.querySelector(
        'fdl-modifier-catalog[modifier="readOnly"]'
    ) as FdlModifierCatalog;
    await reset.updateComplete;
    const resetField = reset.shadowRoot!.querySelector('fdl-field[field="phase"]') as any;
    await resetField.updateComplete;
    expect(resetField.record.getField('phase')).toBe('draft');
    expect(root.querySelector('fdl-modifier-catalog[modifier="readOnlyWhen"]')).toBeNull();
});

it('changes textarea rows while retaining the comment and updating the example source', async () => {
    const page = await openPage('#rowCount');
    const root = page.shadowRoot!;
    let catalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const findField = async (name: string) => {
        const field = catalog.shadowRoot!.querySelector(`fdl-field[field="${name}"]`) as any;
        await field.updateComplete;
        return field;
    };
    let comments = await findField('comments');
    const textarea = comments.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(4);
    textarea.value = 'Keep this comment.\nAnd its second line.';
    textarea.dispatchEvent(new Event('input'));
    const choice = await findField('textareaRows');
    const select = choice.shadowRoot.querySelector('select') as HTMLSelectElement;
    expect([...select.options].map(option => option.value)).toEqual(['1', '4', '10']);
    for (const rows of [1, 4, 10]) {
        select.value = String(rows);
        select.dispatchEvent(new Event('change'));
        await catalog.updateComplete;
        await settle(page);
        comments = await findField('comments');
        expect(comments.shadowRoot.querySelector('textarea').rows).toBe(rows);
        expect(comments.shadowRoot.querySelector('textarea').value).toBe(textarea.value);
        expect(exampleSource('rowCount').definition).toContain('.rowCount(rows)');
    }
    root.querySelector<HTMLButtonElement>('.reset')!.click();
    await settle(page);
    catalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    comments = await findField('comments');
    expect(comments.shadowRoot.querySelector('textarea').rows).toBe(4);
});

it('shows conditional invoice templates without a balance editor', async () => {
    const page = await openPage('#template');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    await table.recordset.requestImmediateUpdate();
    await table.updateComplete;
    expect(catalog.shadowRoot!.querySelector('fdl-field')).toBeNull();
    expect(table.shadowRoot.querySelectorAll('.paid-balance')).toHaveLength(1);
    expect(table.shadowRoot.querySelectorAll('.due-balance')).toHaveLength(2);
    expect(table.shadowRoot.textContent).toContain('$1,250.00');
    expect(table.shadowRoot.textContent).toContain('$85.50');
});

it('previews every declared input type and keeps the source and record panel in sync', async () => {
    const page = await openPage('#type');
    const root = page.shadowRoot!;
    const catalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const selector = catalog.shadowRoot!.querySelector('fdl-field[field="inputType"]') as any;
    await selector.updateComplete;
    const select = selector.shadowRoot.querySelector('select') as HTMLSelectElement;
    expect([...select.options].map(option => option.value)).toEqual(inputTypes);
    for (const inputType of inputTypes) {
        select.value = inputType;
        select.dispatchEvent(new Event('change'));
        await catalog.updateComplete;
        await settle(page);
        const preview = catalog.shadowRoot!.querySelector('fdl-field[field="inputValue"]') as any;
        await preview.updateComplete;
        const input = preview.shadowRoot.querySelector('input') as HTMLInputElement;
        expect(input.type).toBe(inputType);
        expect(preview.record.field('inputValue').type).toBe(inputType);
        expect(exampleSource('type').definition).toContain('inputTypeField(inputType)');
        expect(await stateText(catalog)).toContain('Example: ' + inputType);
        if (inputType === 'checkbox' || inputType === 'radio') {
            input.click();
            await catalog.updateComplete;
            expect(preview.record.getField('inputValue')).toBe(true);
        }
    }
    root.querySelector<HTMLButtonElement>('.reset')!.click();
    await settle(page);
    const resetCatalog = root.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await resetCatalog.updateComplete;
    const preview = resetCatalog.shadowRoot!.querySelector('fdl-field[field="inputValue"]') as any;
    await preview.updateComplete;
    expect(preview.shadowRoot.querySelector('input').type).toBe('text');
});

it('lists every category and modifier once with purposes and linked relationships', async () => {
    const page = await openPage('#categories');
    const root = page.shadowRoot!;
    expect(document.title).toBe('Modifier categories — Bizallele');
    expect(
        root.querySelector('.site-nav a[href="#categories"]')!.getAttribute('aria-current')
    ).toBe('page');
    const sections = [...root.querySelectorAll('.category-overview-section')];
    expect(sections).toHaveLength(new Set(explorerRecipes.map(recipe => recipe.category)).size);
    const listed = [...root.querySelectorAll('.category-modifiers [data-modifier]')];
    expect(listed.map(item => item.getAttribute('data-modifier')).sort()).toEqual(
        explorerRecipes.map(recipe => recipe.name).sort()
    );
    for (const section of sections) {
        const category = section.querySelector('h2')!.textContent!.trim();
        expect(section.textContent).toContain(categoryDescriptions[category]);
        expect(section.querySelector('.category-relationships a')).not.toBeNull();
        const names = [...section.querySelectorAll('[data-modifier]')].map(item =>
            item.getAttribute('data-modifier')
        );
        expect(names).toEqual(
            explorerRecipes
                .filter(recipe => recipe.category === category)
                .map(recipe => recipe.name)
        );
    }
    const validNames = new Set(explorerRecipes.map(recipe => recipe.name));
    for (const link of root.querySelectorAll<HTMLAnchorElement>('.category-overview-section a')) {
        expect(validNames.has(link.getAttribute('href')!.slice(1))).toBe(true);
    }
    window.location.hash = 'categories?category=category-validation';
    window.dispatchEvent(new Event('hashchange'));
    await settle(page);
    expect(root.activeElement?.id).toBe('category-validation');
    const modifier = root
        .querySelector<HTMLAnchorElement>('#category-validation')!
        .closest('section')!
        .querySelector<HTMLAnchorElement>('a[href="#emptyWhen"]')!;
    modifier.click();
    // Native anchor navigation is handled by hashchange in the browser.
    window.location.hash = 'emptyWhen';
    window.dispatchEvent(new Event('hashchange'));
    await settle(page);
    expect(root.getElementById('emptyWhen')).not.toBeNull();
});

it('marks rowCount as deprecated and points textarea sizing to fdl-field', async () => {
    const page = await openPage('#rowCount');
    const note = page.shadowRoot!.querySelector('.deprecation-note')!;
    expect(note.textContent).toContain('Deprecated.');
    expect(note.textContent).toContain('presentation concern');
    expect(note.textContent).toContain('fdl-field');
    expect(note.textContent).toContain('remains available for compatibility');
});

it('opens the consolidated cellClass page from its retired conditional URL', async () => {
    const page = await openPage('#conditionalCellClass');
    expect(page.shadowRoot!.querySelector('h1')!.textContent).toContain('.cellClass(');
    expect(
        page.shadowRoot!.querySelector('.modifier-list a[href="#conditionalCellClass"]')
    ).toBeNull();
});

it('opens the singular rowClass page from its old plural URL', async () => {
    const page = await openPage('#rowClasses');
    expect(page.shadowRoot!.querySelector('h1')!.textContent).toBe('.rowClass(classes)');
    expect(page.shadowRoot!.querySelector('.modifier-list a[href="#rowClasses"]')).toBeNull();
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as any;
    await catalog.updateComplete;
    const table = catalog.shadowRoot.querySelector('fdl-table') as any;
    await table.recordset.requestImmediateUpdate();
    await table.updateComplete;
    expect(table.shadowRoot.querySelectorAll('tr.invoice-row')).toHaveLength(2);
    expect(table.shadowRoot.querySelectorAll('tr.disputed-row.needs-review')).toHaveLength(1);
});

it.each([
    ['requiredWhen', 'required'],
    ['disabledWhen', 'disabled'],
])('opens retired %s links on %s', async (oldName, name) => {
    const page = await openPage(`#${oldName}`);
    expect(page.shadowRoot!.querySelector('h1')!.textContent).toBe(`.${name}(predicate?)`);
    expect(page.shadowRoot!.querySelector(`.modifier-list a[href="#${oldName}"]`)).toBeNull();
});

it.each(['minColumnWidth', 'maxColumnWidth', 'targetColumnWidth', 'sortable'])(
    '%s documents a callback with no arguments',
    async name => {
        const page = await openPage(`#${name}`);
        const section = page.shadowRoot!.getElementById(name)!;
        const signature = section.querySelector('.modifier-signature')!.textContent!;
        expect(signature).toContain('() =>');
        expect(signature).not.toContain('context:');
        expect(signature).not.toContain('record:');
        expect(signature).not.toContain('value:');
        expect(
            (section.querySelector('.setting-contract') ??
                page.shadowRoot!.querySelector('.setting-contract'))!.textContent
        ).toContain('callback with no arguments');
    }
);

it('documents default factories with only their owning record', async () => {
    const page = await openPage('#defaultValue');
    const section = page.shadowRoot!.getElementById('defaultValue')!;
    expect(section.querySelector('.modifier-signature')!.textContent).toContain(
        'factory: (record: Record<any>) => T | null'
    );
    expect(
        (section.querySelector('.setting-contract') ??
            page.shadowRoot!.querySelector('.setting-contract'))!.textContent
    ).toContain('(record)');
});

it.each([
    'required',
    'formatter',
    'visible',
    'defaultValue',
    'disabled',
    'emptyWhen',
    'label',
    'inputMask',
    'maxLength',
    'minLength',
    'multipleValues',
    'options',
    'parser',
    'placeholder',
    'record',
    'readOnly',
    'rowCount',
    'type',
    'validator',
])('inspects the live record and relevant fields on the %s page', async name => {
    const page = await openPage(`#${name}`);
    const catalog = page.shadowRoot!.querySelector<FdlModifierCatalog>(
        'fdl-modifier-catalog, fdl-text-length'
    );
    if (catalog) await catalog.updateComplete;
    const root = catalog?.shadowRoot ?? page.shadowRoot!;
    const inspector = root.querySelector('fdl-record-inspector')!;
    expect(inspector).toBeTruthy();
    expect(inspector.closest('details')).toBeNull();
    await inspector.updateComplete;
    const fields = [...root.querySelectorAll<FdlField>('fdl-field')];
    await Promise.all(fields.map(field => field.updateComplete));
    expect(fields.some(field => inspector.record === field.record)).toBe(true);
    const names = inspector.fields ?? Object.keys(inspector.record!.fieldTypes);
    expect(
        [
            ...inspector.shadowRoot!.querySelector('table[aria-label="Field state"] tbody')!
                .children,
        ].map(row => row.getAttribute('data-field'))
    ).toEqual(names);
    expect(names).toEqual(
        expect.arrayContaining(
            fields.filter(field => field.record === inspector.record).map(field => field.field)
        )
    );
    expect(root.querySelector('.model, .focused-state')).toBeNull();
});

it('adds a record inspector to the structured record page', async () => {
    const page = await openPage('#record');
    const catalog = page.shadowRoot!.querySelector<FdlModifierCatalog>('fdl-modifier-catalog')!;
    await catalog.updateComplete;
    const inspector = catalog.shadowRoot!.querySelector('fdl-record-inspector')!;
    await inspector.updateComplete;

    expect(inspector).toBeTruthy();
    expect(inspector.fields).toEqual(['address']);
    expect(inspector.shadowRoot!.querySelector('[data-field="address"]')).toBeTruthy();
    expect(inspector.shadowRoot!.textContent).toContain('Shipping address');
    expect(inspector.shadowRoot!.textContent).not.toContain('1 Main Street');
    inspector.shadowRoot!.querySelector<HTMLButtonElement>('.nested-inspect')!.click();
    await inspector.updateComplete;
    expect(inspector.shadowRoot!.textContent).toContain('1 Main Street');
});

it.each([
    'cellClass',
    'columnClass',
    'compareFunction',
    'filter',
    'rowClass',
    'sortable',
    'template',
    'textAlign',
    'maxColumnWidth',
    'minColumnWidth',
    'targetColumnWidth',
])('inspects the live recordset on the %s modifier page', async name => {
    const page = await openPage(`#${name}`);
    if (modifierPage(name).title === 'Column widths') {
        const demo = page.shadowRoot!.querySelector('fdl-column-widths') as any;
        await demo.updateComplete;
        expect(demo.shadowRoot.querySelectorAll('fdl-table')).toHaveLength(1);
        expect(
            demo.shadowRoot.querySelector('fdl-table').hasAttribute('show-width-diagnostics')
        ).toBe(true);
        return;
    }
    const catalog = page
        .shadowRoot!.getElementById(name)!
        .querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const inspector = catalog.shadowRoot!.querySelector('fdl-recordset-inspector')!;
    expect(inspector).toBeTruthy();
    expect(inspector.closest('details')).toBeNull();
    await inspector.updateComplete;
    const table = catalog.shadowRoot!.querySelector('fdl-table') as any;
    await table.updateComplete;
    expect(inspector.recordset === table.recordset).toBe(true);
    expect(catalog.shadowRoot!.querySelector('.focused-state')).toBeNull();
});

it('initializes the shared text-length selector to the enforced rule', async () => {
    const demo = document.createElement('fdl-text-length') as any;
    document.body.append(demo);
    await demo.updateComplete;
    const setting = demo.shadowRoot.querySelector('fdl-field[field="minimum"]') as FdlField;
    await setting.updateComplete;
    expect(setting.shadowRoot!.querySelector('select')!.value).toBe('4');
    const control = demo.shadowRoot.querySelector('fdl-field[field="code"]') as FdlField;
    expect(control.record!.field('code').minLength).toBe(4);
});

it('uses the inputMask inspector collapse control while keeping live values current', async () => {
    const page = await openPage('#inputMask');
    const catalog = page.shadowRoot!.querySelector('fdl-modifier-catalog') as FdlModifierCatalog;
    await catalog.updateComplete;
    const inspector = catalog.shadowRoot!.querySelector('fdl-record-inspector')!;
    await inspector.updateComplete;
    const toggle = inspector.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
    toggle.click();
    await inspector.updateComplete;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const field = catalog.shadowRoot!.querySelector<FdlField>('fdl-field')!;
    await field.updateComplete;
    const input = field.shadowRoot!.querySelector('input')!;
    input.value = '12abc.34';
    input.dispatchEvent(new Event('input'));
    await catalog.updateComplete;
    toggle.click();
    await inspector.updateComplete;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(inspector.shadowRoot!.querySelector('[data-field="input"]')!.textContent).toContain(
        '12.34'
    );
    expect(inspector.fields).toEqual(['input']);
});
