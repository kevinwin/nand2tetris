const opSymbols = new Set(['+', '-', '*', '/', '&', '|', '<', '>', '=']);
const unarySymbols = new Set(['-', '~']);
const methodKeywords = new Set(['constructor', 'function', 'method']);
const classVarKeywords = new Set(['static', 'field']);
const constantKeywords = new Set(['true', 'false','null', 'this']);

const isSymbol = (token, value) => token && token.type === 'symbol' && token.value === value;
const isOpSymbol = token => token && token.type === 'symbol' && opSymbols.has(token.value);
const isUnarySymbol = token => token && token.type === 'symbol' && unarySymbols.has(token.value);
const isKeyword = (token, value = void 0) => token && token.type === 'keyword' && (value === void 0 || token.value === value);
const isMethodKeyword = token => token && token.type === 'keyword' && methodKeywords.has(token.value);
const isClassVarKeyword = token => token && token.type === 'keyword' && classVarKeywords.has(token.value);
const isConstant = token => token && (token.type === 'integerConstant' || token.type === 'stringConstant' || token.type === 'keyword' && constantKeywords.has(token.value));
const isIdentifier = token => token && token.type === 'identifier';

function parse(tokens) {
    return parseClass(tokens, 0).node;
}

function parseClass(tokens, tokenIndex) {
    const children = [];

    children.push(tokens[tokenIndex++]); // class keyword
    children.push(tokens[tokenIndex++]); // identifier className
    children.push(tokens[tokenIndex++]); // symbol {

    while (true) {
        const {node, nextTokenIndex} = parseOptionalClassVar(tokens, tokenIndex);
        if (!node) {
            break;
        }
        children.push(node);
        tokenIndex = nextTokenIndex;
    }

    while (true) {
        const {node, nextTokenIndex} = parseOptionalMethod(tokens, tokenIndex);
        if (!node) {
            break;
        }
        children.push(node);
        tokenIndex = nextTokenIndex;
    }

    children.push(tokens[tokenIndex++]); // symbol }

    return {
        node: {type: 'class', children},
        nextTokenIndex: tokenIndex
    };
}

function parseOptionalClassVar(tokens, tokenIndex) {
    if (!isClassVarKeyword(tokens[tokenIndex])) {
        return {node: null, nextTokenIndex: tokenIndex}
    }

    const children = [];

    while (!isSymbol(tokens[tokenIndex], ';')) {
        children.push(tokens[tokenIndex++])
    }

    children.push(tokens[tokenIndex++]); // symbol }

    return {
        node: {type: 'classVarDec', children},
        nextTokenIndex: tokenIndex
    };
}

function parseOptionalMethod(tokens, tokenIndex) {
    if (!isMethodKeyword(tokens[tokenIndex])) {
        return {node: null, nextTokenIndex: tokenIndex};
    }

    const children = [];

    children.push(tokens[tokenIndex++]); // constructor | function | method
    children.push(tokens[tokenIndex++]); // void | type
    children.push(tokens[tokenIndex++]); // method name
    children.push(tokens[tokenIndex++]); // symbol (

    const parameterList = parseParameterList(tokens, tokenIndex);
    children.push(parameterList.node)
    tokenIndex = parameterList.nextTokenIndex;

    children.push(tokens[tokenIndex++]); // symbol )

    const methodBody = parseMethodBody(tokens, tokenIndex);
    children.push(methodBody.node);
    tokenIndex = methodBody.nextTokenIndex;

    return {
        node: {type: 'subroutineDec', children},
        nextTokenIndex: tokenIndex
    };
}


function parseParameterList(tokens, tokenIndex) {
    const children = [];

    while (!isSymbol(tokens[tokenIndex], ')')) {
        children.push(tokens[tokenIndex++]);
    }

    return {
        node: {type: 'parameterList', children},
        nextTokenIndex: tokenIndex
    };
}

function parseMethodBody(tokens, tokenIndex) {
    const children = [];

    children.push(tokens[tokenIndex++]); // symbol {

    while (true) {
        const {node, nextTokenIndex} = parseOptionalVar(tokens, tokenIndex);
        if (!node) {
            break;
        }
        children.push(node);
        tokenIndex = nextTokenIndex;
    }

    const statements = parseStatements(tokens, tokenIndex);
    children.push(statements.node);
    tokenIndex = statements.nextTokenIndex;

    children.push(tokens[tokenIndex++]); // symbol }

    return {
        node: {type: 'subroutineBody', children},
        nextTokenIndex: tokenIndex
    };
}

