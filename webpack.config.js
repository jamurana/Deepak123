const webpack = require('webpack');
const path = require('path');

module.exports = {
  mode: 'development',
  plugins: [        
  ],
  optimization: {
    concatenateModules: true,
    usedExports: true,
    runtimeChunk: {
      name: 'runtime'
    },    
    nodeEnv: 'production'
  },
  entry: {
  	app: [
      path.resolve(__dirname, 'js/index.js'),
      path.resolve(__dirname, 'js/inSite.js'),
      path.resolve(__dirname, 'js/insite_config.js'),
      path.resolve(__dirname, 'js/insite_UI.js'),
      path.resolve(__dirname, 'js/insite_context-menu.js')
    ]
  },
  //devtool: 'inline-source-map', //turn on it for debuging
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};