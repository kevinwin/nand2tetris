const fs = require('fs');
const path = require('path');
const convertVm = require('./vm');

const vmPath = process.argv[2];
const asmPath = vmPath.replace(/\.vm$/, '.asm');

const prefix = path.basename(vmPath, '.vm');
const vm = fs.readFileSync(vmPath, {encoding: 'utf8'});

console.log(`Translating ${vmPath} into ${asmPath}...`);
const asm = convertVm(prefix, vm);

fs.writeFileSync(asmPath, asm, {encoding: 'utf8'});
console.log('Done.');







