class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error('参数不能为空')
    }

    if (!Array.isArray(argv)) {
      throw new Error('参数必须是数组')
    }

    if (argv.length === 0) {
      throw new Error('参数列表不能为空')
    }

    this.argv = argv
  }

  // 命令的准备
  init() {
    throw new Error('请重写init方法')
  }

  // 命令的执行
  exec() {
    throw new Error('请重写exec方法')
  }
}

module.exports = Command
