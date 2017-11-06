const TreeNode = require("../base/TreeNode.js")

const GrammarBackedProgram = require("./GrammarBackedProgram.js")
const GrammarConstants = require("./GrammarConstants.js")
const AbstractGrammarDefinitionNode = require("./AbstractGrammarDefinitionNode.js")
const GrammarKeywordDefinitionNode = require("./GrammarKeywordDefinitionNode.js")

class GrammarRootNode extends AbstractGrammarDefinitionNode {
  _getDefaultParserClass() {
    // todo: return GrammarBackedProgram?s need to clean up a circular dep
  }
}

class GrammarProgram extends AbstractGrammarDefinitionNode {
  parseNodeType(line) {
    // for now, first node will be root node.
    if (this.length === 0) return GrammarRootNode
    return GrammarKeywordDefinitionNode
  }

  getTargetExtension() {
    return this._getGrammarRootNode().getTargetExtension()
  }

  getProgram() {
    return this
  }

  getRootParserClass() {
    return this._getGrammarRootNode().getParserClass()
  }

  setNodeClasses(obj) {
    // todo: remove
    this._rootNodeClasses = obj
    return this
  }

  getRootNodeClasses() {
    return this._rootNodeClasses
  }

  // todo: remove?
  getTheGrammarFilePath() {
    return this.getLine()
  }

  _getGrammarRootNode() {
    return this.nodeAt(0) // todo: fragile?
  }

  getExtensionName() {
    return this._getGrammarRootNode().getKeyword()
  }

  _getKeyWordsNode() {
    return this._getGrammarRootNode().getNode(GrammarConstants.keywords)
  }

  getDefinitionByKeywordPath(keywordPath) {
    const parts = keywordPath.split(" ")
    let subject = this
    let def
    while (parts.length) {
      const part = parts.shift()
      def = subject.getRunTimeKeywordMapWithDefinitions()[part]
      if (!def) def = subject._getCatchAllDefinition()
      subject = def
    }
    return def
  }

  getDocs() {
    return this.toString()
  }

  _initDefinitionCache() {
    if (this._cache_definitions) return undefined
    const definitionMap = {}

    this.getChildrenByNodeType(GrammarKeywordDefinitionNode).forEach(definitionNode => {
      definitionMap[definitionNode.getKeyword()] = definitionNode
    })

    this._cache_definitions = definitionMap
  }

  _getDefinitionCache() {
    this._initDefinitionCache()
    return this._cache_definitions
  }

  _getDefinitions() {
    return Object.values(this._getDefinitionCache())
  }

  _getRunTimeCatchAllKeyword() {
    return this._getGrammarRootNode().findBeam(GrammarConstants.catchAllKeyword)
  }

  toSublimeSyntaxFile() {
    // todo.
    return `%YAML 1.2
---
name: ${this.getExtensionName()}
file_extensions: [${this.getExtensionName()}]
scope: source.${this.getExtensionName()}

contexts:
 main:
   - match: (\A|^) *[^ ]+
     scope: storage.type.tree
     set: [parameters]

 parameters:
   - match: $
     scope: entity.name.type.tree
     pop: true`
  }

  static getParserClass(grammarCode, grammarPath) {
    // todo: catching
    const expandedGrammarCode = new TreeNode(grammarCode).getExpanded()
    const grammarProgram = new GrammarProgram(expandedGrammarCode, grammarPath)
    const extendedClass = grammarProgram.getRootParserClass() || GrammarBackedProgram
    return class extends extendedClass {
      getGrammarProgram() {
        return grammarProgram
      }
    }
  }
}

module.exports = GrammarProgram
