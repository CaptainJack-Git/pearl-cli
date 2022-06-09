const path = require('path')
const semver = require('semver')
const colors = require('colors')

const { log, npm } = require('@pearl-cli/utils')
const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require('./constants')
const pkg = require('../package.json')

let userHome

async function core() {
  try {
    await checkRoot()
    checkNodeVersion()
    await checkUserHome()
    await checkEnv()
    await checkUpdate()
  } catch (err) {
    if (err.message) {
      log.error(err.message)
    }
  }
}

/**
 * 检查当前账户是否是root账户，如果是root用户，需要对root用户做降级
 * 当 process.geteuid() 为0时，说明使用的是root用户. ps:不同的平台的普通用户的pid不一样
 *
 */
async function checkRoot() {
  await import('root-check')
  log.info('用户权限:', process.geteuid())
}

// 设置最低版本号，对比用户当前运行的 node 版本是否可以运行
function checkNodeVersion() {
  if (!semver.gte(process.version, LOWEST_NODE_VERSION)) {
    throw new Error(
      colors.red(`当前node版本为${process.version}，node版本不低于 ${LOWEST_NODE_VERSION}`)
    )
  }
}

// 判断用户主目录，以便于后续存放缓存
async function checkUserHome() {
  userHome = require('userhome')()
  const { pathExists } = await import('path-exists')
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('用户主目录不存在，请检查'))
  }
}

// 检查环境变量，如果有 .env 就注入到 process.env 中
async function checkEnv() {
  const dotenv = require('dotenv')
  // 这个是在用户主目录的环境变量文件
  const envPath = path.join(userHome, '.env')
  const { pathExists } = await import('path-exists')
  if (pathExists(envPath)) {
    dotenv.config({ path: envPath })
  }

  createDefaultConfig()
}

// 默认配置
function createDefaultConfig() {
  const cliConfig = { home: userHome }

  // 用户可自行配置用于缓存的目录
  if (process.env.CLI_HOME) {
    cliConfig.cliHome = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig.cliHome = path.join(userHome, DEFAULT_CLI_HOME)
  }

  process.env.CLI_HOME_PATH = cliConfig.cliHome

  return cliConfig
}

/**
 * 检查脚手架版本是否需要更新
 * 1、获取当前版本号和模块名
 * 2、调用 npm API，获取远端 npm 所有版本号
 * 3、提取所有版本号，比对哪些版本号是大于当前版本号
 * 4、获取最新的版本号，提示用户更新版本
 */
async function checkUpdate() {
  const currentVersion = pkg.version
  const npmName = pkg.name

  const latestVersion = await npm.getNpmLatestVersion(npmName)

  if (latestVersion && semver.gt(latestVersion, currentVersion)) {
    log.warn(`
      @pearl-cli/core 有新版本! 当前版本为 ${currentVersion},
      最新版本为 ${latestVersion},
      请使用 npm update -g @pearl-cli/core 更新
    `)
  } else {
    log.verbose('@pearl-cli/core 当前已是最新版本')
  }
}

module.exports = core
