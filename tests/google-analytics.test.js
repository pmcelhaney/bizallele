/** @jest-environment node */
const { execFileSync } = require('child_process');
const { runInNewContext } = require('vm');

function renderAnalytics(id = '', page = 'index.html') {
    return JSON.parse(
        execFileSync(
            process.execPath,
            [
                '--input-type=module',
                '-e',
                `import config from './examples/fdl-input/vite.config.mjs';
                import { resolve } from 'node:path';
                const plugin = config.plugins.find(plugin => plugin.name === 'google-analytics');
                plugin.configResolved({ mode: 'production', envDir: process.cwd() });
                console.log(JSON.stringify(plugin.transformIndexHtml('<head></head>', {
                    filename: resolve('examples/fdl-input', ${JSON.stringify(page)}),
                })));`,
            ],
            {
                cwd: process.cwd(),
                env: { ...process.env, PUBLIC_GOOGLE_ANALYTICS_ID: id },
                encoding: 'utf8',
            }
        )
    );
}

it('omits tracking when no Google Analytics ID is configured', () => {
    expect(renderAnalytics()).toBe('<head></head>');
});

it('loads the configured tag asynchronously and queues Google initialization', () => {
    const tags = renderAnalytics('G-TEST123456');
    expect(tags[0].attrs).toEqual({
        async: true,
        src: 'https://www.googletagmanager.com/gtag/js?id=G-TEST123456',
    });
    const window = {};
    window.window = window;
    runInNewContext(tags[1].children, window);
    expect(Array.from(window.dataLayer[0])[0]).toBe('js');
    expect(Array.from(window.dataLayer[1])).toEqual(['config', 'G-TEST123456']);
    expect(renderAnalytics('G-TEST123456', 'example-preview.html')).toBe('<head></head>');
});
