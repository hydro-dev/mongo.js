
const map = {};
require('source-map-support').install({
    handleUncaughtExceptions: false,
    environment: 'node',
    retrieveSourceMap(file) {
        if (map[file]) {
            return {
                url: file,
                map: map[file],
            };
        }
        return null;
    },
});
const esbuild = require('esbuild');
const fs = require('fs');

const major = +process.version.split('.')[0].split('v')[1];
const minor = +process.version.split('.')[1];

function transform(filename) {
    const code = fs.readFileSync(filename, 'utf-8');
    const result = esbuild.transformSync(code, {
        sourcefile: filename,
        sourcemap: 'both',
        format: 'cjs',
        loader: 'tsx',
        target: `node${major}.${minor}`,
        jsx: 'transform',
    });
    if (result.warnings.length) console.warn(result.warnings);
    map[filename] = result.map;
    return result.code;
}
require.extensions['.js'] = function loader(module, filename) {
    if (major < 14) {
        return module._compile(transform(filename), filename);
    }
    const content = fs.readFileSync(filename, 'utf-8');
    return module._compile(content, filename);
};
require.extensions['.ts'] = require.extensions['.tsx'] = function loader(module, filename) {
    return module._compile(transform(filename), filename);
};
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiShape = require('chai-shape');
chai.use(chaiAsPromised);
chai.use(chaiShape);
require('./test.ts');
