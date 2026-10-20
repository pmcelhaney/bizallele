import { defineConfig, loadEnv } from 'vite';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const documentation = createRequire(import.meta.url)(
    '../../scripts/documentation-pages.cjs'
);
const directory = fileURLToPath(new URL('.', import.meta.url));
let googleAnalyticsId;

export default defineConfig({
    resolve: {
        alias: [
            {
                find: /^bizallele\/lit$/,
                replacement: resolve(directory, '../../src/lit/index.ts'),
            },
            {
                find: /^bizallele$/,
                replacement: resolve(directory, '../../src/index.js'),
            },
            {
                find: 'bizallele',
                replacement: resolve(directory, '../../src'),
            },
        ],
    },
    plugins: [
        {
            name: 'google-analytics',
            configResolved(config) {
                googleAnalyticsId = loadEnv(
                    config.mode,
                    config.envDir,
                    'PUBLIC_'
                ).PUBLIC_GOOGLE_ANALYTICS_ID;
            },
            transformIndexHtml(html, context) {
                if (
                    !googleAnalyticsId ||
                    context.filename !== resolve(directory, 'index.html')
                )
                    return html;
                return [
                    {
                        tag: 'script',
                        attrs: {
                            async: true,
                            src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`,
                        },
                        injectTo: 'head',
                    },
                    {
                        tag: 'script',
                        children: `window.dataLayer = window.dataLayer || [];
function gtag() {
    dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', ${JSON.stringify(googleAnalyticsId).replace(/</g, '\\u003c')});`,
                        injectTo: 'head',
                    },
                ];
            },
        },
        {
            name: 'example-playground-sources',
            resolveId(id) {
                if (id === 'virtual:example-sources') return '\0' + id;
            },
            load(id) {
                if (id !== '\0virtual:example-sources') return;
                const sources = {};
                const context = this;
                function collect(folder, prefix = './') {
                    for (const entry of readdirSync(folder, {
                        withFileTypes: true,
                    })) {
                        if (
                            ['dist', 'node_modules', '.git'].includes(
                                entry.name
                            )
                        )
                            continue;
                        if (entry.isDirectory())
                            collect(
                                resolve(folder, entry.name),
                                prefix + entry.name + '/'
                            );
                        else if (
                            /\.(js|ts|css)$/.test(entry.name) &&
                            !entry.name.endsWith('.d.ts')
                        ) {
                            const path = resolve(folder, entry.name);
                            context.addWatchFile(path);
                            sources[prefix + entry.name] = readFileSync(
                                path,
                                'utf8'
                            );
                        }
                    }
                }
                collect(directory);
                return `export default ${JSON.stringify(sources)}`;
            },
        },
        {
            name: 'fdl-documentation',
            configureServer(server) {
                const root = resolve(directory, '../..');
                // Existing pages are watched by load(); new pages need their
                // directories watched so the virtual inventory can grow too.
                server.watcher.add([
                    resolve(root, 'docs'),
                    resolve(root, '*.md'),
                ]);
                function refreshDocumentation(file) {
                    const path = file.replaceAll('\\', '/');
                    if (
                        !path.endsWith('.md') ||
                        !(
                            path.startsWith(`${root}/docs/`) ||
                            path.slice(0, path.lastIndexOf('/')) === root
                        )
                    )
                        return;
                    const module = server.moduleGraph.getModuleById(
                        '\0virtual:fdl-documentation'
                    );
                    if (!module) return;
                    server.moduleGraph.invalidateModule(module);
                    server.ws.send({ type: 'full-reload' });
                }
                server.watcher.on('add', refreshDocumentation);
                server.watcher.on('unlink', refreshDocumentation);
                server.httpServer?.once('close', function cleanup() {
                    server.watcher.off('add', refreshDocumentation);
                    server.watcher.off('unlink', refreshDocumentation);
                });
            },
            resolveId(id) {
                if (id === 'virtual:fdl-documentation') return '\0' + id;
            },
            load(id) {
                if (id !== '\0virtual:fdl-documentation') return;
                const pages = documentation.loadDocumentation();
                for (const page of pages)
                    this.addWatchFile(resolve(directory, '../..', page.file));
                return `export default ${JSON.stringify(pages)}`;
            },
        },
    ],
    build: {
        rollupOptions: {
            input: {
                home: resolve(directory, 'index.html'),
                preview: resolve(directory, 'example-preview.html'),
            },
        },
    },
});
