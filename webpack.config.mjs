import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
    path: path.resolve(__dirname, 'dist/src'),
    filename: '[name].js',
    publicPath: isDev ? 'http://localhost:4000/' : '/',
    clean: false,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    mainFields: ['browser', 'module', 'main'],
    plugins: [
      // Custom resolver to handle .js imports pointing to .ts files
      {
        apply(resolver) {
          const target = resolver.ensureHook('resolve');
          resolver
            .getHook('before-resolve')
            .tapAsync('TypeScriptModuleResolver', (request, resolveContext, callback) => {
              if (request.request && request.request.endsWith('.js')) {
                const tsRequest = request.request.replace(/\.js$/, '.ts');
                const newRequest = {
                  ...request,
                  request: tsRequest,
                };
                return resolver.doResolve(target, newRequest, null, resolveContext, callback);
              }
              callback();
            });
        },
      },
    ],
    // Add fallbacks for Node.js built-in modules
    fallback: {
      "module": false,
      "path": false,
      "os": false,
      "fs": false,
      "crypto": false,
      "stream": false,
      "buffer": false,
      "http": false,
      "https": false,
      "zlib": false,
      "util": false,
      "net": false,
      "tls": false,
      "url": false,
      "querystring": false,
      "assert": false,
      "constants": false,
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: isDev, // Faster builds in development
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader, // Use style-loader for HMR in dev
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
      {
        test: /\.html$/,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ 
      filename: 'styles/[name].css'
    }),
    isDev && new webpack.HotModuleReplacementPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: './app/src/*.html',
          to: '[name][ext]',
        },
        {
          from: './app/src/assets',
          to: 'assets',
        },
      ],
    }),
  ].filter(Boolean),
  watch: false,
  devtool: isDev ? 'eval-source-map' : false,
  target: isDev ? 'web' : 'electron-renderer',
  devServer: {
    port: 4000,
    host: 'localhost',
    compress: true,
    static: {
      directory: path.join(__dirname, 'dist'),
      publicPath: '/',
    },
    devMiddleware: {
      publicPath: '/',
      writeToDisk: true,
    },
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: '/src/index.html' },
        { from: /^\/index\.html$/, to: '/index.html' },
        { from: /^\/builder\.html$/, to: '/builder.html' }
      ]
    },
    hot: true, // Enable HMR
    liveReload: false, // Disable live reload when using HMR
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
      progress: true,
    }
  },
};
