/// <reference types="node" />
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import ts from 'typescript';

function sourceFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        if (['dist', 'node_modules'].includes(entry.name)) return [];
        const file = resolve(directory, entry.name);
        return entry.isDirectory() ? sourceFiles(file) : /\.[jt]s$/.test(file) ? [file] : [];
    });
}

// Discover the actual raw imports used by source tabs rather than maintaining
// a second list that could omit a new example or silently point at a wrapper.
const displayedFiles = new Set<string>();
for (const file of sourceFiles(resolve('examples/fdl-input'))) {
    const parsed = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true
    );
    for (const node of parsed.statements) {
        if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
        const specifier = node.moduleSpecifier.text;
        if (/\.[jt]s\?raw$/.test(specifier)) {
            displayedFiles.add(resolve(dirname(file), specifier.replace(/\?raw$/, '')));
        }
    }
}

it.each([...displayedFiles])('keeps displayed source free of tutorial components: %s', file => {
    const source = readFileSync(file, 'utf8');
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    // Custom-cell examples teach the actual component contract, including lifecycle.
    // Keep the surrounding tutorial shell out of the displayed source.
    if (!file.endsWith('editable-recordset-cells.ts')) {
        const classes = parsed.statements.filter(ts.isClassDeclaration);
        expect(classes.map(node => node.name?.text)).toEqual([]);
        expect(source).not.toMatch(/customElements\.define|requestUpdate\(|connectedCallback\(/);
    }
    expect(source).not.toMatch(
        /<fdl-(?:example|record-inspector|recordset-inspector|prediction)\b/
    );
});

it.each([...displayedFiles].filter(file => /-view\.[jt]s$/.test(file)))(
    'lists field controls explicitly without validation-display flags: %s',
    file => {
        const source = readFileSync(file, 'utf8');
        expect(source).not.toMatch(/fields\.map|showErrors|showValidationErrors/);
        // The field builder renders the name entered by the user, rather than a fixed form.
        if (!file.endsWith('field-builder-view.ts')) {
            expect(source).not.toMatch(/<fdl-field\b[^>]*\bfield=\$\{/s);
        }
    }
);
