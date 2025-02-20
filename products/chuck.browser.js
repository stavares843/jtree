{
  class chuckNode extends GrammarBackedNode {
    createParser() {
      return new TreeNode.Parser(this._getBlobNodeCatchAllNodeType(), undefined, [
        { regex: /\+/, nodeConstructor: addNode },
        { regex: /\*/, nodeConstructor: multiplyNode },
        { regex: /print/, nodeConstructor: printNode },
        { regex: /^[\d\. ]+$/, nodeConstructor: onlyNumbersNode }
      ])
    }
    static cachedHandGrammarProgramRoot = new HandGrammarProgram(`todo Make this compile and execute
operatorCell
 highlightScope keyword
 enum + * print
floatCell
chuckNode
 description A useless demo Tree Language inspired by Forth that tests postfix notation.
 root
 inScope abstractOperatorNode onlyNumbersNode
abstractOperatorNode
 catchAllCellType floatCell
 cells operatorCell
 cellParser postfix
addNode
 extends abstractOperatorNode
 pattern \\+
multiplyNode
 extends abstractOperatorNode
 pattern \\*
printNode
 extends abstractOperatorNode
 pattern print
onlyNumbersNode
 catchAllCellType floatCell
 pattern ^[\\d\\. ]+$`)
    getHandGrammarProgram() {
      return this.constructor.cachedHandGrammarProgramRoot
    }
    static getNodeTypeMap() {
      return {
        chuckNode: chuckNode,
        abstractOperatorNode: abstractOperatorNode,
        addNode: addNode,
        multiplyNode: multiplyNode,
        printNode: printNode,
        onlyNumbersNode: onlyNumbersNode
      }
    }
  }

  class abstractOperatorNode extends GrammarBackedNode {
    get operatorCell() {
      return this.getWord(0)
    }
    get floatCell() {
      return this.getWordsFrom(1).map(val => parseFloat(val))
    }
  }

  class addNode extends abstractOperatorNode {}

  class multiplyNode extends abstractOperatorNode {}

  class printNode extends abstractOperatorNode {}

  class onlyNumbersNode extends GrammarBackedNode {
    get floatCell() {
      return this.getWordsFrom(0).map(val => parseFloat(val))
    }
  }

  window.chuckNode = chuckNode
}
