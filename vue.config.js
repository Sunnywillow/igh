const CompressionWebpackPlugin = require('compression-webpack-plugin')
const VueFilenameInjector = require('@d2-projects/vue-filename-injector')
const ThemeColorReplacer = require('webpack-theme-color-replacer')
const forElementUI = require('webpack-theme-color-replacer/forElementUI')
const cdnDependencies = require('./dependencies-cdn')
const {chain, set, each} = require('lodash')

// 拼接路径
const resolve = dir => require('path').join(__dirname, dir)


module.exports = {
  // 根据你的实际情况更改这里
  publicPath ,
  lintOnSave: true,

  //跨域
  devServer: {
    proxy: 'http://192.168.0.32:8069',
  },


}
