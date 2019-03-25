const path = require('path');
require('file-loader');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: [
    './src/chess/client.ts',
    './public/chess/index.html'
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          configFile: 'client.tsconfig.json'
        }
      },
      {
        test: /\.(html|css)$/,
        loader: 'file-loader?name=[name].[ext]',
      },
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
  plugins: [
    new CopyPlugin([
      {
        from: 'public/chess/assets',
        to: 'assets'
      }
    ])
  ],
  mode: 'production'
};
