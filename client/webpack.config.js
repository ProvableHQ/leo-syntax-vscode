//@ts-check

"use strict";

const withDefaults = require("../shared.webpack.config");
const path = require("path");
const { DefinePlugin } = require("webpack");
const { GitRevisionPlugin } = require("git-revision-webpack-plugin");
const currentPackage = require("../package.json");
const parserPackage = require("../../node_modules/@aleohq/leo-tree-sitter/package.json");

const gitRevisionPlugin = new GitRevisionPlugin();
const currentPackageHash = gitRevisionPlugin.commithash()?.slice(0, 8);

const pluginsInfo = [
  {
    name: "leo-extension",
    version: `${currentPackage.version}.${currentPackageHash}`,
  },
  {
    name: "leo-tree-sitter",
    version: `${parserPackage.version}`,
  },
];

module.exports = (env, argv) =>
  withDefaults({
    mode: argv.mode === "production" ? "production" : "development",
    devtool: argv.mode === "production" ? false : "source-map",
    context: path.join(__dirname),
    entry: {
      extension: "./src/extension.ts",
    },
    output: {
      filename: "extension.js",
      path: path.join(__dirname, "out"),
    },
    plugins: [
      new DefinePlugin({
        PLUGINS_INFO: JSON.stringify(pluginsInfo),
        PLUGIN_NAME: process.env["INTERNAL_BUILD_PLUGIN_NAME"]
          ? JSON.stringify(process.env["INTERNAL_BUILD_PLUGIN_NAME"])
          : JSON.stringify("leo-extension"),
        COMPILER_VERSION: process.env["INTERNAL_BUILD_COMPILER_VERSION"]
          ? JSON.stringify(process.env["INTERNAL_BUILD_COMPILER_VERSION"])
          : JSON.stringify("---"),
      }),
    ],
  });
