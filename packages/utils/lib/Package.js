const npminstall = require('npminstall')
const path = require('path')
const fse = require('fs-extra')

const log = require('./log')
const npm = require('./npm')
const { isObject, formatPath } = require('./tools')

class Package {
  constructor(options) {
    if (!isObject(options)) {
      throw new Error(`options 必须是一个对象`)
    }

    console.log('Package options', options)

    // package安装到的路径
    this.targetPath = options.targetPath
    // package的缓存本地路径
    this.storeDir = options.storeDir

    this.packageName = options.packageName

    this.packageVersion = options.packageVersion

    // package 的缓存目录前缀 @hey-cli/utils -> @hey-cli_utils
    this.cacheFilePathPrefix = this.packageName.replace('/', '_')
  }

  /**
   * 👉
   * 缓存文件路径 路径格式 _@hey-cli_utils@0.0.2-alpha.0@@hey-cli
   * 当使用 npminstall 的时候，会在目标路径下生成一个 node_modules 目录
   * node_models 里面包含两个文件夹 @pearl-cli 和缓存目录 _@hey-cli_utils@0.0.2-alpha.0@@hey-cli
   */
  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    )
  }

  // 拼接指定的版本在缓存中的路径
  getSomeVersionCachePath(version) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${version}@${this.packageName}`
    )
  }

  async prepare() {
    const { pathExists } = await import('path-exists')
    // 解决缓存目录不存在的问题
    if (this.storeDir && !(await pathExists(this.storeDir))) {
      await fse.mkdirpSync(this.storeDir)
    }

    log.verbose(`package ${this.packageName} 安装到 ${this.targetPath}`, this.storeDir)

    // 此种情况，将 latest 转化为具体的版本号, 可以符合具体的路径要求
    if (this.packageVersion === 'latest') {
      this.packageVersion = await npm.getNpmLatestVersion(this.packageName)
    }

    log.verbose('latestVersion', this.packageName, this.packageVersion)
  }

  // 判断当前 package 是否已经安装过了，比如 npm install xxx -g 在全局的缓存目录中
  async exists() {
    let result

    const { pathExists } = await import('path-exists')

    // 当 storeDir 存在时为缓存模式，优先走缓存逻辑
    if (this.storeDir) {
      await this.prepare()
      log.verbose('package 缓存路径', this.cacheFilePath)
      result = await pathExists(this.cacheFilePath)
    } else {
      result = await pathExists(this.targetPath)
    }

    return result
  }

  async install() {
    await this.prepare()

    return npminstall({
      root: this.targetPath, // 模块所在路径
      storeDir: this.storeDir, // 存储到的路径 dir/node_modules
      registry: npm.npmRegistry,
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    })
  }

  /**
   * 1、获取最新的package在npm的版本号
   * 2、查询最新版本号对应的路径是否在本地缓存目录中
   * 3、如果不存在，则直接安装最新版本
   */
  async update() {
    log.verbose('走更新检测逻辑')
    await this.prepare()
    const latestVersion = await npm.getNpmLatestVersion(this.packageName)
    log.verbose('当前npm最新版本为', latestVersion)
    const latestCachePath = this.getSomeVersionCachePath(latestVersion)
    const { pathExists } = await import('path-exists')
    if (await pathExists(latestCachePath)) {
      log.verbose('最新版本已经存在缓存目录中，无需更新')
    } else {
      log.verbose('开始更新最新版本', latestVersion)
      await npminstall({
        root: this.targetPath, // 模块所在路径
        storeDir: this.storeDir, // 存储到的路径 dir/node_modules
        registry: npm.npmRegistry,
        pkgs: [{ name: this.packageName, version: latestVersion }],
      })

      this.packageVersion = latestVersion
    }
  }

  /**
   * 获取入口文件路径, package.json 中对应的 main 字段
   * 1、获取package.json所在目录 - pkg-dir
   * 2、读取package.json
   * 3、找到 package.json 中的 main 字段，代表path
   * 4、对3找到的路径做兼容(macOS/windows)
   */
  async getRootFilePath() {
    const { packageDirectory } = await import('pkg-dir')
    // TODO:这里的 targetPath 在什么场景下有用？
    let _filePath = this.cacheFilePath || this.targetPath

    const dir = await packageDirectory({ cwd: _filePath })

    log.verbose('项目文件夹', dir)

    if (dir) {
      const pkgFile = require(path.resolve(dir, 'package.json'))

      if (pkgFile && pkgFile.main) {
        return formatPath(path.resolve(dir, pkgFile.main))
      }
    }
  }
}

module.exports = Package
