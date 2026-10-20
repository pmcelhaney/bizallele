import { FdlExample } from '../examples/fdl-input/fdl-example';

afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
});

it('keeps the live example visible while switching file tabs in fullscreen, then restores the selected tab', async () => {
    // A nested shadow root matches how documentation pages host examples.
    const host = document.createElement('div');
    const container = host.attachShadow({ mode: 'open' });
    const frame = new FdlExample();
    frame.filenames = ['model.ts', 'view.ts'];
    frame.sources = { 'model.ts': 'const count = 1;', 'view.ts': 'render(count);' };
    const input = document.createElement('input');
    input.value = 'preserved';
    frame.append(input);
    container.append(frame);
    document.body.append(host);
    let fullscreenElement: Element | null = null;
    Object.defineProperty(container, 'fullscreenElement', { get: () => fullscreenElement });
    frame.requestFullscreen = jest.fn(async () => {
        fullscreenElement = frame;
        frame.dispatchEvent(new Event('fullscreenchange'));
    });
    Object.defineProperty(document, 'exitFullscreen', {
        configurable: true,
        value: jest.fn(async () => {
            fullscreenElement = null;
            frame.dispatchEvent(new Event('fullscreenchange'));
        }),
    });
    await frame.updateComplete;
    const root = frame.shadowRoot!;
    root.querySelector<HTMLButtonElement>('#example-tab-2')!.click();
    await frame.updateComplete;
    const button = root.querySelector<HTMLButtonElement>('.fullscreen-button')!;
    button.click();
    await frame.updateComplete;
    expect(frame.requestFullscreen).toHaveBeenCalledTimes(1);
    expect(button.textContent).toContain('Exit full screen');
    expect(root.querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(root.querySelector('#example-tab-0')).toBeNull();
    expect(root.querySelector('#example-panel-0')!.hasAttribute('hidden')).toBe(false);
    expect(root.querySelector('#example-panel-2')!.hasAttribute('hidden')).toBe(false);
    root.querySelector<HTMLButtonElement>('#example-tab-2')!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    );
    await frame.updateComplete;
    expect(root.querySelector('#example-tab-1')!.getAttribute('aria-selected')).toBe('true');
    expect(root.activeElement).toBe(root.querySelector('#example-tab-1'));
    expect(root.querySelector('#example-panel-1')!.hasAttribute('hidden')).toBe(false);
    expect(root.querySelector('#example-panel-2')!.hasAttribute('hidden')).toBe(true);
    expect(root.querySelector('#example-panel-0')!.hasAttribute('hidden')).toBe(false);
    button.click();
    await frame.updateComplete;
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(root.querySelector('#example-panel-2')!.hasAttribute('hidden')).toBe(false);
    expect(root.querySelector('#example-panel-0')!.hasAttribute('hidden')).toBe(true);
    expect(frame.querySelector('input')).toBe(input);
    expect(input.value).toBe('preserved');
    // Escape/browser exit produces the same fullscreenchange notification.
    button.click();
    await frame.updateComplete;
    fullscreenElement = null;
    frame.dispatchEvent(new Event('fullscreenchange'));
    await frame.updateComplete;
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(root.querySelector('.tabs')!.hasAttribute('hidden')).toBe(false);
});

it('reports a rejected fullscreen request without changing views', async () => {
    const frame = new FdlExample();
    frame.requestFullscreen = jest.fn().mockRejectedValue(new Error('Denied'));
    document.body.append(frame);
    await frame.updateComplete;
    frame.shadowRoot!.querySelector<HTMLButtonElement>('.fullscreen-button')!.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    await frame.updateComplete;
    expect(frame.shadowRoot!.querySelector('[role="status"]')!.textContent).toContain(
        'Full screen is unavailable'
    );
    expect(frame.shadowRoot!.querySelector('.tabs')!.hasAttribute('hidden')).toBe(false);
});

async function editableExample() {
    const frame = new FdlExample();
    frame.filenames = ['model.ts', 'view.ts'];
    frame.sources = { 'model.ts': 'export const count = 1;', 'view.ts': 'render(count);' };
    const component = document.createElement('test-example');
    // Simulate a component that has already rendered into its light DOM.
    if (!customElements.get('test-example'))
        customElements.define('test-example', class extends HTMLElement {});
    component.innerHTML = '<p>Rendered output</p>';
    frame.append(component);
    document.body.append(frame);
    await frame.updateComplete;
    frame.shadowRoot!.querySelector<HTMLButtonElement>('#example-tab-1')!.click();
    await frame.updateComplete;
    frame.shadowRoot!.querySelector<HTMLButtonElement>('.edit-toolbar button')!.click();
    await frame.updateComplete;
    return frame;
}

