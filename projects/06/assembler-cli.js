const assemble = require('./assembler');

const fs = require('fs');

const asmPath = process.argv[2];
const hackPath = asmPath.replace(/\.asm$/, '.hack');

console.log(`Assembling ${asmPath} to ${hackPath}`);

const asm = fs.readFileSync(asmPath, {encoding: 'utf8'});
const binaryOut = assemble(asm);

fs.writeFileSync(hackPath, binaryOut, {encoding: 'utf8'});
