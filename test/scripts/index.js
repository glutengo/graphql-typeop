const tsConfig = require( '../../tsconfig.json');
const ts = require('typescript');
const tsNode = require('ts-node').register;
const transformer = require('../../dist/transformers/graphql.transformer').default;

const compileProject = (fileName) => {
    const { options, fileNames } = ts.parseJsonConfigFileContent(
        tsConfig,
        ts.sys,
        __dirname
    );
    const program = ts.createProgram([fileName], options);

    const transformers = {
        before: [ transformer.create(program) ],
        after: []
    };

    const res = program.emit(program.getSourceFile(fileName), undefined, undefined, false, transformers);
}

const compileAndRun = file => {
    tsNode({ files: [file], compilerOptions: tsConfig.compilerOptions, transformers: p => ({
      before: [
        transformer.create(p, 'decorators_1.')
      ]
    }) });
    const required = require(file);
}

module.export = main = (args) => {
  // compileProject('./test/index.ts');
  compileAndRun('../index.ts');
}

main();
