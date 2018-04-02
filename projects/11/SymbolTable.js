class SymbolTable {
    constructor() {
        this.classScope = new Map();
        this.startSubroutine();
    }

    startSubroutine(type) {
        this.subroutineScope = new Map();
        this.subroutineType = type;
        this.nextLabelIndex = 0;
    }

    has(name) {
        return this.subroutineScope.has(name) || this.classScope.has(name);
    }

    get(name) {
        return this.subroutineScope.has(name) ?
            this.subroutineScope.get(name) :
            this.classScope.get(name);
    }

    mapForKind(kind) {
        switch (kind) {
            case 'static':
            case 'field':
                return this.classScope;

            case 'argument':
            case 'var':
                return this.subroutineScope;
        }
    }

    count(kind) {
        let count = kind === 'argument' && this.subroutineType === 'method' ? 1 : 0;

        for (const properties of this.mapForKind(kind).values()) {
            if (properties.kind === kind) {
                count++;
            }
        }

        return count;
    }

    set(name, {kind, type}) {
        const properties = {kind, type, index: this.count(kind)};
        this.mapForKind(kind).set(name, properties);
    }
}

module.exports = SymbolTable;
