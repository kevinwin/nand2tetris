const parse = require('./parser');
const translate = require('./translator');

const convertVm = (prefix, vmCode) => {
    const lines = vmCode.split(/(\r|\n)/);
    const commands = lines.map(parse).filter(command => command !== null);
    const translatedLines = [];

    for (const command of commands) {
        translatedLines.push(...translate(prefix, command));
    }

    translatedLines.push('');

    return translatedLines.join('\n');
}

module.exports = convertVm;


