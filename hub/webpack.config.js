const path = require("path");

module.exports = {
  mode: "development",
  context: path.resolve(__dirname),
  entry: {
    app: "./src/js/main.jsx"
  },
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "public", "js")
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              compact: true,
              presets: [
                ["@babel/preset-env", { modules: false }],
                ["@babel/preset-react"]
              ],
              plugins: [
                "@babel/plugin-proposal-class-properties",
                "@babel/plugin-transform-regenerator"
              ],
              // This is a feature of `babel-loader` for webpack (not Babel itself).
              // It enables caching results in ./node_modules/.cache/babel-loader/
              // directory for faster rebuilds.
              cacheDirectory: true
            }
          }
        ]
      },
      {
        test: /\.styl|\.css$/,
        use: [
          {
            loader: "style-loader",
            options: { sourceMap: true }
          },
          {
            loader: "css-loader",
            options: {
              modules: "global",
              localIdentName: '[path][name]__[local]--[hash:base64:10]',
            },
          },
          { 
            loader: "postcss-loader", 
            options: { config: {
              path: path.resolve(__dirname)
            }}
          },
          {
            loader: "stylus-loader",
            options: {
              sourceMap: true
            }
          }
        ]
      }
    ]
  },
  resolve: {
    alias: {
    }
  },
  watch: true,
  target: "web",
  devtool: "source-map",
};
