const fs = require('fs');
const path = require('path');
const {bootstrap, convert} = require('./vm');

const vmPath = process.argv[2];
const isDirectory = fs.lstatSync(vmPath).isDirectory();

const source = isDirectory ? fs.readdirSync(vmPath).filter(file => path.extname(file) === '.vm').map(file => vmPath + file) : [vmPath];
const destination = isDirectory ? `${vmPath}/${path.basename(vmPath)}.asm`.replace('//', '/') :  vmPath.replace(/vm$/, 'asm')

let hasSysInit = false;
const asms = [];

for (const vmPath of vmPaths) {
    const prefix = path.basename(vmPath, '.vm');
    const vmCode = fs.readFileSync(vmPath, {encoding: 'utf8'});

    hasSysInit = hasSysInit || /^\s*function\s+Sys\.init\s+0\s*$/m.test(vmCode);

    const asm = convert(prefix, vmCode);
    asms.push(asm);
}

hasSysInit && asms.splice(0, 0, bootstrap());

const asm = asms.join('\n');

fs.writeFileSync(destination, asm, {encoding: 'utf8'});




