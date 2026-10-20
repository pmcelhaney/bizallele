import { buildFieldRecord, defaultFieldSpec } from '../examples/fdl-input/field-builder-model';
import 'bizallele/lit/fdl-field';
it('uses independent rules and exports the same current model and Lit bindings', () => {
    const spec = {
        ...defaultFieldSpec,
        name: 'reference',
        initialValue: 'bad',
        validation: 'digits' as const,
    };
    const preview = buildFieldRecord(spec);
    expect(preview.isValid()).toBe(false);
    preview.setField('condition', 'disabled');
    expect(preview.getField('reference')).toBe('bad');
    expect(preview.isValid()).toBe(false);
    preview.setField('reference', '123');
    expect(preview.isValid()).toBe(true);
});

import '../examples/fdl-input/fdl-field-builder';
it('keeps trial data across rule changes and renaming, with explicit starting-value and reset replacement', async () => {
    const demo = document.createElement('fdl-field-builder') as any;
    document.body.append(demo);
    await demo.updateComplete;
    demo.record.setField('notes', 'AB');
    demo.record.setField('condition', 'disabled');
    demo.configuration.setField('validation', 'minimum');
    await demo.updateComplete;
    expect(demo.record.getField('notes')).toBe('AB');
    expect(demo.record.getField('condition')).toBe('disabled');
    expect(demo.record.isValid()).toBe(false);
    demo.configuration.setField('name', 'reference');
    await demo.updateComplete;
    expect(demo.record.getField('reference')).toBe('AB');
    demo.configuration.setField('initialValue', 'XYZ');
    await demo.updateComplete;
    expect(demo.record.getField('reference')).toBe('XYZ');
    expect(demo.record.getField('condition')).toBe('disabled');
    demo.shadowRoot.querySelector('button').click();
    await demo.updateComplete;
    expect(demo.record.getField('notes')).toBe('');
    expect(demo.record.getField('condition')).toBe('enabled');
    demo.remove();
});
