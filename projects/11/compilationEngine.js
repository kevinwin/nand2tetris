const tokenize = require('./tokenizer')
const parse = require('./parser')
const SymbolTable = require('./SymbolTable')

const segments = {
    static: 'static',
    field: 'this',
    argument: 'argument',
    var: 'local'
};

function compile(jack) {
    const tokens = tokenize(jack);
    const node = parse(tokens);
    return compileClass(node).join('\n') + '\n';
}

function compileClass({children}) {
    const symbolTable = new SymbolTable();
    const compiledLines = [];

    for (const child of children) {
        switch (child.type) {
            case 'identifier':
                symbolTable.className = child.value;
                break;

            case 'classVarDec':
                processVarDec(child, symbolTable);
                break;

            case 'subroutineDec':
                compiledLines.push(...compileSubroutineDec(child, symbolTable));
                break;
        }
    }

    return compiledLines;
}

function compileSubroutineDec({children}, symbolTable) {
    const subroutineType = children[0].value;
    const subroutineName = children[2].value;

    symbolTable.startSubroutine(subroutineType);

    processParameterList(children[4], symbolTable);

    const subroutineBodyLines = compileSubroutineBody(children[6], symbolTable);

    const numFields = symbolTable.count('field');
    const numVars = symbolTable.count('var');

    switch (subroutineType) {
        case 'constructor':
            return [
                `function ${symbolTable.className}.${subroutineName} ${numVars}`,
                'push constant ' + numFields, // Allocate one word per field
                'call Memory.alloc 1',        // Push the instance address on the stack
                'pop pointer 0',              // Pop the instance address into pointer[0]
                ...subroutineBodyLines
            ];

        case 'method':
            return [
                `function ${symbolTable.className}.${subroutineName} ${numVars}`,
                'push argument 0', // Push `this` on the stack
                'pop pointer 0',   // Pop `this` into pointer[0]
                ...subroutineBodyLines
            ];

        case 'function':
            return [
                `function ${symbolTable.className}.${subroutineName} ${numVars}`,
                ...subroutineBodyLines
            ];
    }
}

function compileSubroutineBody({children}, symbolTable) {
    const compiledLines = [];

    for (const child of children) {
        switch (child.type) {
            case 'varDec':
                processVarDec(child, symbolTable);
                break;

            case 'statements':
                compiledLines.push(...compileStatements(child, symbolTable));
                break;
        }
    }

    return compiledLines;
}

function compileStatements({children}, symbolTable) {
    const compiledLines = [];

    for (const child of children) {
        switch (child.type) {
            case 'letStatement':
                compiledLines.push(...compileLetStatement(child, symbolTable));
                break;

            case 'ifStatement':
                compiledLines.push(...compileIfStatement(child, symbolTable));
                break;

            case 'whileStatement':
                compiledLines.push(...compileWhileStatement(child, symbolTable));
                break;

            case 'doStatement':
                compiledLines.push(...compileDoStatement(child, symbolTable));
                break;

            case 'returnStatement':
                compiledLines.push(...compileReturnStatement(child, symbolTable));
                break;
        }
    }

    return compiledLines;
}

function compileLetStatement({children}, symbolTable) {
    return [
        ...compileExpression(children[children.length - 2], symbolTable),
        ...pop(children, 1, symbolTable)
    ];
}

function compileWhileStatement({children}, symbolTable) {
    const labelIndex = symbolTable.nextLabelIndex++;
    const startLabel = 'WHILE_START_' + labelIndex;
    const endLabel = 'WHILE_END_' + labelIndex;

    return [
        'label ' + startLabel,
        ...compileExpression(children[2], symbolTable),
        'not',
        'if-goto ' + endLabel,
        ...compileStatements(children[5], symbolTable),
        'goto ' + startLabel,
        'label ' + endLabel
    ];
}

function compileIfStatement({children}, symbolTable) {
    const labelIndex = symbolTable.nextLabelIndex++;
    const endLabel = 'IF_END_' + labelIndex;

    const conditionLines = compileExpression(children[2], symbolTable);
    const ifLines = compileStatements(children[5], symbolTable);

    if (children.length < 8) {
        // Simple if statement.
         return [
            ...conditionLines,
            'not',
            'if-goto ' + endLabel,
            ...ifLines,
            'label ' + endLabel
        ];
    }

    // if-else statement.
    const trueLabel = 'IF_TRUE_' + labelIndex;
    const elseLines = compileStatements(children[9], symbolTable);
    return [
        ...conditionLines,
        'if-goto ' + trueLabel,
        ...elseLines,
        'goto ' + endLabel,
        'label ' + trueLabel,
        ...ifLines,
        'label ' + endLabel
    ];
}

function compileDoStatement({children}, symbolTable) {
    return [...compileSubroutineCall(children[1], symbolTable), 'pop temp 0'];
}

function compileReturnStatement({children}, symbolTable) {
    return children[1].type === 'expression' ?
        [...compileExpression(children[1], symbolTable), 'return'] :
        ['push constant 0', 'return'];
}

