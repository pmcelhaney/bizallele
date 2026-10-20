/// <reference types="node" />
import ts from 'typescript';
import path from 'path';
import { firstFormSource } from '../examples/fdl-input/quickstart-page';

it('type-checks the complete copied first-form script against the source package', () => {
    const file = path.resolve('examples/fdl-input/__consumer_quickstart__.ts');
    const options: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        strict: true,
        allowJs: true,
        skipLibCheck: true,
        experimentalDecorators: true,
        useDefineForClassFields: false,
        noEmit: true,
        baseUrl: process.cwd(),
        paths: {
            bizallele: ['src/index.js'],
            'bizallele/*': ['src/*'],
        },
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) =>
        name === file
            ? ts.createSourceFile(name, firstFormSource, languageVersion, true)
            : getSourceFile(name, languageVersion, onError, shouldCreateNewSourceFile);
    const program = ts.createProgram([file], options, host);
    const errors = ts
        .getPreEmitDiagnostics(program)
        .filter(d => d.category === ts.DiagnosticCategory.Error);
    expect(errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([]);
});
