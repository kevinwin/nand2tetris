const fs = require('fs');
const path = require('path');
const {bootstrap, translate} = require('./vm');

const vmPath = process.argv[2];
const isDirectory = fs.lstatSync(vmPath).isDirectory();

const source = isDirectory ? fs.readdirSync(vmPath).filter(file => path.extname(file) === '.vm').map(file => vmPath + file) : [vmPath];
const destination = isDirectory ? `${vmPath}/${path.basename(vmPath)}.asm`.replace('//', '/') :  vmPath.replace(/vm$/, 'asm')





