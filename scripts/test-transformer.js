const tsConfig = require( '../tsconfig.json');
const ts = require('typescript');
const tsNode = require('ts-node').register;
const transformer = require('../dist/transformers/graphql.transformer').default;

const compileAndRun = file => {
    tsNode({ files: [file], compilerOptions: tsConfig.compilerOptions, transformers: p => ({
      before: [
        transformer.create(p, 'decorators_1.')
      ]
    }) });
    require(file);
}

const main = (args) => {
  compileAndRun('../test/transformer.ts');
}

main();
