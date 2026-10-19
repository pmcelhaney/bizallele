/** @jest-environment node */
const { execFileSync } = require('child_process');
const { mkdtempSync, rmSync, mkdirSync, writeFileSync, symlinkSync } = require('fs');
const { tmpdir } = require('os');
const { join, resolve } = require('path');
const esbuild = require('esbuild');

it('packs the declared runtime and type entry points, including documented adapter subpaths', async () => {
    const destination = mkdtempSync(join(tmpdir(), 'fdl-package-test-'));
    try {
        const [archive] = JSON.parse(
            execFileSync(
                'npm',
                [
                    'pack',
                    '--json',
                    '--pack-destination',
                    destination,
                    '--cache',
                    join(destination, 'cache'),
                ],
                {
                    cwd: process.cwd(),
                    encoding: 'utf8',
                    stdio: ['ignore', 'pipe', 'pipe'],
                }
            )
        );
        const files = new Set(archive.files.map(file => file.path));
        const manifest = require('../package.json');
        expect(files.has(manifest.main)).toBe(true);
        expect(files.has(manifest.types)).toBe(true);
        expect(files.has(manifest.exports['.'].default.replace(/^\.\//, ''))).toBe(true);
        expect(files.has(manifest.exports['.'].types.replace(/^\.\//, ''))).toBe(true);
        for (const module of [
            'prisma',
            'openapi',
            'zod',
            'form-element',
            'example-recordset',
            'lit/index',
            'lit/form-element',
            'lit/fdl-field',
            'lit/fdl-address',
            'lit/fdl-table',
        ]) {
            expect(files.has(`dist/${module}.js`)).toBe(true);
            expect(files.has(`dist/${module}.d.ts`)).toBe(true);
        }
        // Consume the packed files without source aliases or repository-relative imports.
        const packageRoot = join(destination, 'node_modules/@pmcelhaney/bizallele');
        mkdirSync(packageRoot, { recursive: true });
        execFileSync('tar', [
            '-xzf',
            join(destination, archive.filename),
            '--strip-components=1',
            '-C',
            packageRoot,
        ]);
        for (const dependency of [
            'lit',
            'lit-html',
            'lit-element',
            '@lit',
            '@loancrate',
            'yaml',
            'ajv',
            'ajv-formats',
            'zod',
        ]) {
            symlinkSync(
                resolve('node_modules', dependency),
                join(destination, 'node_modules', dependency)
            );
        }
        const consumer = join(destination, 'consumer.ts');
        writeFileSync(
            consumer,
            `
import { field, Record, Recordset } from '@pmcelhaney/bizallele';
import { fieldsFromPrisma } from '@pmcelhaney/bizallele/prisma';
import { fieldsFromOpenAPI } from '@pmcelhaney/bizallele/openapi';
import { fieldsFromZod } from '@pmcelhaney/bizallele/zod';
import * as z from 'zod/v4';
const zodFields = fieldsFromZod(z.object({ stock: z.number().int().nonnegative() }), { fields: ['stock'] });
const zodRecord = new Record(zodFields, { stock: 12 });
if (!zodRecord.isValid() || zodRecord.isValid('stock', -1)) throw new Error('Zod adapter validation failed');
import { FdlField, FdlAddress, FdlTable, FdlColumn, FormElement } from '@pmcelhaney/bizallele/lit';
import '@pmcelhaney/bizallele/lit/fdl-field';
import '@pmcelhaney/bizallele/lit/fdl-address';
import '@pmcelhaney/bizallele/lit/fdl-table';
import BaseField from '@pmcelhaney/bizallele/lit/form-element';
const prismaFields = fieldsFromPrisma('model Product {\\n stock Int\\n}', {
    model: 'Product', fields: ['stock'],
});
const prismaRecord = new Record(prismaFields, { stock: 12 });
const openapiFields = fieldsFromOpenAPI(JSON.stringify({
    openapi: '3.1.0', components: { schemas: { Product: {
        type: 'object', required: ['stock'], properties: { stock: { type: 'integer', minimum: 0 } },
    } } },
}), { schema: 'Product', fields: ['stock'] });
const openapiRecord = new Record(openapiFields, { stock: 12 });
const structuredFields = fieldsFromOpenAPI({ openapi: '3.1.0', components: { schemas: {
    Basket: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { quantity: { type: 'integer', minimum: 1 } }, required: ['quantity'] } } } },
} } }, { schema: 'Basket', fields: ['items'] });
const basket = new Record(structuredFields, { items: [{ quantity: 1 }] });
const fields = { name: field.label('Name') };
const control = new FdlField();
control.record = new Record(fields, { name: '' });
control.field = 'name';
const table = new FdlTable();
table.recordset = new Recordset(fields, [{ name: 'Ada' }]);
export { control, table, prismaRecord, openapiRecord, basket, FdlAddress, FdlColumn, FormElement, BaseField };
`
        );
        execFileSync(
            process.execPath,
            [
                resolve('node_modules/typescript/bin/tsc'),
                '--noEmit',
                '--strict',
                '--skipLibCheck',
                '--moduleResolution',
                'node',
                '--target',
                'es2020',
                consumer,
            ],
            { stdio: 'inherit' }
        );
        const coreBundle = esbuild.buildSync({
            stdin: {
                contents: "import { Record } from '@pmcelhaney/bizallele'; console.log(Record);",
                resolveDir: destination,
            },
            bundle: true,
            write: false,
            platform: 'browser',
            metafile: true,
        });
        expect(
            Object.keys(coreBundle.metafile.inputs).some(file =>
                file.includes('prisma-schema-parser')
            )
        ).toBe(false);
        expect(
            Object.keys(coreBundle.metafile.inputs).some(file => /(?:yaml|openapi)/.test(file))
        ).toBe(false);
        expect(
            Object.keys(coreBundle.metafile.inputs).some(file => /(?:^|\/)zod\//.test(file))
        ).toBe(false);
        const bundle = esbuild.buildSync({
            entryPoints: [consumer],
            bundle: true,
            write: false,
            platform: 'browser',
            format: 'iife',
            globalName: 'FdlConsumer',
            metafile: true,
        });
        expect(
            Object.keys(bundle.metafile.inputs).some(file => file.includes('examples/fdl-input'))
        ).toBe(false);
        expect(bundle.outputFiles[0].text).not.toContain('?raw');
        // Importing the packed bundle must actually register working custom elements.
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
        try {
            dom.window.eval(bundle.outputFiles[0].text);
            for (const tag of ['fdl-field', 'fdl-address', 'fdl-table', 'fdl-column']) {
                expect(dom.window.customElements.get(tag)).toBeDefined();
            }
            const { control, table, prismaRecord, openapiRecord, basket } = dom.window.FdlConsumer;
            expect(basket.isValid()).toBe(true);
            expect(basket.isValid('items', [{ quantity: 0 }])).toBe(false);
            expect(openapiRecord.isValid()).toBe(true);
            expect(openapiRecord.isValid('stock', -1)).toBe(false);
            expect(prismaRecord.isValid()).toBe(true);
            expect(prismaRecord.isValid('stock', 1.5)).toBe(false);
            dom.window.document.body.append(control, table);
            await Promise.all([control.updateComplete, table.updateComplete]);
            expect(control.shadowRoot.querySelector('input')).not.toBeNull();
            expect(table.shadowRoot.querySelector('table')).not.toBeNull();
            expect(control.record.getField('name')).toBe('');
        } finally {
            dom.window.close();
        }
    } finally {
        rmSync(destination, { recursive: true, force: true });
    }
}, 60000);
