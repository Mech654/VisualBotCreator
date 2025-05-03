import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import webpack from 'webpack';

const isDev = process.env.NODE_ENV === 'development';

export default {
  stats: 'minimal',
  mode: isDev ? 'development' : 'production',
  entry: {
    index: './app/src/js/index.ts',
    builder: './app/src/js/builder.ts',
    styles: './app/src/scss/index.scss',
    builderStyles: './app/src/scss/builder.scss',
  },
  output: {
    path: path.resolve('./dist/src'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].css' }),
    new webpack.HotModuleReplacementPlugin(),
  ],
  watch: true,
  devtool: 'source-map',
  target: 'electron-renderer',
  devServer: {
    static: {
      directory: path.join('./dist/src'),
      watch: true,
    },
    hot: true,
    devMiddleware: {
      publicPath: '/',
      writeToDisk: true,
    },
    port: 3000,
  },
};
