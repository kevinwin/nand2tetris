const documentEntities = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;'
};

const getEntityValue = value => documentEntities.hasOwnProperty(value) ? documentEntities[value] : value;

const convertTokenToXml = token => `<${token.type}> ${getEntityValue(token.value)} </${token.type}>`;

const convertTokens = tokens => 
    `<tokens>
    ${tokens.map(convertTokenToXml).join('\n')}
    </tokens>`;

const pad = depth => ' '.repeat(depth);

const convertLeafNode = (node, depth) => pad(depth) + convertTokenToXml(node);

const convertNonLeafNode = (node, depth) => {
    const padding = pad(depth);
    let xml = `${padding}<${node.type}>`;
    if (node.children.length) {
        xml += `\n${node.children.map(child => convertNode(child, depth + 1)).join('\n')}`;
    }
    xml += `\n${padding}</${node.type}>`
    return xml;
};

const convertNode = (node, depth) => node.hasOwnProperty('value') ? convertLeafNode(node, depth) : convertNonLeafNode(node, depth);

const convertToXml = tree => `${convertNode(tree, 0)}\n`

module.exports = convertToXml;
