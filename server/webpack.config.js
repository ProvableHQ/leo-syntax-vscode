//@ts-nocheck

"use strict";

const withDefaults = require("../shared.webpack.config");
const path = require("path");
const webpack = require("webpack");

const name = process.env["INTERNAL_BUILD_PLUGIN_NAME"];

module.exports = (env, argv) =>
  withDefaults({
    mode: argv.mode === "production" ? "production" : "development",
    devtool: argv.mode === "production" ? false : "source-map",
    context: path.join(__dirname),
    entry: {
      extension: "./src/server.ts",
    },
    output: {
      filename: "server.js",
      path: path.join(__dirname, "out"),
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: "string-replace-loader",
          options: {
            search: '"leo-extension.',
            replace: name ? `"${name}.` : '"leo-extension.',
            flags: "g",
          },
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.MODE": JSON.stringify(
          process.argv.includes("production") ? "production" : "development"
        ),
      }),
    ],
  });
