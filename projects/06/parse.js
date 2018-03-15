function parse(line) {
    const comment = line.indexOf('//');

    if (comment >= 0) {
        line = line.slice(0, comment);
    }

    line = line.replace(/\s/g, '') // Remove space/return characters

    if (!line) return null;

    const firstChar = line[0];

    switch (firstChar) {
        case '@':
            return {
                type: 'A',
                symbol: line.slice(1)
            };
            
        case '(':
            return {
                type: 'L',
                symbol: line.slice(1, line.length - 1)
            };

        default: {
            const equal = line.indexOf('=');
            const semicolon = line.indexOf(';');
            return {
                type: 'C',
                destination: equal < 0 ? '' : line.slice(0, equal),
                computation: line.slice(equal + 1, semicolon > -1 ? semicolon : undefined),
                jump: semicolon > -1 ? line.slice(semicolon + 1) : ''
            };
        }
    }
}

module.exports = parse;