function compileSubroutineCall({children}, symbolTable) {
    if (children[1].value === '(') {
        // Method call on the current `this`.
        const subroutineName = children[0].value;
        const expressionList = children[2];
        const numArguments = Math.floor((expressionList.children.length + 1) / 2);

        return [
            'push pointer 0',
            ...compileExpressionList(expressionList, symbolTable),
            `call ${symbolTable.className}.${subroutineName} ${numArguments + 1}`
        ];
    }

    const subroutineName = children[2].value;
    const expressionList = children[4];
    const numArguments = Math.floor((expressionList.children.length + 1) / 2);

    if (symbolTable.has(children[0].value)) {
        // Method call on another instance.
        const className = symbolTable.get(children[0].value).type;

        return [
            ...push(children, 0, symbolTable),
            ...compileExpressionList(expressionList, symbolTable),
            `call ${className}.${subroutineName} ${numArguments + 1}`
        ];
    }

    // Static call.
    return [
        ...compileExpressionList(expressionList, symbolTable),
        `call ${children[0].value}.${subroutineName} ${numArguments}`
    ];
}

function compileExpressionList({children}, symbolTable) {
    const compiledLines = [];

    for (const child of children) {
        if (child.type === 'expression') {
            compiledLines.push(...compileExpression(child, symbolTable));
        }
    }

    return compiledLines;
}

function compileExpression({children}, symbolTable) {
    const compiledLines = compileTerm(children[0], symbolTable);

    if (children.length > 1) {
        compiledLines.push(...compileTerm(children[2], symbolTable), ...compileOp(children[1]));
    }

    return compiledLines;
}

function compileTerm({children}, symbolTable) {
    switch (children[0].type) {
        case 'integerConstant':
            return [`push constant ${children[0].value}`];

        case 'stringConstant':
            return compileStringConstant(children[0]);

        case 'keyword':
            return compileKeywordConstant(children[0]);

        case 'identifier':
            return push(children, 0, symbolTable);

        case 'subroutineCall':
            return compileSubroutineCall(children[0], symbolTable);

        case 'symbol':
            if (children[0].value === '(') {
                return compileExpression(children[1], symbolTable);
            }
            return [...compileTerm(children[1], symbolTable), ...compileUnaryOp(children[0])];
    }
}

function compileStringConstant({value}) {
    const compiledLines = [
        'push constant ' + value.length,
        'call String.new 1'
    ];

    for (let i = 0; i < value.length; i++) {
        compiledLines.push(
            'push constant ' + value.charCodeAt(i),
            'call String.appendChar 2'
        );
    }

    return compiledLines;
}

function compileKeywordConstant({value}) {
    switch (value) {
        case 'true':
            return ['push constant 0', 'not'];

        case 'null':
        case 'false':
            return ['push constant 0'];

        case 'this':
            return ['push pointer 0'];
    }
}

function compileOp({value}) {
    switch (value) {
        case '+': return ['add'];
        case '-': return ['sub'];
        case '*': return ['call Math.multiply 2'];
        case '/': return ['call Math.divide 2'];
        case '&': return ['and'];
        case '|': return ['or'];
        case '<': return ['lt'];
        case '>': return ['gt'];
        case '=': return ['eq'];
    }
}

function compileUnaryOp({value}) {
    switch (value) {
        case '-': return ['neg'];
        case '~': return ['not'];
    }
}

function pop(nodes, start, symbolTable) {
    return move('pop', nodes, start, symbolTable);
}

function push(nodes, start, symbolTable) {
    return move('push', nodes, start, symbolTable);
}

function move(action, nodes, start, symbolTable) {
    const varName = nodes[start].value;

    if (nodes[start + 1] && nodes[start + 1].type === 'symbol' && nodes[start+ 1].value === '[') {
        const offsetExpression = nodes[start + 2];
        return moveCell(action, varName, offsetExpression, symbolTable);
    }

    const {kind, index} = symbolTable.get(varName);
    return [`${action} ${segments[kind]} ${index}`];
}

function moveCell(action, arrayName, offsetExpression, symbolTable) {
    const {kind, index} = symbolTable.get(arrayName);

    // Make `that` point to the cell, then push to or pop from `that`.
    return [
        `push ${segments[kind]} ${index}`,
        ...compileExpression(offsetExpression, symbolTable),
        'add',
        'pop pointer 1',
        `${action} that 0`
    ];
}

function processVarDec({children}, symbolTable) {
    const properties = {kind: children[0].value, type: children[1].value};

    for (let i = 2; i < children.length; i += 2) {
        const varName = children[i].value;
        symbolTable.set(varName, properties);
    }
}

function processParameterList({children}, symbolTable) {
    for (let i = 0; i < children.length; i += 3) {
        const type = children[i].value;
        const varName = children[i + 1].value;
        symbolTable.set(varName, {kind: 'argument', type});
    }
}

module.exports = compile;
