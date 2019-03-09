const path = require('path');
require('file-loader');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: [
    './src/tictactoe/client.ts',
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
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true, // Must be set to true if using source-maps in production
        terserOptions: {
          mangle: false
        }
      }),
    ],
  },
  mode: 'production'
};
