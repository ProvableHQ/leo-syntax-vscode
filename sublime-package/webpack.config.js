const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const JsoncParser = require("jsonc-parser");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const plist = require("plist");
const {
  toSublimeColorScheme,
} = require("code-theme-converter/dist/sublime/colorScheme");

const changeColor = (hexValue) => {
  let colorValue = parseInt(hexValue.slice(1), 16);
  if ((colorValue & 0xff00) == 0xff00) {
    colorValue -= 0x100;
  } else {
    colorValue += 0x100;
  }

  return colorValue.toString(16);
};

const extractColorSchemeFromAleoTheme = (content) => {
  const AleoContent = JsoncParser.parse(content);
  const DarkContent = JsoncParser.parse(
    fs.readFileSync("../vscode-extension/themes/dark_vs.json", "utf-8")
  );

  const AleoColorScheme = toSublimeColorScheme(AleoContent);
  const DarkVsCodeColorScheme = toSublimeColorScheme(DarkContent);

  return JSON.stringify({
    ...AleoColorScheme,
    globals: {
      ...Object.fromEntries(
        Object.entries(AleoColorScheme.globals).filter(
          ([key, value]) => !!value
        )
      ),
      gutter_foreground_highlight:
        AleoColorScheme.globals["editorLineNumber.activeForeground"],
    },
    variables: {
      ...Object.fromEntries(
        Object.entries(AleoColorScheme.variables).filter(
          ([key, value]) => !!value
        )
      ),
    },
    rules: [
      ...AleoColorScheme.rules
        .filter((rule) => !!rule.scope.length)
        .reduce((acc, rule) => {
          if (!rule.scope.includes(".server.leo")) {
            acc.push(rule);
            return acc;
          }

          const regularRule = {
            ...rule,
            background: `#${changeColor(AleoColorScheme.globals.background)}`,
          };
          const highlightedRule = {
            ...rule,
            scope: rule.scope.replace(/server\.leo/g, "highlight.server.leo"),
            background: `#${changeColor(
              AleoColorScheme.globals.line_highlight
            )}`,
          };

          acc.push(regularRule, highlightedRule);
          return acc;
        }, []),
      ...DarkVsCodeColorScheme.rules.filter((rule) => !!rule.scope.length),
    ],
  });
};

module.exports = function (env, argv) {
  return {
    mode: argv.mode,
    devtool: argv.mode === "production" ? false : "source-map",
    context: path.join(__dirname),
    entry: "./src/server.ts",
    target: "node",
    output: {
      filename: "server.js",
      path: path.join(__dirname, "out", "language-server"),
    },
    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        "features/out": path.resolve(__dirname, "../features/out"),
      },
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: "./settings",
            to: "..",
          },
          {
            from: "./README.md",
            to: "..",
          },
          {
            from: "../vscode-extension/syntaxes/Aleo.tmLanguage.json",
            to: "../Aleo.tmLanguage",
            transform: (content) =>
              plist.build(JSON.parse(content.toString("utf-8"))),
          },
          {
            from: "../vscode-extension/syntaxes/leo.tmLanguage.json",
            to: "../leo.tmLanguage",
            transform: (content) =>
              plist.build(JSON.parse(content.toString("utf-8"))),
          },
          {
            from: "../vscode-extension/syntaxes/leoInput.tmLanguage.json",
            to: "../leoInput.tmLanguage",
            transform: (content) =>
              plist.build(JSON.parse(content.toString("utf-8"))),
          },
          {
            from: "../vscode-extension/syntaxes/leoHover.tmLanguage.json",
            to: "../leoHover.tmLanguage",
            transform: (content) =>
              plist.build(JSON.parse(content.toString("utf-8"))),
          },
          {
            from: "../vscode-extension/themes/Leo Theme-color-theme.json",
            to: "../leo.sublime-color-scheme",
            transform: (content) =>
              extractColorSchemeFromAleoTheme(content.toString("utf-8")),
          },
        ],
      }),
      new webpack.DefinePlugin({
        "process.env.MODE": JSON.stringify(argv.mode),
      }),
    ],
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin()],
    },
    module: {
      rules: [
        {
          use: "ts-loader",
          test: /\.ts?$/,
        },
      ],
    },
  };
};
