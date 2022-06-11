const axios = require('axios')
const semver = require('semver')

// TODO:后续看需要是否需要添加淘宝源
const npmRegistry = 'https://registry.npmjs.org'

// 调用 npm api 接口，获取远端 npm 包的接口信息
async function getRemoteNpmInfo(npmName) {
  const urlJoin = (await import('url-join')).default
  // https://registry.npmjs.org/@pearl-cli/core
  const url = urlJoin(npmRegistry, npmName)

  try {
    const res = await axios.get(url)
    if (res.status === 200) return res.data
  } catch (err) {
    return Promise.reject(err)
  }
}

// 获取 npm 远程最新的版本号
async function getNpmLatestVersion(npmName) {
  // 获取某个 npm 的所有版本号
  const { versions } = await getRemoteNpmInfo(npmName)
  const latestVersion = Object.keys(versions).sort((a, b) => (semver.gt(b, a) ? 1 : -1))[0]

  // 返回npm远端最新的那个版本号
  return latestVersion
}

module.exports = {
  getNpmLatestVersion,
  getRemoteNpmInfo,
  npmRegistry,
}
