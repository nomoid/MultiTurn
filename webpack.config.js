const path = require('path');
require('file-loader');

module.exports = {
  entry: [
    './src/client/index.ts',
    './index.html'
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.html/,
        loader: 'file-loader?name=[name].[ext]',
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    minimize: false
  },
  mode: 'production'
};
