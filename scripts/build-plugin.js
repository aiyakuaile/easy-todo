const fs = require('fs-extra')
const path = require('path')

const pluginDir = path.resolve(__dirname, '../dist-plugin')
const distDir = path.resolve(__dirname, '../dist')

// 清空并创建插件目录
fs.emptyDirSync(pluginDir)

// 复制构建文件
fs.copySync(distDir, path.join(pluginDir, 'dist'))

// 复制插件必需文件
fs.copySync('plugin.json', path.join(pluginDir, 'plugin.json'))
fs.copySync('preload.js', path.join(pluginDir, 'preload.js'))
fs.copySync('logo.svg', path.join(pluginDir, 'logo.svg'))

console.log('Plugin build complete!') 