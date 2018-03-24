const symbols = {
    argument: 'ARG',
    local: 'LCL',
    this: 'THIS',
    that: 'THAT'
}

const pushDCommands = ['@SP', 'M=M+1', 'A=M-1', 'M=D'];
const popDCommands = ['@SP', 'M=M-1', 'A=M', 'D=M'];

let nextLabelIndex = 0;

function advanceNextLabelIndex() {
    const currentIndex = nextLabelIndex;
    nextLabelIndex++;
    return `LABEL${currentIndex}`;
}

function getAddress(prefix, segment, index) {
    switch (segment) {
        case 'pointer':
            return `@${3 + index}`;
        case 'static':
            return `@${prefix}.${index}`;
        case 'temp':
            return `@${5 + index}`;
    }
}

function translateArithmetic(operation) {
    switch (operation) {
        case 'add':
            return [...popDCommands, 'A=A-1', 'M=M+D'];
        case 'sub':
            return [...popDCommands, 'A=A-1', 'M=M-D'];
        case 'neg':
            return ['@SP', 'A=M-1', 'M=-M'];
        case 'and': 
            return [...popDCommands, 'A=A-1', 'M=M&D'];
        case 'or':
            return [...popDCommands, 'A=A-1', 'M=M|D'];
        case 'not':
            return ['@SP', 'A=M-1', 'M=!M'];
        case 'eq': {
            const label = advanceNextLabelIndex();
            return [
                ...popDCommands, 'A=A-1', 'M=M-D', 'M=!M',
                'D=M+1', `@${label}`, 'D;JEQ',
                '@SP', 'A=M-1', 'M=0',
                `(${label})`
            ];
        }
        case 'gt': {
            const label = advanceNextLabelIndex();
            return [
                ...popDCommands, 'A=A-1', 'D=M-D', 'M=-1',
                `@${label}`, 'D;JGT',
                '@SP', 'A=M-1', 'M=0',
                `(${label})`
            ];
        }
        case 'lt': {
            const label = advanceNextLabelIndex();
            return [
                ...popDCommands, 'A=A-1', 'D=M-D', 'M=-1',
                `@${label}`, 'D;JLT',
                '@SP', 'A=M-1', 'M=0',
                `(${label})`
            ];
        }

    }
}

function translatePush(prefix, segment, index) {
    switch (segment) {
        case 'constant':
            return [`@${index}`, 'D=A', ...pushDCommands];
        case 'pointer':
        case 'static':
        case 'temp': {
            const address = getAddress(prefix, segment, index);
            return [address, 'D=M', ...pushDCommands];
        }
        default:
            return [`@${symbols[segment]}`, 'D=M', `@${index}`, 'A=D+A', 'D=M', ...pushDCommands];
    }
}

function translatePop(prefix, segment, index) {
    switch (segment) {
        case 'pointer':
        case 'static':
        case 'temp': {
            const address = getAddress(prefix, segment, index);
            return [...popDCommands, address, 'M=D'];
        }
        default:
            return [
                `@${symbols[segment]}`, 'D=M', `@${index}`, 'D=D+A', '@R13', 'M=D',
                ...popDCommands, '@R13', 'A=M', 'M=D'
            ];
    }
}

function translate(prefix, command) {
    switch (command.type) {
        case 'arithmetic':
            return translateArithmetic(command.operation);
        case 'push':
            return translatePush(prefix, command.segment, command.index);
        case 'pop':
            return translatePop(prefix, command.segment, command.index);
    }
}

module.exports = translate;
