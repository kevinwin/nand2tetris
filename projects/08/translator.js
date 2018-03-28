const symbols = {
    argument: 'ARG',
    local: 'LCL',
    this: 'THIS',
    that: 'THAT'
};

const popDCommands = ['@SP', 'M=M-1', 'A=M', 'D=M'];
const pushDCommands = ['@SP', 'M=M+1', 'A=M-1', 'M=D'];
const push0Commands = ['@SP', 'M=M+1', 'A=M-1', 'M=0'];

const returnCommands = [
    '@LCL', 'D=M', '@5', 'A=D-A', 'D=M', '@R14', 'M=D',
    '@SP', 'M=M-1', 'A=M', 'D=M', '@ARG', 'A=M', 'M=D',
    '@ARG', 'D=M+1', '@SP', 'M=D',
    '@LCL', 'D=M', '@1', 'A=D-A', 'D=M', '@THAT', 'M=D',
    '@LCL', 'D=M', '@2', 'A=D-A', 'D=M', '@THIS', 'M=D',
    '@LCL', 'D=M', '@3', 'A=D-A', 'D=M', '@ARG', 'M=D',
    '@LCL', 'D=M', '@4', 'A=D-A', 'D=M', '@LCL', 'M=D',
    '@R14', 'A=M', '0;JMP'
];

let labelIndex = 0;

function advanceLabel() {
    const currentIndex = labelIndex++;
    return `LABEL${currentIndex}`;
}

function getAddress(prefix, segment, index) {
    switch (segment) {
        case 'pointer':
            return `@${3+index}`;
        case 'static':
            return `@${prefix}.${index}`;
        case 'temp':
            return `@${5+index}`;
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
        case 'eq': {
            const label = advanceLabel();
            return [
                ...popDCommands, 'A=A-1', 'M=M-D', 'M=!M',
                'D=M+1', `@${label}`, 'D;JEQ',
                '@SP', 'A=M-1', 'M=0',
                `(${label})`
            ];
        }
        case 'gt': {
            const label = advanceLabel();
            return [
                ...popDcommands, 'A=A-1', 'D=M-D', 'M=-1',
                `@${label}`, 'D;JGT',
                '@SP', 'A=M-1', 'M=0',
                `(${label})`
            ];
        }
        case 'lt': {
            const label = advanceLabel();
            return [
                ...popDCommands, 'A=A-1', 'D=M-D', 'M=-1',
                `@${label}`, 'D;JLT',
                '@SP', 'A=M-1', 'M=0',
                `(${label})`
            ];

        }
        case 'and':
            return [...popDCommands, 'A=A-1', 'M=M&D'];
        case 'or':
            return [...popDCommands, 'A=A-1', 'M=M|D'];
        case 'not':
            return ['@SP', 'A=M-1', 'M=!M'];
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
                `@${symbols[segment]}`, 'D=M', `@${index}`, 'D=D+A', '$13', 'M=D',
                ...popDCommands, '@R13', 'A=M', 'M=D'
            ];
    }
}

function translateFunction(name, numLocals) {
    const lines = [`(${name})`];
    for (let i = 0; i < numLocals; i++) {
        lines.push(...push0);
    }

    return lines;
}

function translateCall(name, numArguments) {
    const returnLabel = advanceLabel();
    return [
        `@${returnLabel}`, 'D=A', ...pushDCommands,
        '@LCL', 'D=M', ...pushDCommands,
        '@ARG', 'D=M', ...pushDCommands,
        '@THIS', 'D=M', ...pushDCommands,
        '@THAT', 'D=M', ...pushDCommands,
        '@SP', 'D=M', `@${numArguments+5}`, 'D=D-A', '@ARG', 'M=D',
        '@SP', 'D=M', '@LCL', 'M=D',
        `@${name}`, '0;JMP',
        `(${returnLabel})`
    ];
}

function translateBootstrap() {
    return [
        '@256', 'D=A', '@0', 'M=D',
        ...translateCall('Sys.init', 0);
    ];
}

function translate(prefix, command) {   
    switch (command.type) {
        case 'arithmetic':
            return translateArithmetic(command.operation);
        case 'bootstrap':
            return translateBootstrap();
        case 'call':
            return translateCall(command.name, command.numArguments);
        case 'function':
            return translateFunction(command.name, command.numLocals);
        case 'pop':
            return translatePop(prefix, command.segment, command.index);
        case 'push':
            return translatePush(prefix, command.segment, command.index);
        case 'goto':
            return [`@${command.label}`, '0;JMP'];
        case 'if-goto':
            return [...popDCommands, `@${command.label}`, 'D;JNE'];
        case 'label':
            return [`(${command.label})`];
        case 'return':
            return returnCommands;
    }
}

module.exports = translate;
