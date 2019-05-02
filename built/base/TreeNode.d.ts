import AbstractNode from "./AbstractNode.node";
import types from "../types";
declare type int = types.int;
declare type word = types.word;
declare type cellFn = (str: string, rowIndex: int, colIndex: int) => any;
declare type mapFn = (value: any, index: int, array: any[]) => any;
declare class ImmutableNode extends AbstractNode {
    constructor(children?: any, line?: string, parent?: ImmutableNode);
    private _uid;
    private _words;
    private _parent;
    private _children;
    private _line;
    private _index;
    execute(context: any): Promise<any[]>;
    getErrors(): types.ParseError[];
    getLineSyntax(): string;
    executeSync(context: any): any[];
    isNodeJs(): boolean;
    getOlderSiblings(): ImmutableNode[];
    protected _getClosestOlderSibling(): ImmutableNode | undefined;
    getYoungerSiblings(): ImmutableNode[];
    getSiblings(): any[];
    protected _getUid(): number;
    getParent(): ImmutableNode;
    getPoint(): types.point;
    protected _getPoint(relativeTo?: ImmutableNode): types.point;
    getPointRelativeTo(relativeTo?: ImmutableNode): types.point;
    getIndentation(relativeTo?: ImmutableNode): string;
    protected _getTopDownArray(arr: any): void;
    getTopDownArray(): types.treeNode[];
    getTopDownArrayIterator(): IterableIterator<types.treeNode>;
    nodeAtLine(lineNumber: types.positiveInt): TreeNode | undefined;
    getNumberOfLines(): int;
    protected _getLineNumber(target: ImmutableNode): number;
    isBlankLine(): boolean;
    hasDuplicateKeywords(): boolean;
    isEmpty(): boolean;
    protected _cachedLineNumber: int;
    protected _getYCoordinate(relativeTo?: ImmutableNode): any;
    isRoot(relativeTo?: ImmutableNode): boolean;
    getRootNode(): any;
    protected _getRootNode(relativeTo?: ImmutableNode): any;
    toString(indentCount?: number, language?: this): string;
    getWord(index: int): word;
    protected _toHtml(indentCount: int): string;
    protected _getWords(startFrom: int): string[];
    getWords(): word[];
    getWordsFrom(startFrom: int): string[];
    private _getWordIndexCharacterStartPosition;
    getNodeInScopeAtCharIndex(charIndex: types.positiveInt): ImmutableNode;
    getWordProperties(wordIndex: int): {
        startCharIndex: number;
        endCharIndex: number;
        word: string;
    };
    getAllWordBoundaryCoordinates(): any[];
    getWordBoundaryIndices(): types.positiveInt[];
    getWordIndexAtCharacterIndex(charIndex: types.positiveInt): int;
    getKeyword(): word;
    getContent(): string;
    getContentWithChildren(): string;
    getStack(): any;
    protected _getStack(relativeTo?: ImmutableNode): any;
    getStackString(): string;
    getLine(language?: ImmutableNode): string;
    getColumnNames(): word[];
    getOneHot(column: string): any;
    protected _getKeywordPath(relativeTo?: any): any;
    getKeywordPathRelativeTo(relativeTo?: ImmutableNode): types.keywordPath;
    getKeywordPath(): types.keywordPath;
    getPathVector(): types.pathVector;
    getPathVectorRelativeTo(relativeTo?: ImmutableNode): types.pathVector;
    protected _getPathVector(relativeTo?: any): types.pathVector;
    getIndex(): int;
    isTerminal(): boolean;
    protected _getLineHtml(): string;
    protected _getXmlContent(indentCount: any): string;
    protected _toXml(indentCount: any): string;
    protected _toObjectTuple(): Object[];
    protected _indexOfNode(needleNode: any): number;
    getSlice(startIndexInclusive: int, stopIndexExclusive: int): TreeNode;
    protected _hasColumns(columns: any): any;
    hasWord(index: int, word: string): boolean;
    getNodeByColumns(...columns: string[]): ImmutableNode;
    getNodeByColumn(index: int, name: string): ImmutableNode;
    protected _getNodesByColumn(index: int, name: word): ImmutableNode[];
    getChildrenFirstArray(): any[];
    protected _getChildrenFirstArray(arr: any): void;
    protected _getXCoordinate(relativeTo: any): any;
    getParentFirstArray(): any[];
    protected _getLevels(): any[];
    protected _getChildrenArray(): ImmutableNode[];
    protected _getChildren(): ImmutableNode[];
    getLines(): string[];
    getChildren(): any[];
    readonly length: types.positiveInt;
    protected _nodeAt(index: int): ImmutableNode;
    nodeAt(indexOrIndexArray: int | int[]): ImmutableNode | undefined;
    protected _toObject(): {};
    toHtml(): types.htmlString;
    protected _childrenToHtml(indentCount: int): string;
    protected _childrenToString(indentCount?: int, language?: this): string;
    childrenToString(): string;
    protected _getNodeJoinCharacter(): string;
    compile(targetExtension: types.fileExtension): string;
    toXml(): types.xmlString;
    toDisk(path: string): this;
    _lineToYaml(indentLevel: number, listTag?: string): string;
    _isYamlList(): boolean;
    toYaml(): string;
    _childrenToYaml(indentLevel: number): string[];
    _collapseYamlLine(): boolean;
    _toYamlListElement(indentLevel: number): string;
    _childrenToYamlList(indentLevel: number): string[];
    _toYamlAssociativeArrayElement(indentLevel: number): string;
    _childrenToYamlAssociativeArray(indentLevel: number): string[];
    _getDuplicateLinesMap(): types.stringMap;
    toJson(): types.jsonString;
    findNodes(keywordPath: types.keywordPath): any[];
    format(str: types.formatString): string;
    getColumn(path: word): string[];
    getFiltered(fn: types.filterFn): any;
    isLeafColumn(path: types.keywordPath): boolean;
    getNode(keywordPath: types.keywordPath): any;
    get(keywordPath: types.keywordPath): any;
    protected _getNodeByPath(keywordPath: any): any;
    getNext(): ImmutableNode;
    getPrevious(): ImmutableNode;
    protected _getUnionNames(): string[];
    getGraphByKey(key: word): ImmutableNode[];
    getGraph(thisColumnNumber: int, extendsColumnNumber: int): ImmutableNode[];
    protected _getGraph(getNodesByIdFn: (thisParentNode: ImmutableNode, id: word) => ImmutableNode[], getParentIdFn: (thisNode: ImmutableNode) => word, cannotContainNode: ImmutableNode): ImmutableNode[];
    pathVectorToKeywordPath(pathVector: types.pathVector): word[];
    toCsv(): string;
    toFlatTree(): any;
    protected _getTypes(header: any): any;
    toDataTable(header?: string[]): types.dataTable;
    toDelimited(delimiter: any, header?: string[]): string;
    protected _getMatrix(columns: any): any[];
    protected _toArrays(header: string[], cellFn: cellFn): {
        rows: any[];
        header: any[];
    };
    protected _toDelimited(delimiter: any, header: string[], cellFn: cellFn): string;
    toTable(): string;
    toFormattedTable(maxWidth: number, alignRight: boolean): string;
    protected _toTable(maxWidth: number, alignRight?: boolean): string;
    toSsv(): string;
    toOutline(): string;
    toMappedOutline(nodeFn: any): string;
    protected _toOutline(nodeFn: any): string;
    copyTo(node: any, index: int): any;
    split(keyword: types.word): ImmutableNode[];
    toMarkdownTable(): string;
    toMarkdownTableAdvanced(columns: word[], formatFn: any): string;
    toTsv(): string;
    getYI(): string;
    getZI(): string;
    getYIRegex(): RegExp;
    getXI(): string;
    protected _textToContentAndChildrenTuple(text: any): any[];
    protected _getLine(): string;
    protected _setLine(line?: string): this;
    protected _clearChildren(): this;
    protected _setChildren(content: any, circularCheckArray?: any[]): this;
    protected _setFromObject(content: any, circularCheckArray: any): this;
    protected _appendFromJavascriptObjectTuple(keyword: any, content: any, circularCheckArray: any): void;
    _setLineAndChildren(line: any, children?: any, index?: number): any;
    protected _parseString(str: string): this;
    protected _getIndex(): {
        [keyword: string]: number;
    };
    getContentsArray(): any[];
    getChildrenByNodeType(constructor: Function): any[];
    getNodeByType(constructor: Function): any;
    indexOfLast(keyword: word): int;
    indexOf(keyword: word): int;
    toObject(): Object;
    getKeywords(): word[];
    protected _makeIndex(startAt?: number): {
        [keyword: string]: number;
    };
    protected _childrenToXml(indentCount: any): string;
    protected _getIndentCount(str: any): number;
    clone(): any;
    has(keyword: word): boolean;
    protected _hasKeyword(keyword: any): boolean;
    protected _getKeywordByIndex(index: any): string;
    map(fn: mapFn): any[];
    filter(fn: types.filterFn): any[];
    find(fn: types.filterFn): any;
    forEach(fn: any): this;
    _clearIndex(): void;
    slice(start: int, end?: int): ImmutableNode[];
    getKeywordMap(): any;
    getCatchAllNodeConstructor(line: string): Function;
    getExpanded(thisColumnNumber: int, extendsColumnNumber: int): TreeNode;
    getInheritanceTree(): TreeNode;
    protected _getGrandParent(): ImmutableNode | undefined;
    getNodeConstructor(line: string): any;
    private static _uniqueId;
    static _makeUniqueId(): number;
    protected static _getFileFormat(path: string): string;
    static iris: string;
}
declare class TreeNode extends ImmutableNode {
    private _mtime;
    private _cmtime;
    getMTime(): int;
    protected _getChildrenMTime(): number;
    protected _getCMTime(): number;
    protected _setCMTime(value: any): this;
    getTreeMTime(): int;
    protected _expand(thisColumnNumber: int, extendsColumnNumber: int): TreeNode;
    macroExpand(macroDefKeyword: string, macroUsageKeyword: string): TreeNode;
    setChildren(children: any): this;
    protected _updateMTime(): void;
    insertWord(index: int, word: string): this;
    deleteDuplicates(): this;
    setWord(index: int, word: string): this;
    deleteChildren(): this;
    setContent(content: string): any;
    setContentWithChildren(text: string): any;
    setKeyword(keyword: word): this;
    setLine(line: string): this;
    duplicate(): any;
    destroy(): void;
    set(keywordPath: types.keywordPath, text: string): any;
    setFromText(text: string): this;
    appendLine(line: string): any;
    appendLineAndChildren(line: string, children: types.something): any;
    getNodesByRegex(regex: RegExp | RegExp[]): ImmutableNode[];
    getNodesByLinePrefixes(columns: string[]): any[];
    protected _getNodesByLineRegex(matches: ImmutableNode[], regs: RegExp[]): void;
    concat(node: string | ImmutableNode): any[];
    protected _deleteByIndexes(indexesToDelete: int[]): this;
    protected _deleteNode(node: ImmutableNode): 0 | this;
    reverse(): this;
    shift(): any;
    sort(fn: types.sortFn): this;
    invert(): this;
    protected _rename(oldKeyword: any, newKeyword: any): this;
    remap(map: Object): this;
    rename(oldKeyword: word, newKeyword: word): this;
    renameAll(oldName: word, newName: word): this;
    protected _deleteAllChildNodesWithKeyword(keyword: word): this;
    delete(keyword?: string): any;
    deleteColumn(keyword?: string): this;
    extend(nodeOrStr: any): this;
    replaceNode(fn: any): any[];
    insertLineAndChildren(line: string, children: types.something, index: int): any;
    insertLine(line: string, index: int): any;
    prependLine(line: string): any;
    pushContentAndChildren(content?: types.line, children?: types.something): any;
    deleteBlanks(): this;
    keywordSort(keywordOrder: types.word[]): this;
    protected _keywordSort(keywordOrder: types.word[], secondarySortFn?: types.sortFn): this;
    protected _touchNode(keywordPathArray: any): this;
    protected _touchNodeByString(str: any): this;
    touchNode(str: types.keywordPath): this;
    sortByColumns(indexOrIndices: any): this;
    shiftLeft(): TreeNode;
    shiftRight(): TreeNode;
    shiftYoungerSibsRight(): TreeNode;
    sortBy(nameOrNames: any): this;
    static fromCsv(str: string): TreeNode;
    static fromJson(str: types.jsonString): TreeNode;
    static fromSsv(str: string): TreeNode;
    static fromTsv(str: string): TreeNode;
    static fromDelimited(str: string, delimiter: string, quoteChar: string): TreeNode;
    static _getEscapedRows(str: any, delimiter: any, quoteChar: any): any;
    static fromDelimitedNoHeaders(str: string, delimiter: string, quoteChar: string): TreeNode;
    static _strToRows(str: any, delimiter: any, quoteChar: any, newLineChar?: string): any[][];
    static multiply(nodeA: any, nodeB: any): any;
    static _rowsToTreeNode(rows: any, delimiter: any, hasHeaders: any): TreeNode;
    private static _xmlParser;
    static _initializeXmlParser(): void;
    static fromXml(str: string): any;
    static _zipObject(keys: any, values: any): {};
    static fromShape(shapeArr: int[], rootNode?: TreeNode): TreeNode;
    static fromDataTable(table: types.dataTable): TreeNode;
    static _parseXml2(str: any): HTMLDivElement;
    static _treeNodeFromXml(xml: any): TreeNode;
    static _getHeader(rows: any, hasHeaders: any): any;
    static nest(str: string, xValue: int): string;
    static fromDisk(path: string): any;
}
export default TreeNode;
