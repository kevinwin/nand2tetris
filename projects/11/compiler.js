const fs = require('fs');
const path = require('path');

const compile = require('./compilationEngine');

const sourcePath = process.argv[2];
const isDirectory = fs.lstatSync(sourcePath).isDirectory();
const source = isDirectory ? fs.readdirSync(sourcePath).filter(file => path.extname(file) === '.jack').map(file => `${sourcePath}/${file}`.replace(/\/\/$/,'/')) : [sourcePath];
const destinations = process.argv.slice(3).length ? process.argv.slice(3) : source.map(file => `${__dirname}/${path.basename(file)}`.replace(/jack$/, 'vm'));

// for each file
source.forEach((jackFile, i) => {
  // get its contents
  const jack = fs.readFileSync(jackFile, {encoding: 'utf8'});
  // compile to vm code
  const vm = compile(jack);
  // write to destination
  fs.writeFileSync(destinations[i], vm, {encoding: 'utf8'});

  console.log(`Wrote ${jackFile} to ${destinations[i]}`);
});
