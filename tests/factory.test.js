#! /usr/local/bin/node --use_strict

const quack = require("./quack.js")

const otree = require("../index.js")
const jibberishProgram = require("./jibberish/jibberishProgram.js")

quack.quickTest("makeProgram", equal => {
  // Arrange
  const programPath = __dirname + "/jibberish/sample.jibberish"
  const grammarPath = __dirname + "/jibberish/jibberish.grammar"

  // Act
  const program = otree.makeProgram(programPath, grammarPath)
  const result = program.executeSync()

  // Assert
  equal(program instanceof jibberishProgram, true, "parent program class parsed correctly")
  equal(result, 42)

  // otree.getProgramClassFromGrammarFile
})
