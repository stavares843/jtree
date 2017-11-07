"use strict"
class AbstractNode {
  _getNow() {
    return performance.now()
  }
}

class TreeUtils {
  static getPathWithoutFileName(path) {
    const parts = path.split("/") // todo: change for windows?
    parts.pop()
    return parts.join("/")
  }

  static getClassNameFromFilePath(filename) {
    return filename
      .replace(/\.[^\.]+$/, "")
      .split("/")
      .pop()
  }

  static getFileExtension(url = "") {
    url = url.match(/\.([^\.]+)$/)
    return (url && url[1]) || ""
  }

  static formatStr(str, listDelimiter = " ", parameterMap) {
    return str.replace(/{([^\}]+)}/g, (match, path) => {
      const isList = path.endsWith("*")
      const typePath = path.replace("*", "")
      const arr = parameterMap[typePath]
      if (!arr) return ""
      const word = isList ? arr.join(listDelimiter) : arr.shift()
      return word
    })
  }

  static stripHtml(text) {
    return text && text.replace ? text.replace(/<(?:.|\n)*?>/gm, "") : text
  }

  static getUniqueWordsArray(allWords) {
    const words = allWords.replace(/\n/g, " ").split(" ")
    const index = {}
    words.forEach(word => {
      if (!index[word]) index[word] = 0
      index[word]++
    })
    return Object.keys(index).map(key => {
      return {
        word: key,
        count: index[key]
      }
    })
  }

  static mapValues(object, fn) {
    const result = {}
    Object.keys(object).forEach(key => {
      result[key] = fn(key)
    })
    return result
  }

  static sortByAccessor(accessor) {
    return (objectA, objectB) => {
      const av = accessor(objectA)
      const bv = accessor(objectB)
      let result = av < bv ? -1 : av > bv ? 1 : 0
      if (av === undefined && bv !== undefined) result = -1
      else if (bv === undefined && av !== undefined) result = 1
      return result
    }
  }
}

window.TreeUtils = TreeUtils




class ImmutableNode extends AbstractNode {
  constructor(children, line, parent) {
    super()
    this._parent = parent
    this._setLine(line)
    this._setChildren(children)
  }

  execute(context) {
    return Promise.all(this.getChildren().map(child => child.execute(context)))
  }

  getErrors() {
    return []
  }

  getWordTypeLine() {
    return "any ".repeat(this.getWords().length).trim()
  }

  executeSync(context) {
    return this.getChildren().map(child => child.executeSync(context))
  }

  isNodeJs() {
    return typeof exports !== "undefined"
  }

  getOlderSiblings() {
    return this.getParent()
      .getChildren()
      .slice(0, this.getIndex())
  }

  getYoungerSiblings() {
    return this.getParent()
      .getChildren()
      .slice(this.getIndex() + 1)
  }

  getSiblings() {
    return this.getParent()
      .getChildren()
      .filter(node => node !== this)
  }

  _getUid() {
    if (!this._uid) this._uid = ImmutableNode._makeUniqueId()
    return this._uid
  }

  // todo: rename getMother? grandMother et cetera?
  getParent() {
    return this._parent
  }

  getPoint(relativeTo) {
    return {
      x: this._getXCoordinate(relativeTo),
      y: this._getYCoordinate(relativeTo)
    }
  }

  getIndentation(relativeTo) {
    return this.getXI().repeat(this._getXCoordinate(relativeTo) - 1)
  }

  _getYCoordinate(relativeTo) {
    return this.isRoot(relativeTo)
      ? 0
      : this.getRootNode(relativeTo)
          .getTopDownArray()
          .indexOf(this) + 1 // todo: may be slow for big trees.
  }

  isRoot(relativeTo) {
    return relativeTo === this || !this.getParent()
  }

  getRootNode(relativeTo) {
    if (this.isRoot(relativeTo)) return this
    return this.getParent().getRootNode(relativeTo)
  }

  toString(indentCount = 0, language = this) {
    if (this.isRoot()) return this._childrenToString(indentCount, language)
    const content = language.getXI().repeat(indentCount) + this.getLine(language)
    const value = content + (this.length ? language.getYI() + this._childrenToString(indentCount + 1, language) : "")
    return value
  }

  getRest() {
    return this.getWords().slice(1)
  }

  getWord(index) {
    const words = this._getLine().split(this.getZI())
    if (index < 0) index = words.length + index
    return words[index]
  }

  _toHtml(indentCount) {
    const path = this.getPathVector().join(" ")
    const classes = {
      nodeLine: "nodeLine",
      xi: "xIncrement",
      yi: "yIncrement",
      nodeChildren: "nodeChildren"
    }
    const edge = this.getXI().repeat(indentCount)
    // Set up the keyword part of the node
    const edgeHtml = `<span class="${classes.nodeLine}" data-pathVector="${path}"><span class="${classes.xi}">${edge}</span>`
    const lineHtml = this._getLineHtml()
    const childrenHtml = this.length
      ? `<span class="${classes.yi}">${this.getYI()}</span>` +
        `<span class="${classes.nodeChildren}">${this._childrenToHtml(indentCount + 1)}</span>`
      : ""

    return `${edgeHtml}${lineHtml}${childrenHtml}</span>`
  }

  getWords(startFrom = 0) {
    if (!this._words) this._words = this._getLine().split(this.getZI())
    return startFrom ? this._words.slice(startFrom) : this._words
  }

  getKeyword() {
    return this.getWords()[0]
  }

  getBeam() {
    const words = this.getWords(1)
    return words.length ? words.join(this.getZI()) : undefined
  }

  getBeamWithChildren() {
    // todo: deprecate
    const beam = this.getBeam()
    return (beam ? beam : "") + (this.length ? this.getYI() + this._childrenToString() : "")
  }

  getStack(relativeTo) {
    if (this.isRoot(relativeTo)) return []
    const parent = this.getParent()
    if (parent.isRoot(relativeTo)) return [this]
    else return parent.getStack(relativeTo).concat([this])
  }

  getStackString(relativeTo) {
    return this.getStack(relativeTo)
      .map((node, index) => this.getXI().repeat(index) + node.getLine())
      .join(this.getYI())
  }

  getLine(language = this) {
    return this.getWords().join(language.getZI())
  }

  // todo: return array? getPathArray?
  getKeywordPath(relativeTo) {
    if (this.isRoot(relativeTo)) return ""
    else if (this.getParent().isRoot(relativeTo)) return this.getKeyword()

    return this.getParent().getKeywordPath(relativeTo) + this.getXI() + this.getKeyword()
  }

  getPathVector(relativeTo) {
    if (this.isRoot(relativeTo)) return []
    const path = this.getParent().getPathVector(relativeTo)
    path.push(this.getIndex())
    return path
  }

  getIndex() {
    return this.getParent()._indexOfNode(this)
  }

  isTerminal() {
    return !this.length
  }

  _getLineHtml() {
    return this.getWords()
      .map((word, index) => `<span class="word${index ? "" : " keyword"}">${TreeUtils.stripHtml(word)}</span>`)
      .join(`<span class="zIncrement">${this.getZI()}</span>`)
  }

  _getXmlContent(indentCount) {
    if (this.getBeam() !== undefined) return this.getBeamWithChildren()
    return this.length
      ? `${indentCount === -1 ? "" : "\n"}${this._childrenToXml(indentCount > -1 ? indentCount + 2 : -1)}${" ".repeat(
          indentCount
        )}`
      : ""
  }

  _toXml(indentCount) {
    const indent = " ".repeat(indentCount)
    const tag = this.getKeyword()
    return `${indent}<${tag}>${this._getXmlContent(indentCount)}</${tag}>${indentCount === -1 ? "" : "\n"}`
  }

