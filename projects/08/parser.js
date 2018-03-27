function parse(line) {
    const comment = line.indexOf('//');

    if (comment >= 0) {
        line = line.slice(0, comment);
    }

    line = line.trim();

    if (!line) {
        return null;
    }

    const elements = line.split(/\s+/);

    const firstElement = elements[0];
    const secondElement = elements[1];
    const thirdElement = elements[2];

    switch (firstElement) {
        case 'add':
            return {type: 'arithmetic', operation: 'add'};
        case 'sub':
            return {type: 'arithmetic', operation: 'sub'};
        case 'neg':
            return {type: 'arithmetic', operation: 'neg'};
        case 'eq':
            return {type: 'arithmetic', operation: 'eq'};
        case 'gt':
            return {type: 'arithmetic', operation: 'gt'};
        case 'lt':
            return {type: 'arithmetic', operation: 'lt'};
        case 'and':
            return {type: 'arithmetic', operation: 'and'};
        case 'or':
            return {type: 'arithmetic', operation: 'or'};
        case 'not':
            return {type: 'arithmetic', operation: 'not'};
        case 'push':
            return {type: 'push', segment: secondElement, index: parseInt(thirdElement, 10)};
        case 'pop':
            return {type: 'pop', segment: secondElement, index: parseInt(thirdElement, 10)};
        case 'label':
            return {type: 'label', label: secondElement};
        case 'goto':
            return {type: 'goto', label: secondElement};
        case 'if-goto':
            return {type: 'if-goto', label: secondElement};
        case 'function':
            return {type: 'function', name: secondElement, numLocals: parseInt(thirdElement, 10)};
        case 'return':
            return {type: 'return'};
        case 'call':
            return {type: 'call', name: secondElement, numArguments: parseInt(thirdElement, 10)};
    }
}

module.exports = parse;
