import TreeNode from "../base/TreeNode"
import TreeUtils from "../base/TreeUtils"
import { GrammarConstantsErrors, GrammarConstants } from "./GrammarConstants"
import AbstractRuntimeNode from "./AbstractRuntimeNode"
import types from "../types"

/*FOR_TYPES_ONLY*/ import GrammarProgram from "./GrammarProgram"

abstract class AbstractRuntimeProgram extends AbstractRuntimeNode {
  *getProgramErrorsIterator() {
    let line = 1
    for (let node of this.getTopDownArrayIterator()) {
      node._cachedLineNumber = line
      const errs = node.getErrors()
      delete node._cachedLineNumber
      if (errs.length) yield errs
      line++
    }
  }

  getProgramErrors(): types.ParseError[] {
    const errors: types.ParseError[] = []
    let line = 1
    for (let node of this.getTopDownArray()) {
      node._cachedLineNumber = line
      const errs: types.ParseError[] = node.getErrors()
      errs.forEach(err => errors.push(err))
      delete node._cachedLineNumber
      line++
    }
    this._getRequiredNodeErrors(errors)
    return errors
  }

  // Helper method for selecting potential nodeTypes needed to update grammar file.
  getInvalidNodeTypes(level: types.int = undefined) {
    return Array.from(
      new Set(
        this.getProgramErrors()
          .filter(err => err.kind === GrammarConstantsErrors.invalidNodeTypeError)
          .filter(err => (level ? level === err.level : true))
          .map(err => err.subkind)
      )
    )
  }

  getAllSuggestions() {
    return new TreeNode(
      this.getAllWordBoundaryCoordinates().map(coordinate => {
        const results = this.getAutocompleteResultsAt(coordinate.y, coordinate.x)
        return {
          line: coordinate.y,
          char: coordinate.x,
          word: results.word,
          suggestions: results.matches.map(m => m.text).join(" ")
        }
      })
    ).toTable()
  }

  getAutocompleteResultsAt(lineIndex: types.positiveInt, charIndex: types.positiveInt) {
    const lineNode = this.nodeAtLine(lineIndex) || this
    const nodeInScope = <AbstractRuntimeNode>lineNode.getNodeInScopeAtCharIndex(charIndex)

    // todo: add more tests
    // todo: second param this.childrenToString()
    // todo: change to getAutocomplete definitions

    const wordIndex = lineNode.getWordIndexAtCharacterIndex(charIndex)
    const wordProperties = lineNode.getWordProperties(wordIndex)
    return {
      startCharIndex: wordProperties.startCharIndex,
      endCharIndex: wordProperties.endCharIndex,
      word: wordProperties.word,
      matches: nodeInScope.getAutocompleteResults(wordProperties.word, wordIndex)
    }
  }

  getPrettified() {
    const nodeTypeOrder = this.getGrammarProgram().getNodeTypeOrder()
    const clone = this.clone()
    const isCondensed = this.getGrammarProgram().getGrammarName() === "grammar" // todo: generalize?
    clone._firstWordSort(nodeTypeOrder.split(" "), isCondensed ? TreeUtils.makeGraphSortFunction(1, 2) : undefined)

    return clone.toString()
  }

  getProgramErrorMessages() {
    return this.getProgramErrors().map(err => err.message)
  }

  getFirstWordMap() {
    return this.getDefinition().getRunTimeFirstWordMap()
  }

  getDefinition(): GrammarProgram {
    return this.getGrammarProgram()
  }

  getNodeTypeUsage(filepath = "") {
    // returns a report on what nodeTypes from its language the program uses
    const usage = new TreeNode()
    const grammarProgram = this.getGrammarProgram()
    const nodeTypeDefinitions = grammarProgram.getNodeTypeDefinitions()
    nodeTypeDefinitions.forEach(child => {
      usage.appendLine(
        [
          child.getNodeTypeIdFromDefinition(),
          "line-id",
          GrammarConstants.nodeType,
          child.getRequiredCellTypeNames().join(" ")
        ].join(" ")
      )
    })
    const programNodes = this.getTopDownArray()
    programNodes.forEach((programNode, lineNumber) => {
      const def = programNode.getDefinition()
      const stats = <TreeNode>usage.getNode(def.getNodeTypeIdFromDefinition())
      stats.appendLine([filepath + "-" + lineNumber, programNode.getWords().join(" ")].join(" "))
    })
    return usage
  }

  getInPlaceSyntaxTree() {
    return this.getTopDownArray()
      .map(child => child.getIndentation() + child.getLineSyntax())
      .join("\n")
  }

  getInPlaceHighlightScopeTree() {
    return this.getTopDownArray()
      .map(child => child.getIndentation() + child.getLineHighlightScopes())
      .join("\n")
  }

  getInPlaceSyntaxTreeWithNodeTypes() {
    return this.getTopDownArray()
      .map(child => child.constructor.name + this.getZI() + child.getIndentation() + child.getLineSyntax())
      .join("\n")
  }

  // todo: refine and make public
  protected _getSyntaxTreeHtml() {
    const getColor = (child: AbstractRuntimeNode) => {
      if (child.getLineSyntax().includes("error")) return "red"
      return "black"
    }
    const zip = (a1: string[], a2: string[]) => {
      let last = a1.length > a2.length ? a1.length : a2.length
      let parts = []
      for (let index = 0; index < last; index++) {
        parts.push(`${a1[index]}:${a2[index]}`)
      }
      return parts.join(" ")
    }
    return this.getTopDownArray()
      .map(
        child =>
          `<div style="white-space: pre;">${
            child.constructor.name
          } ${this.getZI()} ${child.getIndentation()} <span style="color: ${getColor(child)};">${zip(
            child.getLineSyntax().split(" "),
            child.getLine().split(" ")
          )}</span></div>`
      )
      .join("")
  }

  getTreeWithNodeTypes() {
    return this.getTopDownArray()
      .map(child => child.constructor.name + this.getZI() + child.getIndentation() + child.getLine())
      .join("\n")
  }

  getCellHighlightScopeAtPosition(lineIndex: number, wordIndex: number): types.highlightScope | undefined {
    this._initCellTypeCache()
    const typeNode = this._cache_highlightScopeTree.getTopDownArray()[lineIndex - 1]
    return typeNode ? typeNode.getWord(wordIndex - 1) : undefined
  }

  private _cache_programCellTypeStringMTime: number
  private _cache_highlightScopeTree: TreeNode
  private _cache_typeTree: TreeNode

  protected _initCellTypeCache(): void {
    const treeMTime = this.getTreeMTime()
    if (this._cache_programCellTypeStringMTime === treeMTime) return undefined

    this._cache_typeTree = new TreeNode(this.getInPlaceSyntaxTree())
    this._cache_highlightScopeTree = new TreeNode(this.getInPlaceHighlightScopeTree())
    this._cache_programCellTypeStringMTime = treeMTime
  }

  getCompiledProgramName(programPath: string) {
    const grammarProgram = this.getDefinition()
    return programPath.replace(`.${grammarProgram.getExtensionName()}`, `.${grammarProgram.getTargetExtension()}`)
  }
}

export default AbstractRuntimeProgram
