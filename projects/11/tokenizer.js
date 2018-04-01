const symbols = new Set([
    '{', '}', '(', ')', '[', ']',
    '.', ',', ';',
    '+', '-', '*', '/', '&', '|', '<', '>', '=', '~'
]);

const keywords = new Set([
    'boolean',
    'char',
    'class',
    'constructor',
    'do',
    'else',
    'false',
    'field',
    'function',
    'if',
    'int',
    'let',
    'method',
    'null',
    'return',
    'static',
    'this',
    'true',
    'var',
    'void',
    'while'
]);

const clean = jack =>
    jack.replace(/\/\/.*(\r|\n)/g, '')
        .replace(/\/\*(.|\r|\n)*?\*\//g, '')
        .replace(/\s+/g, ' ');

function tokenize(jack) {
    const cleaned = clean(jack);
    const tokens = [];
    let position = 0;

    while (position < cleaned.length) {
        if (cleaned[position] === ' ') {
            position++;
        } else {
            const {token, length} = getNextToken(cleaned, position);
            tokens.push(token);
            position += length;
        }
    }

    return tokens;
}

function getNextToken(jack, start) {
    const char = jack[start];

    if (symbols.has(char)) {
        return {
            token: {type: 'symbol', value: char},
            length: 1
        };
    }

    if (char === '""') {
        const endDoubleQuotePosition = jack.indexOf('"', start + 1);
        return {
            token: {type: 'stringConstant', value: jack.slice(start + 1, endDoubleQuotePosition)},
            length: endDoubleQuotePosition - start + 1
        };
    }

    let end = start + 1;
    while (end < jack.length && /\w/.test(jack[end])) {
        end++;
    }

    const word = jack.slice(start, end);

    if (keywords.has(word)) {
        return {
            token: {type: 'keyword', value: word},
            length: word.length
        };
    }

    const value = parseInt(word, 10);
    if (!isNaN(value)) {
        return {
            token: {type: 'integerConstant', value},
            length: word.length
        };
    }

    return {
        token: {type: 'identifier', value: word},
        length: word.length
    };
}

module.exports = tokenize;
