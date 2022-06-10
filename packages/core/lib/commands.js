const commander = require('commander')
const pkg = require('../package.json')

const { log } = require('@pearl-cli/utils')

const program = new commander.Command()

function regiserCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .version(pkg.version)
    .usage('<command> [options]')
    .option('-d, --debug', '是否开启调试模式', false)

  program.on('option:debug', () => {
    const debugBool = program.opts().debug
    const logLevel = debugBool ? 'verbose' : 'info'
    process.env.LOG_LEVEL = logLevel
    log.level = logLevel

    if (debugBool) {
      log.verbose('开启调试模式')
    }
  })

  // 对命令正常解析
  program.parse(process.argv)
}

module.exports = {
  regiserCommand,
}
