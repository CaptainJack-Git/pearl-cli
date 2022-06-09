#!/usr/bin/env node
'use strict'

const importLocal = require('import-local')
const { log } = require('@pearl-cli/utils')

// TODO: 如果本地安装了脚手架，就不从全局加载了
if (importLocal(__filename)) {
  log.info('正在使用本地 node_modules/pearl-cli 版本')
} else {
  log.info('进入开发模式...')
  require('./lib/core')(process.argv.slice(2))
}
