import { LitElement } from 'lit';
import { Record, Recordset } from '@pmcelhaney/bizallele';

const initialFieldTypes = new WeakMap();

// Exported examples retain their identity when the documentation recreates a
// view. Restore their starting values and rules for a new example or explicit reset.
export function resetExampleRecord(record) {
    if (!initialFieldTypes.has(record)) {
        initialFieldTypes.set(record, { ...record.fieldTypes });
    }
    record.fieldTypes = { ...initialFieldTypes.get(record) };
    record.reset();
}

// Shared lifecycle for the small live examples. Rules and rendering stay in
// each example's model and view files.
export class ExampleController extends LitElement {
    initialized = false;
    refreshExample = () => {
        this.requestUpdate();
    };
    connectedCallback() {
        super.connectedCallback();
        if (!this.initialized) {
            for (const value of Object.values(this)) {
                if (value instanceof Record) resetExampleRecord(value);
            }
            this.initialized = true;
        }
        this.listenToModels('addEventListener');
    }
    disconnectedCallback() {
        this.listenToModels('removeEventListener');
        super.disconnectedCallback();
    }
    listenToModels(method) {
        for (const value of Object.values(this)) {
            if (value instanceof Record) {
                value[method](
                    'change',
                    value === this.probes
                        ? (this.onProbeChange ?? this.refreshExample)
                        : this.refreshExample
                );
            }
            if (value instanceof Recordset)
                value[method]('page-changed', this.refreshExample);
        }
    }
}
