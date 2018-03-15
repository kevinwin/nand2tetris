const {translateDestination, translateComputation, translateJump} = require('./translator');
const parse = require('./parse');
const SymbolTable = require('./SymbolTable');

function assemble(assembly) {
    const lines = assembly.split(/(\r|\n)/);
    const commands = lines.map(parse).filter(command => command !== null);
    const symbolTable = new SymbolTable();

    // Pass 1: Add labels to symbol table
    let lineAddress = 0;
    for (const command of commands) {
        switch (command.type) {
            case 'A':
            case 'C':
                lineAddress++;
                break;
            case 'L':
                symbolTable.set(command.symbol, lineAddress);
                break;
        }
    }
    
    // Pass 2: Add variables to symbol table & translate commands
    let nextVarAddress = parseInt(10000, 2); // 16 in binary
    const translatedCommands = [];
    for (const command of commands) {
        switch (command.type) {
            case 'A': {
                let number;
                const constant = parseInt(command.symbol, 10);
                if (isNaN(constant)) {
                    if (!symbolTable.has(command.symbol)) {
                        symbolTable.set(command.symbol, nextVarAddress);
                        nextVarAddress++;
                    }
                    number = symbolTable.get(command.symbol);
                } else {
                    number = constant;
                }
                const binary = number.toString(2),
                      padding = '0'.repeat(16 - binary.length);
                translatedCommands.push(padding + binary);
                break;
            }
            case 'C': {
                const binary = '111' + translateComputation(command.computation) + translateDestination(command.destination) + translateJump(command.jump);
                translatedCommands.push(binary);
                break;
            }

            case 'L': {
                // do nothing
                break;
            }
        }
    }

    translatedCommands.push('');
    return translatedCommands.join('\n');

}

module.exports = assemble;
