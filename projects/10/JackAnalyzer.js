const fs = require('fs');
const path = require('path');

const tokenize = require('./tokenizer');
const parse = require('./parser');
const convertToXml = require('./xmlConverter');

const sourcePath = process.argv[2];
const isDirectory = fs.lstatSync(sourcePath).isDirectory();
const source = isDirectory ? fs.readdirSync(sourcePath).filter(file => path.extname(file) === '.jack').map(file => `${sourcePath}/${file}`.replace('//', '/')) : [sourcePath];
const destinations = process.argv.slice(3).length ? process.argv.slice(3) : source.map(file => `${__dirname}/${path.basename(file)}`.replace(/jack$/, 'xml'));

// For each source file...
source.forEach((jackFile, i) => {
  // Read contents of jack file
  const jack = fs.readFileSync(jackFile, {encoding: 'utf8'});

  // Tokenize jack file
  const tokens = tokenize(jack);

  // Parse into tree
  const tree = parse(tokens);

  // Convert tree into xml
  const parsedXml = convertToXml(tree);

  // Write xml to destination
  const destination = destinations[i];
    console.log(`writing to ${destination} from ${jackFile}`)
  fs.writeFileSync(destination, parsedXml, {encoding: 'utf8'});
});
