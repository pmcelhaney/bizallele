// Compile repository Markdown into the site's reference pages at build time.
const fs = require('node:fs');
const path = require('node:path');
const MarkdownIt = require('markdown-it');
const root = path.resolve(__dirname, '..');

function markdownFiles(directory) {
    return fs
        .readdirSync(path.join(root, directory), { withFileTypes: true })
        .flatMap(function (entry) {
            const file = path.posix.join(directory, entry.name);
            return entry.isDirectory() ? markdownFiles(file) : file.endsWith('.md') ? [file] : [];
        })
        .sort();
}

function loadDocumentation() {
    const files = [
        ...markdownFiles('docs'),
        ...fs.readdirSync(root).filter(function (file) {
            return file.endsWith('.md');
        }),
        'examples/fdl-input/README.md',
    ];
    const routes = new Map(
        files.map(function (file) {
            return [file, `reference/${file.slice(0, -3)}`];
        })
    );
    return files
        .map(function (file) {
            const headings = [];
            const used = new Map();
            const md = new MarkdownIt({ html: false, linkify: false });
            md.renderer.rules.heading_open = function (tokens, index, options, env, renderer) {
                const text = tokens[index + 1].children
                    .map(function (token) {
                        return token.content;
                    })
                    .join('');
                const slug = text
                    .toLowerCase()
                    .replace(/[^\p{L}\p{N}_\-\s]/gu, '')
                    .replace(/\s/g, '-');
                const count = used.get(slug) || 0;
                used.set(slug, count + 1);
                const id = count ? `${slug}-${count}` : slug;
                tokens[index].attrSet('id', id);
                tokens[index].attrSet('tabindex', '-1');
                headings.push({ id, title: text, level: Number(tokens[index].tag.slice(1)) });
                return renderer.renderToken(tokens, index, options);
            };
            const renderLink =
                md.renderer.rules.link_open ||
                function (tokens, index, options, env, renderer) {
                    return renderer.renderToken(tokens, index, options);
                };
            md.renderer.rules.link_open = function (tokens, index, options, env, renderer) {
                const token = tokens[index];
                const href = token.attrGet('href');
                if (
                    href.startsWith('http://localhost:5173/#') ||
                    href.startsWith('https://patrickmcelhaney.org/bizallele/#') ||
                    href.startsWith('https://patrickmcelhaney.org/FDL/#')
                ) {
                    token.attrSet('href', href.slice(href.indexOf('#')));
                } else if (!/^(?:[a-z]+:|\/\/)/i.test(href)) {
                    const [target, section] = href.split('#');
                    const resolved = target
                        ? path.posix.normalize(path.posix.join(path.posix.dirname(file), target))
                        : file;
                    const route = routes.get(resolved);
                    if (route)
                        token.attrSet(
                            'href',
                            `#${route}${section ? `?section=${encodeURIComponent(section)}` : ''}`
                        );
                    else if (resolved === 'examples/fdl-input/')
                        token.attrSet('href', '#quickstart');
                    else if (resolved === 'LICENSE') token.attrSet('href', '#reference/LICENSE');
                    else throw new Error(`Unresolved documentation link in ${file}: ${href}`);
                }
                return renderLink(tokens, index, options, env, renderer);
            };
            const renderImage = md.renderer.rules.image;
            md.renderer.rules.image = function (tokens, index, options, env, renderer) {
                const token = tokens[index];
                const source = path.posix.normalize(
                    path.posix.join(path.posix.dirname(file), token.attrGet('src'))
                );
                if (source === 'examples/fdl-input/public/bizallele-logo.jpg')
                    token.attrSet('src', './bizallele-logo.jpg');
                return renderImage(tokens, index, options, env, renderer);
            };
            const source = fs.readFileSync(path.join(root, file), 'utf8');
            const html = md.render(source);
            return {
                id: routes.get(file),
                file,
                title:
                    headings.find(function (heading) {
                        return heading.level === 1;
                    })?.title || file,
                html,
                headings,
            };
        })
        .concat([
            {
                id: 'reference/LICENSE',
                file: 'LICENSE',
                title: 'Apache License 2.0',
                html: `<h1 tabindex="-1">Apache License 2.0</h1><pre>${mdEscape(fs.readFileSync(path.join(root, 'LICENSE'), 'utf8'))}</pre>`,
                headings: [],
            },
        ]);
}
function mdEscape(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
module.exports = { loadDocumentation };
