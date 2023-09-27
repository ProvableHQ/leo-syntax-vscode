import { Range, TextEditor, window } from "vscode";
import * as fs from "fs";

export type Point = { row: number; column: number };
export type ColorRange = { start: Point; end: Point };
export type VisibleRange = { start: number; end: number };
export type ColorScopes = { [token: string]: ColorRange[] };

export interface TextMateRule {
  scope: string | string[];
  settings: TextMateRuleSettings;
}

export interface TextMateRuleSettings {
  foreground: string | undefined;
  background: string | undefined;
  fontStyle: string | undefined;
}

export default class HelperService {
  static isLeoFileEditor(editor: TextEditor): boolean {
    const { uri } = editor.document;
    return (
      uri.scheme === "file" &&
      (uri.path.endsWith(".leo") || uri.path.endsWith(".in"))
    );
  }

  static getEditorForUri(uri: string): TextEditor | null {
    return window.visibleTextEditors.find(
      (item) => item.document.uri.toString() === uri
    );
  }

  static visibleLines(editor: TextEditor): VisibleRange[] {
    const lineCount = editor.document.lineCount;
    return [{ start: 0, end: lineCount + 1 }];
  }

  static range(scopeRange: ColorRange): Range {
    return new Range(
      scopeRange.start.row,
      scopeRange.start.column,
      scopeRange.end.row,
      scopeRange.end.column
    );
  }

  static readFileText(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  static checkFileExists(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      fs.stat(filePath, (err, stats) => {
        if (stats && stats.isFile()) {
          resolve(true);
        } else {
          console.warn("no such file", filePath);
          resolve(false);
        }
      });
    });
  }
}
