const parse = require('./parser');
const translate = require('./translator');

function bootstrap() {
    return [...translate(null, {type: 'bootstrap'})].join('\n');
}

function convert(prefix, vmCode) {
    const lines = vmCode.split(/(\r|\n)/);
    const translatedLines = [];

    for (const line of lines) {
        const command = parse(line);
        command && translatedLines.push(...translate(prefix, command));
    }

    return translatedLines.join('\n');
}

module.exports = {
    bootstrap,
    convert
}