  _toObjectTuple() {
    const beam = this.getBeam()
    const length = this.length
    const hasChildrenNoBeam = beam === undefined && length
    const hasBeamAndHasChildren = beam !== undefined && length
    // If the node has a beam and a subtree return it as a string, as
    // Javascript object values can't be both a leaf and a tree.
    const tupleValue = hasChildrenNoBeam ? this.toObject() : hasBeamAndHasChildren ? this.getBeamWithChildren() : beam
    return [this.getKeyword(), tupleValue]
  }

  _indexOfNode(needleNode) {
    let result = -1
    this.getChildren().find((node, index) => {
      if (node === needleNode) {
        result = index
        return true
      }
    })
    return result
  }

  getTopDownArray() {
    const arr = []
    this._getTopDownArray(arr)
    return arr
  }

  _hasColumns(columns) {
    const words = this.getWords()
    return columns.every((searchTerm, index) => searchTerm === words[index])
  }

  getNodeByColumns(...columns) {
    return this.getTopDownArray().find(node => node._hasColumns(columns))
  }

  _getTopDownArray(arr) {
    this.getChildren().forEach(child => {
      arr.push(child)
      child._getTopDownArray(arr)
    })
  }

  getChildrenFirstArray() {
    const arr = []
    this._getChildrenFirstArray(arr)
    return arr
  }

  _getChildrenFirstArray(arr) {
    this.getChildren().forEach(child => {
      child._getChildrenFirstArray(arr)
      arr.push(child)
    })
  }

  _getXCoordinate(relativeTo) {
    return this.getStack(relativeTo).length
  }

  getParentFirstArray() {
    const levels = this._getLevels()
    const arr = []
    levels.forEach(level => {
      level.forEach(item => arr.push(item))
    })
    return arr
  }

  _getLevels() {
    const levels = []
    this.getTopDownArray().forEach(node => {
      const level = node._getXCoordinate()
      if (!levels[level]) levels[level] = []
      levels[level].push(node)
    })
    return levels
  }

  _getChildren() {
    if (!this._children) this._children = []
    return this._children
  }

  getLines() {
    return this._getChildren().map(node => node.getLine())
  }

  getChildren() {
    return this._getChildren()
  }

  get length() {
    return this.getChildren().length
  }

  _nodeAt(index) {
    if (index < 0) index = this.length + index
    return this.getChildren()[index]
  }

  nodeAt(indexOrArray) {
    const type = typeof indexOrArray
    if (type === "number") return this._nodeAt(indexOrArray)

    if (indexOrArray.length === 1) return this._nodeAt(indexOrArray[0])

    const first = indexOrArray[0]
    const node = this._nodeAt(first)
    if (!node) return undefined
    return node.nodeAt(indexOrArray.slice(1))
  }

  _toObject() {
    const obj = {}
    this._getChildren().forEach(node => {
      const tuple = node._toObjectTuple()
      obj[tuple[0]] = tuple[1]
    })
    return obj
  }

  toHtml() {
    return this._childrenToHtml(0)
  }

  _childrenToHtml(indentCount) {
    return this.getChildren()
      .map(node => node._toHtml(indentCount))
      .join(`<span class="yIncrement">${this.getYI()}</span>`)
  }

  _childrenToString(indentCount, language = this) {
    return this.getChildren()
      .map(node => node.toString(indentCount, language))
      .join(language.getYI())
  }

  childrenToString() {
    return this._childrenToString()
  }

  // todo: implement
  _getNodeJoinCharacter() {
    return "\n"
  }

  compile(targetExtension) {
    return this.getChildren()
      .map(child => child.compile(targetExtension))
      .join(this._getNodeJoinCharacter())
  }

  toXml() {
    return this._childrenToXml(0)
  }

  toJson() {
    return JSON.stringify(this.toObject(), null, " ")
  }

  findNodes(keywordPath) {
    return this._getChildren().filter(node => {
      if (node.getKeyword() === keywordPath) return true
      return false
    })
  }

