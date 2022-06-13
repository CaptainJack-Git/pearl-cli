'use strict'

class InitCommand {
  constructor(options) {
    console.log('this is InitCommand', options)
  }
}

function init(options) {
  return new InitCommand(options)
}

module.exports = init
module.exports.InitCommand = InitCommand