function parseOptionalVar(tokens, tokenIndex) {
    if (!isKeyword(tokens[tokenIndex], 'var')) {
        return {node: null, nextTokenIndex: tokenIndex}
    }

    const children = [];
    
    while (!isSymbol(tokens[tokenIndex], ';')) {
        children.push(tokens[tokenIndex++]);
    }

    children.push(tokens[tokenIndex++]); // symbol ;

    return {
        node: {type: 'varDec', children},
        nextTokenIndex: tokenIndex
    };
}

function parseStatements(tokens, tokenIndex) {
    const children = [];

    while (true) {
        const {node, nextTokenIndex} = parseOptionalStatement(tokens, tokenIndex);
        if (!node) {
            break;
        }
        children.push(node);
        tokenIndex = nextTokenIndex;
    }

    return {
        node: {type: 'statements', children},
        nextTokenIndex: tokenIndex
    };
}

function parseOptionalStatement(tokens, tokenIndex) {
    if (isKeyword(tokens[tokenIndex])) {
        switch (tokens[tokenIndex].value) {
            case 'let': return parseLetStatement(tokens, tokenIndex);
            case 'if': return parseIfStatement(tokens, tokenIndex);
            case 'while': return parseWhileStatement(tokens, tokenIndex);
            case 'do': return parseDoStatement(tokens, tokenIndex);
            case 'return': return parseReturnStatement(tokens, tokenIndex);
        }
    }
}

function parseLetStatement(tokens, tokenIndex) {
    const children = [];

    children.push(tokens[tokenIndex++]); // let
    children.push(tokens[tokenIndex++]); // identifier name

    if (isSymbol(tokens[tokenIndex], '[')) {
        children.push(tokens[tokenIndex++]) // [

        const expression = parseExpression(tokens, tokenIndex);
        children.push(expression.node);
        tokenIndex = expression.nextTokenIndex;

        children.push(tokens[tokenIndex++]) // ]
    }

    children.push(tokens[tokenIndex++]); // =

    const expression = parseExpression(tokens, tokenIndex);
    children.push(expression.node);
    tokenIndex = expression.nextTokenIndex;

    children.push(tokens[tokenIndex++]); // ;

    return {
        node: {type: 'letStatement', children},
        nextTokenIndex: tokenIndex
    };
}

function parseIfStatement(tokens, tokenIndex) {
    const children = [];

    children.push(tokens[tokenIndex++]); // if
    children.push(tokens[tokenIndex++]); // (

    const expression = parseExpression(tokens, tokenIndex);
    children.push(expression.node);
    tokenIndex = expression.nextTokenIndex;

    children.push(tokens[tokenIndex++]); // )
    children.push(tokens[tokenIndex++]); // {

    const statements = parseStatements(tokens, tokenIndex);
    children.push(statements.node);
    tokenIndex = statements.nextTokenIndex;

    children.push(tokens[tokenIndex++]); // }

    if (isKeyword(tokens[tokenIndex], 'else')) {
//        children.push(tokens[tokenIndex++]); // else
        children.push(tokens[tokenIndex++]); // {

        const statements = parseStatements(tokens, tokenIndex);
        children.push(statements.node);
        tokenIndex = statements.nextTokenIndex;

        children.push(tokens[tokenIndex++]); // }
    }

    return {
        node: {type: 'ifStatement', children},
        nextTokenIndex: tokenIndex
    };
}

function parseWhileStatement(tokens, tokenIndex) {
    const children = [];

    children.push(tokens[tokenIndex++]); // while
    children.push(tokens[tokenIndex++]); // (

    const expression = parseExpression(tokens, tokenIndex);
    children.push(expression.node);
    tokenIndex = expression.nextTokenIndex;

    children.push(tokens[tokenIndex++]); // )
    children.push(tokens[tokenIndex++]); // {

    const statements = parseStatements(tokens, tokenIndex);
    children.push(statements.node);
    tokenIndex = statements.nextTokenIndex;

    children.push(tokens[tokenIndex++]); // }

    return {
        node: {type: 'whileStatement', children},
        nextTokenIndex: tokenIndex
    }
}

function parseDoStatement(tokens, tokenIndex) {
    const children = [];

    children.push(tokens[tokenIndex++]); // 'do'

    const methodCall = parseOptionalMethodCall(tokens, tokenIndex);
    if (methodCall.siblings) {
        children.push(...methodCall.sibling);
        tokenIndex = methodCall.nextTokenIndex;
    }

    children.push(tokens[tokenIndex++]); // ;

    return {
        node: {type: 'doStatement', children},
        nextTokenIndex: tokenIndex
    };
}