function previewMessage(iframe: HTMLIFrameElement, type: string, extra: object = {}) {
    window.dispatchEvent(
        new MessageEvent('message', {
            source: iframe.contentWindow,
            origin: location.origin,
            data: { type, ...extra },
        })
    );
}

it('opens edit mode with focus and the caret at the start of the file', async () => {
    const frame = await editableExample();
    const root = frame.shadowRoot!;
    const editor = root.querySelector('textarea')!;
    expect(editor.value).toBe(frame.sources['model.ts']);
    expect(root.activeElement).toBe(editor);
    expect(editor.selectionStart).toBe(0);
    expect(editor.selectionEnd).toBe(0);

    root.querySelectorAll<HTMLButtonElement>('.edit-toolbar button')[1].click();
    await frame.updateComplete;
    root.querySelector<HTMLButtonElement>('#example-tab-2')!.click();
    await frame.updateComplete;
    root.querySelector<HTMLButtonElement>('#example-panel-2 .edit-toolbar button')!.click();
    await frame.updateComplete;
    const nextEditor = root.querySelector('textarea')!;
    expect(nextEditor.value).toBe(frame.sources['view.ts']);
    expect(root.activeElement).toBe(nextEditor);
    expect(nextEditor.selectionStart).toBe(0);
    expect(nextEditor.selectionEnd).toBe(0);
});

it('cancels a draft without changing the displayed source or live example', async () => {
    const frame = await editableExample();
    const textarea = frame.shadowRoot!.querySelector('textarea')!;
    textarea.value = 'export const count = 99;';
    textarea.dispatchEvent(new Event('input'));
    frame.shadowRoot!.querySelectorAll<HTMLButtonElement>('.edit-toolbar button')[1].click();
    await frame.updateComplete;
    expect(frame.shadowRoot!.querySelector('textarea')).toBeNull();
    expect(frame.shadowRoot!.querySelector('code')!.textContent).toContain('count = 1');
    expect(frame.shadowRoot!.querySelector('iframe')).toBeNull();
});

it('commits saved source only after the preview succeeds and restores the original on request', async () => {
    const frame = await editableExample();
    const root = frame.shadowRoot!;
    const editor = root.querySelector('textarea')!;
    editor.value = 'export const count = 2;';
    editor.dispatchEvent(new Event('input'));
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
    await frame.updateComplete;
    const iframe = root.querySelector('iframe')!;
    // jsdom does not create a browsing context for iframes inside shadow roots.
    Object.defineProperty(iframe, 'contentWindow', { value: window });
    const send = jest.spyOn(window, 'postMessage');
    previewMessage(iframe, 'example-ready');
    expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
            files: { 'model.ts': editor.value, 'view.ts': 'render(count);' },
            markup: '<test-example></test-example>',
        }),
        location.origin
    );
    expect(root.querySelector('slot:not([name])')!.hasAttribute('hidden')).toBe(false);
    previewMessage(iframe, 'example-saved');
    await frame.updateComplete;
    expect(root.querySelector('slot:not([name])')!.hasAttribute('hidden')).toBe(true);
    expect(iframe.hidden).toBe(false);
    expect(frame.sources['model.ts']).toContain('count = 1');
    root.querySelector<HTMLButtonElement>('#example-tab-1')!.click();
    await frame.updateComplete;
    expect(root.querySelector('code')!.textContent).toContain('count = 2');
    root.querySelector<HTMLButtonElement>('.restore-button')!.click();
    await frame.updateComplete;
    expect(root.querySelector('iframe')).toBeNull();
    expect(root.querySelector('code')!.textContent).toContain('count = 1');
    expect(root.querySelector('slot:not([name])')!.hasAttribute('hidden')).toBe(false);
});

it('keeps the draft and original example when the preview fails and ignores unrelated messages', async () => {
    const frame = await editableExample();
    const root = frame.shadowRoot!;
    root.querySelector<HTMLButtonElement>('.edit-toolbar button')!.click();
    await frame.updateComplete;
    window.dispatchEvent(
        new MessageEvent('message', { origin: location.origin, data: { type: 'example-saved' } })
    );
    expect(root.querySelector('slot:not([name])')!.hasAttribute('hidden')).toBe(false);
    Object.defineProperty(root.querySelector('iframe')!, 'contentWindow', { value: window });
    previewMessage(root.querySelector('iframe')!, 'example-error', {
        message: 'model.ts: Unexpected token',
    });
    await frame.updateComplete;
    expect(root.querySelector('[role="alert"]')!.textContent).toContain('Unexpected token');
    expect(root.querySelector('textarea')).not.toBeNull();
    expect(root.querySelector('iframe')).toBeNull();
    expect(root.querySelector<HTMLButtonElement>('.edit-toolbar button')!.disabled).toBe(false);
});
