const { execSync } = require("child_process");
const fs = require('fs');
const path = require('path');

const devDependenciesBlackList = [ 'ts-node' ];

function run() {
  execSync('npm run build');
  const packageJSON = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  packageJSON.peerDependencies = packageJSON.devDependencies;
  packageJSON.main = 'index.js';
  devDependenciesBlackList.forEach(dep => delete packageJSON.peerDependencies[dep]);
  delete packageJSON.devDependencies;
  delete packageJSON.scripts;
  fs.copyFileSync('README.md', path.join('dist', 'README.md'));
  fs.writeFileSync(path.join('dist', 'package.json'), JSON.stringify(packageJSON, null, 2));
  execSync('npm publish', { cwd: 'dist' })
}

run();
