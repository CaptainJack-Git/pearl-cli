const { log } = require('@pearl-cli/utils')

async function core() {
  await checkRoot()
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

module.exports = core
