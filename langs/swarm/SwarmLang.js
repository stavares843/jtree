const fs = require("fs")
const jtree = require("../../index.js")

const SwarmConstants = {}

// Setup... todo: remove this file
SwarmConstants.setup = "arrangeTestSubject"
SwarmConstants.async = "async"
SwarmConstants.require = "require"
SwarmConstants.static = "static"

class AbstractAssertNode extends jtree.NonTerminalNode {
  async execute(testSubject) {
    const finalParts = AbstractAssertNode._getMethodFromDotPath(testSubject, this.getWord(1))
    const subject = finalParts[0]
    const command = finalParts[1]
    const actual = subject[command]()
    const actualAsString = this.parseActual(actual).toString()
    const expected = this.getExpected()
    const isPassed = this.getTestResult(actualAsString, expected, this.getLine())
    if (!isPassed) {
      this.printFailureMessage(actual)
      debugger
    }
  }

  printFailureMessage() {
    const line = this.getLine()
    this.setLine(`FAILED:${line}`)
    this.setLine(line)
    console.log(this.getStackString())
    const lineNumber = this.getPoint()
    console.log(`Line number ${lineNumber.y}`)
  }

  equal(actual, expected, message) {
    this.getParent().getEqualFn()(actual, expected, message)
  }

  getTestResult(actualAsString, expected, message) {
    this.equal(actualAsString, expected, message)
    return actualAsString === expected
  }

  parseActual(actual) {
    return actual
  }

  async executeSync(result) {
    const expected = this.getSyncExpected()
    const actual = this.parseActual(result)
    const actualIsUndefined = actual === undefined
    const actualAsString = actualIsUndefined ? "undefined" : actual.toString()
    const isPassed = this.getTestResult(actualAsString, expected, this.getLine())
    if (!isPassed) {
      this.printFailureMessage(result)
      debugger
    }
  }

  getExpected() {
    return this.getWordsFrom(2).join(" ")
  }

  getSyncExpected() {
    return this.getContent()
  }

  static _getMethodFromDotPath(context, str) {
    const methodParts = str.split(".")
    while (methodParts.length > 1) {
      context = context[methodParts.shift()]()
    }
    const final = methodParts.shift()
    return [context, final]
  }
}

class AssertEqualBlockNode extends AbstractAssertNode {
  getExpected() {
    return this.childrenToString()
  }

  getSyncExpected() {
    return this.childrenToString()
  }
}

class AssertEqualNode extends AbstractAssertNode {}

class AssertIncludesNode extends AbstractAssertNode {
  getTestResult(actualAsString, expected, message) {
    const result = actualAsString.includes(expected)
    this.equal(result, true, message)
    return result
  }
}

class AssertLengthNode extends AbstractAssertNode {
  parseActual(actual) {
    return actual.length
  }

  printFailureMessage(actual) {
    super.printFailureMessage()
    console.log(actual.join("\n"))
  }
}

class AssertTypeOfNode extends AbstractAssertNode {
  parseActual(actual) {
    return typeof actual
  }
}

class AssertDoesNotIncludeNode extends AssertIncludesNode {
  getTestResult(actualAsString, expected, message) {
    const result = !actualAsString.includes(expected)
    if (!result) {
      const index = actualAsString.indexOf(expected)
      const start = Math.max(0, index - 50)
      message += ` Found ${expected} in: ` + actualAsString.substr(start, index + 50 + expected.length)
    }
    this.equal(result, true, message)
    return result
  }
}

class SwarmProgramRoot extends jtree.GrammarBackedRootNode {
  getCommandParent(testSubject) {
    return testSubject
  }

  getTestSetupNode() {
    return this.getChildrenByNodeConstructor(TestSetupNode)[0]
  }

  execute(filepath) {
    const tests = this.getTestsToRun()
    tests.map(test => test.execute(filepath))
    return `${tests.length} tests started.`
  }

  getTestsToRun() {
    const solos = this.getChildrenByNodeConstructor(SoloTestBlock)
    const testsToRun = solos.length ? solos : this.getChildrenByNodeConstructor(TestBlock).filter(test => !(test instanceof SkippedTestBlock))
    return testsToRun
  }
}

class CommandArgNode extends jtree.NonTerminalNode {
  executeSync() {}
}

class CommandNode extends jtree.NonTerminalNode {
  getTestBlock() {
    return this.getParent()
  }

  getEqualFn() {
    return this.getTestBlock().getEqualFn()
  }

  _getArgs() {
    const argNodes = this.getChildrenByNodeConstructor(CommandArgNode)
    if (argNodes.length) return argNodes.map(arg => arg.childrenToString())
    return this.getWordsFrom(1)
  }

