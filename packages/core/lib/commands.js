const commander = require('commander')
const path = require('path')
const pkg = require('../package.json')

const { log } = require('@pearl-cli/utils')
const { Package } = require('@pearl-cli/utils')

const program = new commander.Command()
const CACHE_PATH = 'dependencies'

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

  program
    .command('init [projectName]')
    .option('-f, --force', '强制初始化', false)
    // targetPath 常用于本地调试时使用，调试时指定路径，然后通过路径找到入口文件执行
    .option('-tp, --target-path <targetPath>', '指定目标路径', '')
    .action((name, options) => {
      let { targetPath } = options
      let storeDir
      const packageName = 'npmlog'
      const packageVersion = '0.0.1'

      execInit({ ...options, packageName, targetPath, storeDir, packageVersion })
    })

  // 没有注册过的命令不可用
  program.on('command:*', () => {
    const avaliableCommands = Object.keys(program.commands.map(cmd => cmd.name()))

    log.error(`未知命令: ${program.args.join(' ')}`)
    log.info(`可用命令: ${avaliableCommands.join(', ')}`)
    process.exit(1)
  })

  if (program?.args?.length < 1) {
    program.outputHelp()
  }

  // 对命令正常解析
  program.parse(process.argv)
}

async function execInit(options) {
  let { targetPath, storeDir, packageName, packageVersion } = options
  let rootFile
  let execPackage

  try {
    if (!targetPath) {
      // 当没有指定目标路径时，默认使用全局用户目录下的缓存路径
      targetPath = path.resolve(process.env.CLI_HOME_PATH, CACHE_PATH)
      storeDir = path.resolve(targetPath, 'node_modules')
      execPackage = new Package({
        targetPath,
        storeDir,
        packageName,
        packageVersion,
      })

      if (await execPackage.exists()) {
        await execPackage.update()
      } else {
        await execPackage.install()
      }
    } else {
      execPackage = new Package({
        targetPath,
        packageName,
        packageVersion,
      })
    }

    rootFile = await execPackage.getRootFilePath()
    log.verbose('执行的入口文件 ->', rootFile)
    // TODO: 使用require做具体的执行, 此处参数，需要提供更新加工过的数据，而不是初始数据
    require(rootFile)(options)
  } catch (err) {
    log.error(err)
    process.exit(1)
  }
}

module.exports = {
  regiserCommand,
}