function parseReturnStatement(tokens, tokenIndex) {
    const children = [];

    children.push(tokens[tokenIndex++]); // 'return'

    if (!isSymbol(tokens[tokenIndex], ';')) {
        const expression = parseExpression(tokens, tokenIndex);
        children.push(expression.node);
        tokenIndex = expression.nextTokenIndex;
    }

    children.push(tokens[tokenIndex++]); // ;

    return {
        node: {type: 'returnStatement', children},
        nextTokenIndex: tokenIndex
    };
}

function parseExpression(tokens, tokenIndex) {
    const children = [];

    const term = parseTerm(tokens, tokenIndex); // first term
    children.push(term.node);
    tokenIndex = term.nextTokenIndex;

    if (isOpSymbol(tokens[tokenIndex])) {
        children.push(tokens[tokenIndex++]); // op
        const term = parseTerm(tokens, tokenIndex); // second term
        children.push(term.node);
        tokenIndex = term.nextTokenIndex;
    }

    return {
        node: {type: 'expression', children},
        nextTokenIndex: tokenIndex
    };
}

function parseTerm(tokens, tokenIndex) {
    const children = [];

    if (isConstant(tokens[tokenIndex])) {
        children.push(tokens[tokenIndex++]);
    } else if (isUnarySymbol(tokens[tokenIndex])) {
        children.push(tokens[tokenIndex++]) // unary symbol
        const term = parseTerm(tokens, tokenIndex);
        children.push(term.node);
        tokenIndex = term.nextTokenIndex;
    } else if (isSymbol(tokens[tokenIndex], '(')) {
        children.push(tokens[tokenIndex++]); // (
        const expression = parseExpression(tokens, tokenIndex);
        children.push(expression.node);
        tokenIndex = expression.nextTokenIndex;

        children.push(tokens[tokenIndex++]) // )
    } else {
        const methodCall = parseOptionalMethodCall(tokens, tokenIndex);

        if (methodCall.siblings) {
            children.push(...methodCall.siblings);
            tokenIndex = methodCall.nextTokenIndex;
        } else {
            children.push(tokens[tokenIndex++]); // var name identifier

            if (isSymbol(tokens[tokenIndex], '[')) {
                children.push(tokens[tokenIndex++]); // [

                const expression = parseExpression(tokens, tokenIndex);
                children.push(expression.node);
                tokenIndex = expression.nextTokenIndex;

                children.push(tokens[tokenIndex++]) // ]
            }
        }
    }

    return {
        node: {type: 'term', children},
        nextTokenIndex: tokenIndex
    };
}

function parseOptionalMethodCall(tokens, tokenIndex) {
    const pattern1 = isIdentifier(tokens[tokenIndex]) && isSymbol(tokens[tokenIndex+1], '(');
    const pattern2 = isIdentifier(tokens[tokenIndex]) && isSymbol(tokens[tokenIndex+1], '.') && isIdentifier(tokens[tokenIndex+2]) && isSymbol(tokens[tokenIndex+3], '(');

    if (!pattern1 && !pattern2) {
        return {
            siblings: null,
            nextTokenIndex: tokenIndex
        };
    }

    const siblings = [];

    while (!isSymbol(tokens[tokenIndex], '(')) {
        siblings.push(tokens[tokenIndex++]);
    }

    siblings.push(tokens[tokenIndex++]); // (

    const expressionList = parseExpressionList(tokens, tokenIndex);
    siblings.push(expressionList.node);
    tokenIndex = expressionList.nextTokenIndex;

    siblings.push(tokens[tokenIndex++]); // )

    return {
        siblings,
        nextTokenIndex: tokenIndex
    };
}

function parseExpressionList(tokens, tokenIndex) {
    const children = [];

    while (!isSymbol(tokens[tokenIndex], ')')) {
        const expression = parseExpression(tokens, tokenIndex);
        children.push(expression.node);
        tokenIndex = expression.nextTokenIndex;

        if (isSymbol(tokens[tokenIndex], ',')) {
            children.push(tokens[tokenIndex++]); // ,
        }
    }

    return {
        node: {type: 'expressionList', children},
        nextTokenIndex: tokenIndex
    };
}

module.exports = parse;