  _executeSwarmCommand(testSubject) {
    const command = this.getFirstWord()
    const commandParent = this.getRootNode().getCommandParent(testSubject) // todo: hacky.
    const commandFn = commandParent[command]
    if (!commandFn) throw new Error(`No function "${command}" on "${commandParent.constructor.name}`)
    return commandFn.apply(commandParent, this._getArgs())
  }

  async execute(testSubject) {
    await this._executeSwarmCommand(testSubject)
    return super.execute(testSubject) // note: this might not work with closure compiler b/c of bug #2652
  }

  executeSync(testSubject) {
    const newTestSubject = this._executeSwarmCommand(testSubject)
    this.map(child => child.executeSync(newTestSubject))
  }
}

class TestBlock extends jtree.NonTerminalNode {
  getTestSetupNode() {
    return this.getNode(SwarmConstants.setup) || this.getParent().getTestSetupNode()
  }

  isAsync() {
    return this.getTestSetupNode().has(SwarmConstants.async)
  }

  setEqualMethod(equal) {
    this._equal = equal
    return this
  }

  getTestBlock() {
    return this
  }

  getEqualFn() {
    return this._equal
  }

  _executeNode(programFilepath) {
    const testSubject = this.getTestSetupNode().getTestSubject(programFilepath)
    const isAsync = this.isAsync()
    const executeMethod = isAsync ? "execute" : "executeSync"
    const tap = require("tap") // todo: make work with browser
    return new Promise((resolve, reject) => {
      const testName = this.getLine()

      tap.test(testName, async childTest => {
        this.setEqualMethod(childTest.equal)

        const promises = this.map(child => {
          const result = child[executeMethod](testSubject)
          return isAsync ? Promise.resolve(result) : result
        })

        await Promise.all(promises)

        childTest.end()
        resolve()
      })
    })
  }

  async _executeBrowser() {
    const testSubject = this.getTestSetupNode().getTestSubject()
    const isAsync = this.isAsync()
    const executeMethod = isAsync ? "execute" : "executeSync"
    const testName = this.getLine()
    console.log("testing: " + testName)
    this.setEqualMethod((actual, expected, message) => {
      if (actual !== expected) console.log("fail")
      else console.log("pass")
    })

    const promises = this.map(child => {
      const result = child[executeMethod](testSubject)
      return isAsync ? Promise.resolve(result) : result
    })

    await Promise.all(promises)
  }

  execute(programFilepath) {
    return this.isNodeJs() ? this._executeNode(programFilepath) : this._executeBrowser()
  }
}

class SoloTestBlock extends TestBlock {}

class SkippedTestBlock extends TestBlock {
  async execute() {
    console.log(`Skipped test ${this.getLine()}`)
  }
}

class SetupConstructorArgNode extends jtree.NonTerminalNode {
  executeSync() {}
}

class TestSetupNode extends jtree.NonTerminalNode {
  getTestSubject(programFilepath) {
    const requiredClass = this._getRequiredClass(programFilepath)
    const constructorArgNode = this.getChildrenByNodeConstructor(SetupConstructorArgNode)[0]
    const param = constructorArgNode ? constructorArgNode.childrenToString() : undefined
    return this.has(SwarmConstants.static) ? requiredClass : new requiredClass(param)
  }

  _getRequiredClass(programFilepath) {
    let requiredClass =
      this.get(SwarmConstants.require) ||
      this.getRootNode()
        .getNode(SwarmConstants.setup)
        .get(SwarmConstants.require)
    const requiredClassParts = requiredClass.split(" ") // Allows for ./ExportsClasses.js ChildClass
    requiredClass = requiredClassParts[0]
    let theClass

    if (this.isNodeJs()) theClass = require(jtree.Utils.resolvePath(requiredClass, programFilepath))
    else theClass = window[jtree.Utils.getClassNameFromFilePath(requiredClass)]

    if (requiredClassParts[1]) theClass = jtree.Utils.resolveProperty(theClass, requiredClassParts[1])

    if (!theClass)
      throw new Error(`Required class '${requiredClass}${requiredClassParts[1] ? " (" + requiredClassParts[1] + ")" : ""}' not found for ${this.toString()}`)

    return theClass
  }

  executeSync() {}
}

module.exports = {
  SwarmProgramRoot,
  TestBlock,
  TestSetupNode,
  CommandArgNode,
  CommandNode,
  SetupConstructorArgNode,
  AssertEqualBlockNode,
  AssertLengthNode,
  AssertDoesNotIncludeNode,
  AssertIncludesNode,
  AssertEqualNode,
  AssertTypeOfNode,
  SkippedTestBlock,
  SoloTestBlock,
  SwarmConstants
}