  format(str) {
    const that = this
    return str.replace(/{([^\}]+)}/g, (match, path) => {
      const node = that.getNode(path)
      return node ? node.getBeam() : ""
    })
  }

  getColumn(path) {
    return this._getChildren().map(node => {
      const cell = node.getNode(path)
      return cell === undefined ? undefined : cell.getBeam()
    })
  }

  getNode(keywordPath) {
    return this._getNodeByPath(keywordPath)
  }

  findBeam(keywordPath) {
    const node = this._getNodeByPath(keywordPath)
    return node === undefined ? undefined : node.getBeam()
  }

  _getNodeByPath(keywordPath) {
    const xi = this.getXI()
    if (!keywordPath.includes(xi)) {
      const index = this.indexOfLast(keywordPath)
      return index === -1 ? undefined : this._nodeAt(index)
    }

    const parts = keywordPath.split(xi)
    const current = parts.shift()
    const currentNode = this.getChildren()[this._getIndex()[current]]
    return currentNode ? currentNode._getNodeByPath(parts.join(xi)) : undefined
  }

  getNext() {
    if (this.isRoot()) return this
    const index = this.getIndex()
    const parent = this.getParent()
    const length = parent.length
    const next = index + 1
    return next === length ? parent.getChildren()[0] : parent.getChildren()[next]
  }

  getPrevious() {
    if (this.isRoot()) return this
    const index = this.getIndex()
    const parent = this.getParent()
    const length = parent.length
    const prev = index - 1
    return prev === -1 ? parent.getChildren()[length - 1] : parent.getChildren()[prev]
  }

  _getUnionNames() {
    if (!this.length) return []

    const obj = {}
    this._getChildren().forEach(node => {
      if (!node.length) return undefined
      node._getChildren().forEach(node => {
        obj[node.getKeyword()] = 1
      })
    })
    return Object.keys(obj)
  }

  getGraph(key) {
    const graph = this._getGraph(key)
    graph.push(this)
    return graph
  }

  _getGraph(key) {
    const name = key ? this.findBeam(key) : this.getWord(1)
    if (!name) return []
    const parentNode = this.getParent().getNode(name)
    if (!parentNode) throw new Error(`"${this.getLine()} tried to extend "${name}" but "${name}" not found.`)
    const graph = parentNode._getGraph(key)
    graph.push(parentNode)
    return graph
  }

  pathVectorToKeywordPath(pathVector) {
    const path = pathVector.slice() // copy array
    const names = []
    let node = this
    while (path.length) {
      if (!node) return names
      names.push(node.nodeAt(path[0]).getKeyword())
      node = node.nodeAt(path.shift())
    }
    return names
  }

  toCsv() {
    return this.toDelimited(",")
  }

  toDelimited(delimiter, header) {
    const regex = new RegExp(`(\\n|\\"|\\${delimiter})`)
    const cellFn = (str, row, column) => (!str.toString().match(regex) ? str : `"` + str.replace(/\"/g, `""`) + `"`)
    header = header || this._getUnionNames()
    return this._toDelimited(delimiter, header, cellFn)
  }

  _toDelimited(delimiter, header, cellFn) {
    const headerRow = header.map((columnName, index) => cellFn(columnName, 0, index)).join(delimiter)
    const rows = this._getChildren().map((node, rowNumber) => {
      return header
        .map((columnName, index) => {
          const childNode = node.getNode(columnName)
          const beam = childNode ? childNode.getBeamWithChildren() : ""
          return cellFn(beam, rowNumber + 1, index)
        })
        .join(delimiter)
    })
    return headerRow + "\n" + rows.join("\n")
  }

  toTable(maxWidth = 100, alignRight = false) {
    return this._toTable(maxWidth, alignRight)
  }

  _toTable(maxWidth, alignRight = false) {
    const header = this._getUnionNames()
    const widths = header.map(col => (col.length > maxWidth ? maxWidth : col.length))

    this._getChildren().forEach(node => {
      if (!node.length) return true
      header.forEach((col, index) => {
        const cellValue = node.getNode(col).getBeam()
        if (!cellValue) return true
        const length = cellValue.toString().length
        if (length > widths[index]) widths[index] = length > maxWidth ? maxWidth : length
      })
    })

    const cellFn = (cellText, row, col) => {
      const width = widths[col]
      // Strip newlines in fixedWidth output
      const cellValue = cellText.toString().replace(/\n/g, "\\n")
      const cellLength = cellValue.length
      if (cellLength > width) {
        return cellValue.substr(0, width)
      }
      const padding = " ".repeat(width - cellLength)
      return alignRight ? padding + cellValue : cellValue + padding
    }
    return this._toDelimited(" ", header, cellFn)
  }

  toSsv() {
    return this.toDelimited(" ")
  }

  toOutline(nodeFn) {
    return this._toOutline(nodeFn)
  }

  // Adapted from: https://github.com/notatestuser/treeify.js
  _toOutline(nodeFn = node => node.getLine()) {
    const growBranch = (outlineTreeNode, last, lastStates, nodeFn, callback) => {
      let lastStatesCopy = lastStates.slice(0)
      const node = outlineTreeNode.node

      if (lastStatesCopy.push([outlineTreeNode, last]) && lastStates.length > 0) {
        let line = ""
        // keywordd on the "was last element" states of whatever we're nested within,
        // we need to append either blankness or a branch to our line
        lastStates.forEach((lastState, idx) => {
          if (idx > 0) line += lastState[1] ? " " : "│"
        })

        // the prefix varies keywordd on whether the key contains something to show and
        // whether we're dealing with the last element in this collection
        // the extra "-" just makes things stand out more.
        line += (last ? "└" : "├") + nodeFn(node)
        callback(line)
      }

      if (!node) return

      const length = node.length
      let index = 0
      node._getChildren().forEach(node => {
        let lastKey = ++index === length

        growBranch({ node: node }, lastKey, lastStatesCopy, nodeFn, callback)
      })
    }

    let output = ""
    growBranch({ node: this }, false, [], nodeFn, line => (output += line + "\n"))
    return output
  }

  copyTo(node, index) {
    const newNode = node._setLineAndChildren(
      this.getLine(),
      this.childrenToString(),
      index === undefined ? node.length : index
    )
    return newNode
  }

  toTsv() {
    return this.toDelimited("\t")
  }

  getYI() {
    return "\n"
  }

  getZI() {
    return " "
  }

  getYIRegex() {
    return new RegExp(this.getYI(), "g")
  }

  getXI() {
    return " "
  }

  _textToBeamAndChildrenTuple(text) {
    const lines = text.split(this.getYIRegex())
    const firstLine = lines.shift()
    const children = !lines.length
      ? undefined
      : lines
          .map(line => (line.substr(0, 1) === this.getXI() ? line : this.getXI() + line))
          .map(line => line.substr(1))
          .join(this.getYI())
    return [firstLine, children]
  }

  _getLine() {
    return this._line
  }

  _setLine(line = "") {
    this._line = line
    if (this._words) delete this._words
    return this
  }

  _clearChildren() {
    delete this._children
  }

  _setChildren(content, circularCheckArray) {
    this._clearChildren()
    if (!content) return this

    // set from string
    if (typeof content === "string") return this._parseString(content)

    // set from tree object
    if (content instanceof ImmutableNode) {
      const me = this
      content._getChildren().forEach(node => {
        me._setLineAndChildren(node.getLine(), node.childrenToString())
      })
      return this
    }

    // If we set from object, create an array of inserted objects to avoid circular loops
    if (!circularCheckArray) circularCheckArray = [content]

    return this._setFromObject(content, circularCheckArray)
  }

  _setFromObject(content, circularCheckArray) {
    for (let keyword in content) {
      if (!content.hasOwnProperty(keyword)) continue
      this._appendFromJavascriptObjectTuple(keyword, content[keyword], circularCheckArray)
    }

    return this
  }

  // todo: refactor the below.
  _appendFromJavascriptObjectTuple(keyword, beam, circularCheckArray) {
    const type = typeof beam
    let line
    let children
    if (beam === null) line = keyword + " " + null
    else if (beam === undefined) line = keyword
    else if (type === "string") {
      const tuple = this._textToBeamAndChildrenTuple(beam)
      line = keyword + " " + tuple[0]
      children = tuple[1]
    } else if (type !== "object") line = keyword + " " + beam
    else if (beam instanceof Date) line = keyword + " " + beam.getTime().toString()
    else if (beam instanceof TreeNode) {
      line = keyword
      children = new TreeNode(beam.childrenToString(), beam.getLine())
    } else if (type === "function") line = keyword + " " + beam.toString()
    else if (circularCheckArray.indexOf(beam) === -1) {
      circularCheckArray.push(beam)
      line = keyword
      const length = beam instanceof Array ? beam.length : Object.keys(beam).length
      if (length) children = new TreeNode()._setChildren(beam, circularCheckArray)
    } else {
      // iirc this is return early from circular
      return
    }
    this._setLineAndChildren(line, children)
  }

  _setLineAndChildren(line, children, index = this.length) {
    const jsNodeClass = this.parseNodeType(line)
    const parsedNode = new jsNodeClass(children, line, this)
    const adjustedIndex = index < 0 ? this.length + index : index

    this.getChildren().splice(adjustedIndex, 0, parsedNode)

    if (this._index) this._makeIndex(adjustedIndex)
    return parsedNode
  }

  _parseString(str) {
    if (!str) return this
    const lines = str.split(this.getYIRegex())
    const parentStack = []
    let currentIndentCount = -1
    let lastNode = this
    lines.forEach(line => {
      const indentCount = this._getIndentCount(line)
      if (indentCount > currentIndentCount) {
        currentIndentCount++
        parentStack.push(lastNode)
      } else if (indentCount < currentIndentCount) {
        // pop things off stack
        while (indentCount < currentIndentCount) {
          parentStack.pop()
          currentIndentCount--
        }
      }
      const lineContent = line.substr(currentIndentCount)
      const parent = parentStack[parentStack.length - 1]
      const jsNodeClass = parent.parseNodeType(lineContent)
      lastNode = new jsNodeClass(undefined, lineContent, parent)
      parent._getChildren().push(lastNode)
    })
    return this
  }

  _getIndex() {
    // StringMap<int> {keyword: index}
    // When there are multiple tails with the same keyword, _index stores the last beam.
    return this._index || this._makeIndex()
  }

  getBeams() {
    return this.getChildren().map(node => node.getBeam())
  }

  getChildrenByNodeType(type) {
    return this.getChildren().filter(child => child instanceof type)
  }

  getNodeByType(type) {
    return this.getChildren().find(child => child instanceof type)
  }

  indexOfLast(keyword) {
    const result = this._getIndex()[keyword]
    return result === undefined ? -1 : result
  }

  indexOf(keyword) {
    if (!this.has(keyword)) return -1

    const length = this.length
    const nodes = this.getChildren()

    for (let index = 0; index < length; index++) {
      if (nodes[index].getKeyword() === keyword) return index
    }
    return -1
  }

  toObject() {
    return this._toObject()
  }

  getKeywords() {
    return this._getChildren().map(node => node.getKeyword())
  }

  _makeIndex(startAt = 0) {
    if (!this._index || !startAt) this._index = {}
    const nodes = this.getChildren()
    const newIndex = this._index
    const length = nodes.length

    for (let index = startAt; index < length; index++) {
      newIndex[nodes[index].getKeyword()] = index
    }

    return newIndex
  }

  _childrenToXml(indentCount) {
    return this.getChildren()
      .map(node => node._toXml(indentCount))
      .join("")
  }

  _getIndentCount(str) {
    let level = 0
    const edgeChar = this.getXI()
    while (str[level] === edgeChar) {
      level++
    }
    return level
  }

  clone() {
    return new this.constructor(this.childrenToString(), this.getLine())
  }

  // todo: rename to hasKeyword
  has(keyword) {
    return this._hasKeyword(keyword)
  }

  _hasKeyword(keyword) {
    return this._getIndex()[keyword] !== undefined
  }

  _getKeywordByIndex(index) {
    // Passing -1 gets the last item, et cetera
    const length = this.length

    if (index < 0) index = length + index
    if (index >= length) return undefined
    return this.getChildren()[index].getKeyword()
  }

  getKeywordMap() {
    return {}
  }

  getCatchAllNodeClass(line) {
    return this.constructor
  }

  parseNodeType(line) {
    return this.getKeywordMap()[line.split(" ")[0]] || this.getCatchAllNodeClass(line)
  }

  static _makeUniqueId() {
    if (this._uniqueId === undefined) this._uniqueId = 0
    this._uniqueId++
    return this._uniqueId
  }
}

class TreeNode extends ImmutableNode {
  getMTime() {
    if (!this._mtime) this._updateMTime()
    return this._mtime
  }

  _getChildrenMTime() {
    const mTimes = this.getChildren().map(child => child.getTreeMTime())
    const cmTime = this._getCMTime()
    if (cmTime) mTimes.push(cmTime)
    const newestTime = Math.max.apply(null, mTimes)
    return this._setCMTime(newestTime || this._getNow())._getCMTime()
  }

  _getCMTime() {
    return this._cmtime
  }

  _setCMTime(value) {
    this._cmtime = value
    return this
  }

  getTreeMTime() {
    const mtime = this.getMTime()
    const cmtime = this._getChildrenMTime()
    return Math.max(mtime, cmtime)
  }

  _clearIndex() {
    delete this._index
  }

  getInheritanceTree() {
    const paths = {}
    const result = new TreeNode()
    this.getChildren().forEach(node => {
      const key = node.getWord(0)
      const parentKey = node.getWord(1)
      const parentPath = paths[parentKey]
      paths[key] = parentPath ? [parentPath, key].join(" ") : key
      result.touchNode(paths[key])
    })
    return result
  }

  _expand() {
    const graph = this.getGraph()
    const result = new TreeNode()
    graph.forEach(node => result.extend(node))
    return new TreeNode().append(this.getLine(), result)
  }

  getExpanded() {
    return this.getChildren()
      .map(child => child._expand())
      .join("\n")
  }

  setChildren(children) {
    return this._setChildren(children)
  }

  _updateMTime() {
    this._mtime = this._getNow()
  }

  setWord(index, word) {
    const wi = this.getZI()
    const words = this._getLine().split(wi)
    words[index] = word
    this.setLine(words.join(wi))
    return this
  }

  setBeam(beam) {
    if (beam === this.getBeam()) return this
    const newArray = [this.getKeyword()]
    if (beam !== undefined) {
      beam = beam.toString()
      if (beam.match(this.getYI())) return this.setBeamWithChildren(beam)
      newArray.push(beam)
    }
    this._updateMTime()
    return this._setLine(newArray.join(this.getZI()))
  }

  setBeamWithChildren(text) {
    // todo: deprecate
    if (!text.includes(this.getYI())) {
      this._clearChildren()
      return this.setBeam(text)
    }

    const lines = text.split(this.getYIRegex())
    const firstLine = lines.shift()
    this.setBeam(firstLine)

    // tood: cleanup.
    const remainingString = lines.join(this.getYI())
    const children = new TreeNode(remainingString)
    if (!remainingString) children.append("")
    this.setChildren(children)
    return this
  }

  setKeyword(keyword) {
    return this.setWord(0, keyword)
  }

  setLine(line) {
    if (line === this.getLine()) return this
    this._updateMTime()
    // todo: clear parent TMTimes
    this.getParent()._clearIndex()
    return this._setLine(line)
  }

  duplicate() {
    return this.getParent()._setLineAndChildren(this.getLine(), this.childrenToString(), this.getIndex() + 1)
  }

  destroy() {
    this.getParent()._deleteNode(this)
  }

  setFromText(text) {
    if (this.toString() === text) return this
    const tuple = this._textToBeamAndChildrenTuple(text)
    this.setLine(tuple[0])
    return this._setChildren(tuple[1])
  }

  append(line, children) {
    return this._setLineAndChildren(line, children)
  }

  concat(node) {
    if (typeof node === "string") node = new TreeNode(node)
    return node._getChildren().map(node => this._setLineAndChildren(node.getLine(), node.childrenToString()))
  }

  _deleteByIndexes(indexesToDelete) {
    this._clearIndex()
    // note: assumes indexesToDelete is in ascending order
    indexesToDelete.reverse().forEach(index => this.getChildren().splice(index, 1))
    return this._setCMTime(this._getNow())
  }

  _deleteNode(node) {
    const index = this._indexOfNode(node)
    if (index > -1) return this._deleteByIndexes([index])
    return 0
  }

  reverse() {
    this._clearIndex()
    this.getChildren().reverse()
    return this
  }

  shift() {
    if (!this.length) return null
    const node = this.getChildren().shift()
    return node.copyTo(new this.constructor())
  }

  sort(fn) {
    this.getChildren().sort(fn)
    this._clearIndex()
    return this
  }

  invert() {
    this.getChildren().forEach(node => node.getWords().reverse())
    return this
  }

  _rename(oldKeyword, newKeyword) {
    const index = this.indexOf(oldKeyword)

    if (index === -1) return this
    this.getChildren()[index].setKeyword(newKeyword)
    this._clearIndex()
    return this
  }

  remap(map) {
    this.getChildren().forEach(node => {
      const keyword = node.getKeyword()
      if (map[keyword] !== undefined) node.setKeyword(map[keyword])
    })
    return this
  }

  rename(oldKeyword, newKeyword) {
    this._rename(oldKeyword, newKeyword)
    return this
  }

  renameAll(oldName, newName) {
    this.findNodes(oldName).forEach(node => node.setKeyword(newName))
    return this
  }

  _deleteByKeyword(keyword) {
    if (!this.has(keyword)) return this
    const allNodes = this._getChildren()
    const indexesToDelete = []
    allNodes.forEach((node, index) => {
      if (node.getKeyword() === keyword) indexesToDelete.push(index)
    })
    return this._deleteByIndexes(indexesToDelete)
  }

  delete(keyword = "") {
    const xi = this.getXI()
    if (!keyword.includes(xi)) return this._deleteByKeyword(keyword)

    const parts = keyword.split(xi)
    const nextKeyword = parts.pop()
    const targetNode = this.getNode(parts.join(xi))

    return targetNode ? targetNode._deleteByKeyword(nextKeyword) : 0
  }

  // todo: add more testing.
  extend(nodeOrStr) {
    if (!(nodeOrStr instanceof TreeNode)) nodeOrStr = new TreeNode(nodeOrStr)
    nodeOrStr.getChildren().forEach(node => {
      const path = node.getKeyword()
      const beam = node.getBeam()
      const targetNode = this.touchNode(path).setBeam(beam)
      if (node.length) targetNode.extend(node.childrenToString())
    })
    return this
  }

  replaceNode(fn) {
    const str = fn(this.toString())
    const parent = this.getParent()
    const index = this.getIndex()
    const newNodeText = new TreeNode(str).nodeAt(0)
    const newNode = parent.insert(newNodeText.getLine(), newNodeText.childrenToString(), index)
    this.destroy()
    return newNode
  }

  insert(line, children, index) {
    return this._setLineAndChildren(line, children, index)
  }

  prepend(line, children) {
    return this.insert(line, children, 0)
  }

  pushBeamAndChildren(beam, children) {
    let index = this.length

    while (this.has(index.toString())) {
      index++
    }
    const line = index.toString() + (beam === undefined ? "" : this.getZI() + beam)
    return this.append(line, children)
  }

  _touchNode(keywordPathArray) {
    let contextNode = this
    keywordPathArray.forEach(keyword => {
      contextNode = contextNode.getNode(keyword) || contextNode.append(keyword)
    })
    return contextNode
  }

  _touchNodeByString(str) {
    str = str.replace(this.getYIRegex(), "") // todo: do we want to do this sanitization?
    return this._touchNode(str.split(this.getZI()))
  }

  touchNode(str) {
    return this._touchNodeByString(str)
  }

  sortBy(nameOrNames) {
    nameOrNames = nameOrNames instanceof Array ? nameOrNames : [nameOrNames]

    const namesLength = nameOrNames.length
    this.sort((nodeA, nodeB) => {
      if (!nodeB.length && !nodeA.length) return 0
      else if (!nodeA.length) return -1
      else if (!nodeB.length) return 1

      for (let nameIndex = 0; nameIndex < namesLength; nameIndex++) {
        const keyword = nameOrNames[nameIndex]
        const av = nodeA.getNode(keyword).getBeam()
        const bv = nodeB.getNode(keyword).getBeam()

        if (av > bv) return 1
        else if (av < bv) return -1
      }
      return 0
    })
    return this
  }

  static fromCsv(str, hasHeaders) {
    return this.fromDelimited(str, ",", hasHeaders)
  }

  static fromJson(str) {
    return new TreeNode(JSON.parse(str))
  }

  static fromSsv(str, hasHeaders) {
    return this.fromDelimited(str, " ", hasHeaders)
  }

  static fromTsv(str, hasHeaders) {
    return this.fromDelimited(str, "\t", hasHeaders)
  }

  static fromDelimited(str, delimiter, hasHeaders, quoteChar = '"') {
    const rows = str.includes(quoteChar)
      ? this._strToRows(str, delimiter, quoteChar)
      : str.split("\n").map(line => line.split(delimiter))
    return this._rowsToTreeNode(rows, delimiter, hasHeaders === false ? false : true)
  }

  static _strToRows(str, delimiter, quoteChar, newLineChar = "\n") {
    const rows = [[]]
    const newLine = "\n"
    const length = str.length
    let currentCell = ""
    let inQuote = str.substr(0, 1) === quoteChar
    let currentPosition = inQuote ? 1 : 0
    let nextChar
    let isLastChar
    let currentRow = 0
    let char
    let isNextCharAQuote

    while (currentPosition < length) {
      char = str[currentPosition]
      isLastChar = currentPosition + 1 === length
      nextChar = str[currentPosition + 1]
      isNextCharAQuote = nextChar === quoteChar

      if (inQuote) {
        if (char !== quoteChar) currentCell += char
        else if (isNextCharAQuote) {
          // Both the current and next char are ", so the " is escaped
          currentCell += nextChar
          currentPosition++ // Jump 2
        } else {
          // If the current char is a " and the next char is not, it's the end of the quotes
          inQuote = false
          if (isLastChar) rows[currentRow].push(currentCell)
        }
      } else {
        if (char === delimiter) {
          rows[currentRow].push(currentCell)
          currentCell = ""
          if (isNextCharAQuote) {
            inQuote = true
            currentPosition++ // Jump 2
          }
        } else if (char === newLine) {
          rows[currentRow].push(currentCell)
          currentCell = ""
          currentRow++
          if (nextChar) rows[currentRow] = []
          if (isNextCharAQuote) {
            inQuote = true
            currentPosition++ // Jump 2
          }
        } else if (isLastChar) rows[currentRow].push(currentCell + char)
        else currentCell += char
      }
      currentPosition++
    }
    return rows
  }

  static multiply(nodeA, nodeB) {
    const productNode = nodeA.clone()
    productNode._getChildren().forEach((node, index) => {
      node.setChildren(node.length ? this.multiply(node, nodeB) : nodeB.clone())
    })
    return productNode
  }

  // Given an array return a tree
  static _rowsToTreeNode(rows, delimiter, hasHeaders) {
    const numberOfColumns = rows[0].length
    const treeNode = new TreeNode()
    const names = this._getHeader(rows, hasHeaders)

    const rowCount = rows.length
    for (let rowIndex = hasHeaders ? 1 : 0; rowIndex < rowCount; rowIndex++) {
      const rowTree = new TreeNode()
      let row = rows[rowIndex]
      // If the row contains too many columns, shift the extra columns onto the last one.
      // This allows you to not have to escape delimiter characters in the final column.
      if (row.length > numberOfColumns) {
        row[numberOfColumns - 1] = row.slice(numberOfColumns - 1).join(delimiter)
        row = row.slice(0, numberOfColumns)
      } else if (row.length < numberOfColumns) {
        // If the row is missing columns add empty columns until it is full.
        // This allows you to make including delimiters for empty ending columns in each row optional.
        while (row.length < numberOfColumns) {
          row.push("")
        }
      }

      const obj = {}
      row.forEach((cellValue, index) => {
        obj[names[index]] = cellValue
      })

      treeNode.pushBeamAndChildren(undefined, obj)
    }
    return treeNode
  }

  static _initializeXmlParser() {
    if (this._xmlParser) return
    const windowObj = window

    if (typeof windowObj.DOMParser !== "undefined")
      this._xmlParser = xmlStr => new windowObj.DOMParser().parseFromString(xmlStr, "text/xml")
    else if (typeof windowObj.ActiveXObject !== "undefined" && new windowObj.ActiveXObject("Microsoft.XMLDOM")) {
      this._xmlParser = xmlStr => {
        const xmlDoc = new windowObj.ActiveXObject("Microsoft.XMLDOM")
        xmlDoc.async = "false"
        xmlDoc.loadXML(xmlStr)
        return xmlDoc
      }
    } else throw new Error("No XML parser found")
  }

  static fromXml(str) {
    this._initializeXmlParser()
    const xml = this._xmlParser(str)

    try {
      return this._treeNodeFromXml(xml).getNode("children")
    } catch (err) {
      return this._treeNodeFromXml(this._parseXml2(str)).getNode("children")
    }
  }

  static _parseXml2(str) {
    const el = document.createElement("div")
    el.innerHTML = str
    return el
  }

  static _treeNodeFromXml(xml) {
    const result = new TreeNode()
    const children = new TreeNode()

    // Set attributes
    if (xml.attributes) {
      for (let index = 0; index < xml.attributes.length; index++) {
        result.setBeam(xml.attributes[index].name, xml.attributes[index].value)
      }
    }

    if (xml.data) children.pushBeamAndChildren(xml.data)

    // Set content
    if (xml.childNodes && xml.childNodes.length > 0) {
      for (let index = 0; index < xml.childNodes.length; index++) {
        const child = xml.childNodes[index]

        if (child.tagName && child.tagName.match(/parsererror/i)) throw new Error("Parse Error")

        if (child.childNodes.length > 0 && child.tagName) children.append(child.tagName, this._treeNodeFromXml(child))
        else if (child.tagName) children.append(child.tagName)
        else if (child.data) {
          const data = child.data.trim()
          if (data) children.pushBeamAndChildren(data)
        }
      }
    }

    if (children.length > 0) result.touchNode("children").setChildren(children)

    return result
  }

  static _getHeader(rows, hasHeaders) {
    const numberOfColumns = rows[0].length
    const headerRow = hasHeaders ? rows[0] : []
    const ZI = " "
    const ziRegex = new RegExp(ZI, "g")

    if (hasHeaders) {
      // Strip any ZIs from column names in the header row.
      // This makes the mapping not quite 1 to 1 if there are any ZIs in names.
      for (let index = 0; index < numberOfColumns; index++) {
        headerRow[index] = headerRow[index].replace(ziRegex, "")
      }
    } else {
      // If str has no headers, create them as 0,1,2,3
      for (let index = 0; index < numberOfColumns; index++) {
        headerRow.push(index.toString())
      }
    }
    return headerRow
  }

  static nest(str, xValue) {
    const YI = "\n"
    const XI = " "
    const indent = YI + XI.repeat(xValue)
    return str ? indent + str.replace(/\n/g, indent) : ""
  }
}

window.TreeNode = TreeNode



class AbstractGrammarBackedProgram extends TreeNode {
  getProgram() {
    return this
  }

  getProgramErrors() {
    const nodeErrors = this.getTopDownArray().map(node => node.getErrors())
    return [].concat.apply([], nodeErrors)
  }

  getKeywordMap() {
    return this.getDefinition().getRunTimeKeywordMap()
  }

  getCatchAllNodeClass(line) {
    // todo: blank line
    // todo: restore didyoumean
    return this.getDefinition().getRunTimeCatchAllNodeClass()
  }

  getErrorCount() {
    const grammarProgram = this.getDefinition()
    return {
      errorCount: this.getProgramErrors().length,
      name: grammarProgram.getExtensionName()
    }
  }

  async run() {}

  getDefinition() {
    return this.getGrammarProgram()
  }

  getGrammarUsage(filepath = "") {
    const usage = new TreeNode()
    const grammarProgram = this.getGrammarProgram()
    const keywordDefinitions = grammarProgram.getChildren()
    keywordDefinitions.forEach(child => {
      usage.append([child.getWord(0), "line-id", "keyword", child.getBeamParameters().join(" ")].join(" "))
    })
    const programNodes = this.getTopDownArray()
    programNodes.forEach((programNode, lineNumber) => {
      const def = programNode.getDefinition()
      const keyword = def.getKeyword()
      const stats = usage.getNode(keyword)
      stats.append([filepath + "-" + lineNumber, programNode.getWords().join(" ")].join(" "))
    })
    return usage
  }

  getProgramWordTypeString() {
    return this.getTopDownArray()
      .map(child => child.getIndentation() + child.getWordTypeLine())
      .join("\n")
  }

  getWordTypeAtPosition(lineIndex, wordIndex) {
    this._initWordTypeCache()
    const typeNode = this._cache_typeTree.getTopDownArray()[lineIndex - 1]
    return typeNode ? typeNode.getWord(wordIndex - 1) : ""
  }

  _initWordTypeCache() {
    const treeMTime = this.getTreeMTime()
    if (this._cache_programWordTypeStringMTime === treeMTime) return undefined

    this._cache_typeTree = new TreeNode(this.getProgramWordTypeString())
    this._cache_programWordTypeStringMTime = treeMTime
  }

  getCompiledProgramName(programPath) {
    const grammarProgram = this.getDefinition()
    return programPath.replace(`.${grammarProgram.getExtensionName()}`, `.${grammarProgram.getTargetExtension()}`)
  }

  getNodeClasses() {
    return {}
  }
}

window.AbstractGrammarBackedProgram = AbstractGrammarBackedProgram

const GrammarBackedColumnTypes = `any
 isValid .?
something
 isValid .
url
 isValid .?
type
 isValid ^(any|url|something|int|boolean|number|lowercase)$
int
 isValid ^\-?[0-9]+$
reduction
 isValid ^(count|sum|average|min|max|median)$
boolean
 isValid ^(false|true)$
number
 isValid ^\-?[0-9]*\.?[0-9]*$
prob
 description Number between 0 and 1
 isValid ^\-?[0-9]*\.?[0-9]*$
alphanumeric
 isValid ^[a-zA-Z0-9]+$
comparison
 isValid ^(\<|\>|==)$
filepath
 isValid ^[a-zA-Z0-9\.\_\/\-\@]+$
identifier
 isValid ^[$A-Za-z_][0-9a-zA-Z_$]*$
lowercase
 isValid ^[a-z]+$
alpha
 isValid ^[a-zA-Z]+$`

window.GrammarBackedColumnTypes = GrammarBackedColumnTypes




class GrammarBackedCell {
  constructor(word, type, node, line, index) {
    this._word = word
    this._type = type
    this._line = line
    this._node = node
    this._index = index + 1
  }

  getType() {
    return (this._type && this._type.replace("*", "")) || undefined
  }

  getWord() {
    return this._word
  }

  isOptional() {
    return this._type && this._type.endsWith("*")
  }

  getErrorMessage() {
    const index = this._index
    const type = this.getType()
    const fullLine = this._node.getLine()
    const line = this._line
    const word = this._word
    if (word === undefined && this.isOptional()) return ""
    if (word === undefined)
      return `Unfilled "${type}" column in "${fullLine}" at line ${line} column ${index}. definition: ${this._node
        .getDefinition()
        .toString()}`
    if (type === undefined) return `Extra word "${word}" in "${fullLine}" at line ${line} column ${index}`

    const wordTypeClass = GrammarBackedCell._getGrammarBackedColumnTypes()[type]
    if (!wordTypeClass)
      return `Grammar definition error: No column type "${type}" found in "${fullLine}" on line ${line}.`

    const isValid = wordTypeClass.isValid(this._word)
    return isValid
      ? ""
      : `Invalid word in "${fullLine}" at line ${line} column ${index}. "${word}" does not fit in "${type}" column.`
  }

  static _getGrammarBackedColumnTypes() {
    this._initCache()
    return GrammarBackedCell._cache_treeColumnTypes
  }

  static _initCache() {
    if (GrammarBackedCell._cache_treeColumnTypes) return

    const program = new TreeNode(GrammarBackedColumnTypes)
    GrammarBackedCell._cache_treeColumnTypes = {}
    program.getChildren().forEach(child => {
      GrammarBackedCell._cache_treeColumnTypes[child.getLine()] = {
        isValid: str => str.match(new RegExp(child.findBeam("isValid")))
      }
    })
  }
}

window.GrammarBackedCell = GrammarBackedCell



class GrammarConstNode extends TreeNode {
  getValue() {
    // todo: parse type
    if (this.length) return this.childrenToString()
    return this.getWords(2).join(" ")
  }
  getName() {
    return this.getKeyword()
  }
}

window.GrammarConstNode = GrammarConstNode

const GrammarConstants = {}

// parsing
GrammarConstants.keywords = "@keywords"
GrammarConstants.columns = "@columns"
GrammarConstants.catchAllKeyword = "@catchAllKeyword"
GrammarConstants.defaults = "@defaults"
GrammarConstants.constants = "@constants"

// parser/vm instantiating and executing
GrammarConstants.parser = "@parser"
GrammarConstants.parserJs = "js"

// compiling
GrammarConstants.compilerKeyword = "@compiler"
GrammarConstants.compiler = {}
GrammarConstants.compiler.sub = "@sub" // replacement instructions
GrammarConstants.compiler.indentCharacter = "@indentCharacter"
GrammarConstants.compiler.listDelimiter = "@listDelimiter"
GrammarConstants.compiler.openChildren = "@openChildren"
GrammarConstants.compiler.closeChildren = "@closeChildren"

// developing
GrammarConstants.description = "@description"
GrammarConstants.frequency = "@frequency"

// ohayo ui. todo: remove all.
GrammarConstants.ohayoSvg = "@ohayoSvg"
GrammarConstants.ohayoTileSize = "@ohayoTileSize"
GrammarConstants.ohayoTileClass = "@ohayoTileClass"
GrammarConstants.ohayoTileScript = "@ohayoTileScript"
GrammarConstants.ohayoTileCssScript = "@ohayoTileCssScript"

window.GrammarConstants = GrammarConstants








class GrammarBackedNode extends TreeNode {
  getProgram() {
    return this.getParent().getProgram()
  }

  getDefinition() {
    return this.getProgram()
      .getGrammarProgram()
      .getDefinitionByKeywordPath(this.getKeywordPath())
  }

  getCompilerNode(targetLanguage) {
    return this.getDefinition().getDefinitionCompilerNode(targetLanguage, this)
  }

  _getParameterMap() {
    const cells = this.getGrammarBackedCellArray()
    const parameterMap = {}
    cells.forEach(cell => {
      const type = cell.getType()
      if (!parameterMap[type]) parameterMap[type] = []
      parameterMap[type].push(cell.getWord())
    })
    return parameterMap
  }

  getCompiledIndentation(targetLanguage) {
    const compiler = this.getCompilerNode(targetLanguage)
    const indentCharacter = compiler.getIndentCharacter()
    const indent = this.getIndentation()
    return indentCharacter !== undefined ? indentCharacter.repeat(indent.length) : indent
  }

  getCompiledLine(targetLanguage) {
    const compiler = this.getCompilerNode(targetLanguage)
    const listDelimiter = compiler.getListDelimiter()
    const parameterMap = this._getParameterMap()
    const str = compiler.getTransformation()
    return str ? TreeUtils.formatStr(str, listDelimiter, parameterMap) : this.getLine()
  }

  compile(targetLanguage) {
    return this.getCompiledIndentation(targetLanguage) + this.getCompiledLine(targetLanguage)
  }

  getErrors() {
    // Not enough parameters
    // Too many parameters
    // Incorrect parameter

    const errors = this.getGrammarBackedCellArray()
      .filter(wordCheck => wordCheck.getErrorMessage())
      .map(check => check.getErrorMessage())

    return errors
  }

  getGrammarBackedCellArray() {
    const point = this.getPoint()
    const definition = this.getDefinition()
    const parameters = definition.getBeamParameters()
    const parameterLength = parameters.length
    const lastParameterType = parameters[parameterLength - 1]
    const lastParameterListType = lastParameterType && lastParameterType.endsWith("*") ? lastParameterType : undefined
    const words = this.getWords(1)
    const length = Math.max(words.length, parameterLength)
    const checks = []
    for (let index = 0; index < length; index++) {
      const word = words[index]
      const type = index >= parameterLength ? lastParameterListType : parameters[index]
      checks[index] = new GrammarBackedCell(word, type, this, point.y, index)
    }
    return checks
  }

  // todo: just make a fn that computes proper spacing and then is given a node to print
  getWordTypeLine() {
    const parameterWords = this.getGrammarBackedCellArray().map(slot => slot.getType())
    return ["keyword"].concat(parameterWords).join(" ")
  }
}

window.GrammarBackedNode = GrammarBackedNode



class GrammarBackedErrorNode extends GrammarBackedNode {
  getWordTypeLine() {
    return "error ".repeat(this.getWords().length).trim()
  }

  getErrors() {
    return [`Unknown keyword "${this.getKeyword()}" in "${this.getParent().getKeyword()}" at line ${this.getPoint().y}`]
  }
}

window.GrammarBackedErrorNode = GrammarBackedErrorNode



class GrammarBackedNonTerminalNode extends GrammarBackedNode {
  getKeywordMap() {
    return this.getDefinition().getRunTimeKeywordMap()
  }

  getCatchAllNodeClass(line) {
    return this.getDefinition().getRunTimeCatchAllNodeClass()
  }

  // todo: implement
  _getNodeJoinCharacter() {
    return "\n"
  }

  compile(targetExtension) {
    const compiler = this.getCompilerNode(targetExtension)
    const openChildrenString = compiler.getOpenChildrenString()
    const closeChildrenString = compiler.getCloseChildrenString()

    const compiledLine = this.getCompiledLine(targetExtension)
    const indent = this.getCompiledIndentation(targetExtension)

    const compiledChildren = this.getChildren()
      .map(child => child.compile(targetExtension))
      .join(this._getNodeJoinCharacter())

    return `${indent}${compiledLine}${openChildrenString}
${compiledChildren}
${indent}${closeChildrenString}`
  }
}

window.GrammarBackedNonTerminalNode = GrammarBackedNonTerminalNode



class GrammarBackedTerminalNode extends GrammarBackedNode {}

window.GrammarBackedTerminalNode = GrammarBackedTerminalNode





class GrammarCompilerNode extends TreeNode {
  getKeywordMap() {
    const types = [
      GrammarConstants.compiler.sub,
      GrammarConstants.compiler.indentCharacter,
      GrammarConstants.compiler.listDelimiter,
      GrammarConstants.compiler.openChildren,
      GrammarConstants.compiler.closeChildren
    ]
    const map = {}
    types.forEach(type => {
      map[type] = TreeNode
    })
    return map
  }

  getTargetExtension() {
    return this.getWord(1)
  }

  getListDelimiter() {
    return this.findBeam(GrammarConstants.compiler.listDelimiter)
  }

  getTransformation() {
    return this.findBeam(GrammarConstants.compiler.sub)
  }

  getIndentCharacter() {
    return this.findBeam(GrammarConstants.compiler.indentCharacter)
  }

  getOpenChildrenString() {
    return this.findBeam(GrammarConstants.compiler.openChildren) || ""
  }

  getCloseChildrenString() {
    return this.findBeam(GrammarConstants.compiler.closeChildren) || ""
  }
}

window.GrammarCompilerNode = GrammarCompilerNode





class GrammarConstantsNode extends TreeNode {
  getCatchAllNodeClass(line) {
    return GrammarConstNode
  }

  getConstantsObj() {
    const result = {}
    this.getChildren().forEach(node => {
      const name = node.getName()
      result[name] = node.getValue()
    })
    return result
  }
}

window.GrammarConstantsNode = GrammarConstantsNode



class GrammarDefinitionErrorNode extends TreeNode {
  getErrors() {
    return [`Unknown keyword "${this.getKeyword()}" at line ${this.getPoint().y}`]
  }

  getWordTypeLine() {
    return ["keyword"].concat(this.getWords(1).map(word => "any")).join(" ")
  }
}

window.GrammarDefinitionErrorNode = GrammarDefinitionErrorNode




class GrammarParserClassNode extends TreeNode {
  getParserClassFilePath() {
    return this.getWord(2)
  }
}

window.GrammarParserClassNode = GrammarParserClassNode














class AbstractGrammarDefinitionNode extends TreeNode {
  getKeywordMap() {
    const types = [
      GrammarConstants.frequency,
      GrammarConstants.keywords,
      GrammarConstants.columns,
      GrammarConstants.description,
      GrammarConstants.catchAllKeyword,
      GrammarConstants.defaults,
      GrammarConstants.ohayoSvg,
      GrammarConstants.ohayoTileSize,
      GrammarConstants.ohayoTileClass,
      GrammarConstants.ohayoTileScript,
      GrammarConstants.ohayoTileCssScript
    ]
    const map = {}
    types.forEach(type => {
      map[type] = TreeNode
    })
    map[GrammarConstants.constants] = GrammarConstantsNode
    map[GrammarConstants.compilerKeyword] = GrammarCompilerNode
    map[GrammarConstants.parser] = GrammarParserClassNode
    return map
  }

  isNonTerminal() {
    return this.has(GrammarConstants.keywords)
  }

  _getNodeClasses() {
    const builtIns = {
      ErrorNode: GrammarBackedErrorNode,
      TerminalNode: GrammarBackedTerminalNode,
      NonTerminalNode: GrammarBackedNonTerminalNode
    }

    Object.assign(builtIns, this.getProgram().getRootNodeClasses())
    return builtIns
  }

  _getDefaultParserClass() {
    return this.isNonTerminal() ? GrammarBackedNonTerminalNode : GrammarBackedTerminalNode
  }

  _getParserClassFromFilePath(filepath) {
    const rootPath = this.getRootNode().getTheGrammarFilePath() // todo:remove this line
    const basePath = TreeUtils.getPathWithoutFileName(rootPath) + "/"
    const fullPath = filepath.startsWith("/") ? filepath : basePath + filepath
    // todo: remove "window" below?
    return this.isNodeJs() ? require(fullPath) : window[TreeUtils.getClassNameFromFilePath(filepath)]
  }

  _getParserNode() {
    return this.getNodeByColumns(GrammarConstants.parser, GrammarConstants.parserJs)
  }

  getParserClass() {
    if (!this._cache_parserClass) this._cache_parserClass = this._getParserClass()
    return this._cache_parserClass
  }

  _getParserClass() {
    const parserNode = this._getParserNode()
    const filepath = parserNode ? parserNode.getParserClassFilePath() : undefined

    const builtIns = this._getNodeClasses()
    const builtIn = builtIns[filepath]

    return builtIn ? builtIn : filepath ? this._getParserClassFromFilePath(filepath) : this._getDefaultParserClass()
  }

  getCatchAllNodeClass(line) {
    return GrammarDefinitionErrorNode
  }

  getProgram() {
    return this.getParent()
  }

  getDefinitionCompilerNode(targetLanguage, node) {
    const compilerNode = this._getCompilerNodes().find(node => node.getTargetExtension() === targetLanguage)
    if (!compilerNode) throw new Error(`No compiler for language "${targetLanguage}" for line "${node.getLine()}"`)
    return compilerNode
  }

  _getCompilerNodes() {
    return this.getChildrenByNodeType(GrammarCompilerNode) || []
  }

  // todo: remove?
  // for now by convention first compiler is "target extension"
  getTargetExtension() {
    const firstNode = this._getCompilerNodes()[0]
    return firstNode ? firstNode.getTargetExtension() : ""
  }

  getRunTimeKeywordMap() {
    this._initKeywordsMapCache()
    return this._cache_keywordsMap
  }

  getRunTimeKeywordNames() {
    return Object.keys(this.getRunTimeKeywordMap())
  }

  getRunTimeKeywordMapWithDefinitions() {
    const defs = this._getDefinitionCache()
    return TreeUtils.mapValues(this.getRunTimeKeywordMap(), key => defs[key])
  }

  getBeamParameters() {
    const parameters = this.findBeam(GrammarConstants.columns)
    return parameters ? parameters.split(" ") : []
  }

  _initKeywordsMapCache() {
    if (this._cache_keywordsMap) return undefined
    // todo: make this handle extensions.
    const allDefs = this._getDefinitionCache()
    const keywordMap = {}
    this._cache_keywordsMap = keywordMap
    const acceptableKeywords = this.getAllowableKeywords()
    // terminals dont have acceptable keywords
    if (!Object.keys(acceptableKeywords).length) return undefined
    const matching = Object.keys(allDefs).filter(key => allDefs[key].isAKeyword(acceptableKeywords))

    matching.forEach(key => {
      keywordMap[key] = allDefs[key].getParserClass()
    })
  }

  getAllowableKeywords() {
    const keywords = this._getKeyWordsNode()
    return keywords ? keywords.toObject() : {}
  }

  getTopNodeTypes() {
    const definitions = this._getDefinitionCache()
    const keywords = this.getRunTimeKeywordMap()
    const arr = Object.keys(keywords).map(keyword => definitions[keyword])
    arr.sort(AbstractGrammarDefinitionNode.sortByAccessor(definition => definition.getFrequency()))
    arr.reverse()
    return arr.map(definition => definition.getKeyword())
  }

  getDefinitionByName(keyword) {
    const definitions = this._getDefinitionCache()
    return definitions[keyword] || this._getCatchAllDefinition() // todo: this is where we might do some type of keyword lookup for user defined fns.
  }

  _getCatchAllDefinition() {
    const catchAllKeyword = this._getRunTimeCatchAllKeyword()
    const definitions = this._getDefinitionCache()
    const def = definitions[catchAllKeyword]
    // todo: implement contraints like a grammar file MUST have a catch all.
    return def ? def : this.getParent()._getCatchAllDefinition()
  }

  _initCatchCallNodeCache() {
    if (this._cache_catchAll) return undefined

    this._cache_catchAll = this._getCatchAllDefinition().getParserClass()
  }

  getAutocompleteWords(inputStr, additionalWords = []) {
    // todo: add more tests
    const str = this.getRunTimeKeywordNames()
      .concat(additionalWords)
      .join("\n")

    // default is to just autocomplete using all words in existing program.
    return TreeUtils.getUniqueWordsArray(str)
      .filter(obj => obj.word.includes(inputStr) && obj.word !== inputStr)
      .map(obj => obj.word)
  }

  isDefined(keyword) {
    return !!this._getDefinitionCache()[keyword.toLowerCase()]
  }

  getRunTimeCatchAllNodeClass() {
    this._initCatchCallNodeCache()
    return this._cache_catchAll
  }
}

window.AbstractGrammarDefinitionNode = AbstractGrammarDefinitionNode








class GrammarKeywordDefinitionNode extends AbstractGrammarDefinitionNode {
  _getRunTimeCatchAllKeyword() {
    return this.findBeam(GrammarConstants.catchAllKeyword) || this.getParent()._getRunTimeCatchAllKeyword()
  }

  isAKeyword(keywordsMap) {
    const chain = this._getKeywordChain()
    return Object.keys(keywordsMap).some(keyword => chain[keyword])
  }

  _getKeywordChain() {
    this._initKeywordChainCache()
    return this._cache_keywordChain
  }

  _initKeywordChainCache() {
    if (this._cache_keywordChain) return undefined
    const cache = {}
    cache[this.getKeyword()] = true
    const beam = this.getBeam()
    if (beam) {
      cache[beam] = true
      const defs = this._getDefinitionCache()
      const parentDef = defs[beam]
      Object.assign(cache, parentDef._getKeywordChain())
    }
    this._cache_keywordChain = cache
  }

  _getKeyWordsNode() {
    return this.getNode(GrammarConstants.keywords)
  }

  _getDefinitionCache() {
    return this.getParent()._getDefinitionCache()
  }

  getDoc() {
    return this.getKeyword()
  }

  _getDefaultsNode() {
    return this.findBeam(GrammarConstants.defaults)
  }

  getDefaultFor(name) {
    const defaults = this._getDefaultsNode()
    return defaults ? defaults.findBeam(name) : undefined
  }

  getDescription() {
    return this.findBeam(GrammarConstants.description) || ""
  }

  getAllTileSettingsDefinitions() {
    const allKeywordDefs = this.getRunTimeKeywordMapWithDefinitions()
    return Object.values(allKeywordDefs).filter(def => def.isTileSettingDefinition())
  }

  isTileSettingDefinition() {
    return this.isAKeyword({ setting: true })
  }

  getSvg() {
    return this.findBeam(GrammarConstants.ohayoSvg) || "table"
  }

  getSuggestedSize() {
    const ohayoTileSize = this.findBeam(GrammarConstants.ohayoTileSize) || "280 220"
    const parts = ohayoTileSize.split(" ").map(ohayoTileSize => parseInt(ohayoTileSize))
    return {
      width: parts[0],
      height: parts[1]
    }
  }

  getConstantsObject() {
    const constantsNode = this.getNodeByType(GrammarConstantsNode)
    return constantsNode ? constantsNode.getConstantsObj() : {}
  }

  getFrequency() {
    const val = this.findBeam(GrammarConstants.frequency)
    return val ? parseFloat(val) : 0
  }

  toFormBray(value) {
    return `@input
 data-onChangeCommand tile changeTileSettingAndRenderCommand
 name ${this.getKeyword()}
 value ${value}`
  }
}

window.GrammarKeywordDefinitionNode = GrammarKeywordDefinitionNode








class GrammarRootNode extends AbstractGrammarDefinitionNode {
  _getDefaultParserClass() {}
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

  _getRootParserClass() {
    const definedClass = this._getGrammarRootNode().getParserClass()
    const extendedClass = definedClass || AbstractGrammarBackedProgram
    const grammarProgram = this
    return class extends extendedClass {
      getGrammarProgram() {
        return grammarProgram
      }
    }
  }

  getRootParserClass() {
    if (!this._cache_rootParserClass) this._cache_rootParserClass = this._getRootParserClass()
    return this._cache_rootParserClass
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
}

window.GrammarProgram = GrammarProgram








const otree = {}

otree.program = AbstractGrammarBackedProgram
otree.Utils = TreeUtils
otree.TreeNode = TreeNode
otree.NonTerminalNode = GrammarBackedNonTerminalNode
otree.TerminalNode = GrammarBackedTerminalNode

otree.getVersion = () => "11.2.0"

window.otree = otree