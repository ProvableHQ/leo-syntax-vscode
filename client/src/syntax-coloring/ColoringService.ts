import {
  window,
  TextEditor,
  DecorationRangeBehavior,
  DecorationRenderOptions,
  TextEditorDecorationType,
} from "vscode";
import EventService from "./EventService";
import HelperService, {
  ColorScopes,
  TextMateRuleSettings,
} from "./HelperService";
import ScopeService from "./ScopeService";

const decorationCache = new Map<string, TextEditorDecorationType>();
const warnedScopes = new Set<string>();

export default class ColoringService {
  /**
   * Create decoration types from scopes lazily
   */
  static decoration(scope: string): TextEditorDecorationType | undefined {
    // If we've already created a decoration for `scope`, use it
    if (decorationCache.has(scope)) {
      return decorationCache.get(scope);
    }
    // If `scope` is defined in the current theme, create a decoration for it
    const textmate = ScopeService.find(scope);
    if (textmate) {
      const decoration = ColoringService.createDecorationFromTextmate(textmate);
      decorationCache.set(scope, decoration);
      return decoration;
    }
    // Otherwise, give up, there is no color available for this scope
    return undefined;
  }

  static createDecorationFromTextmate(
    themeStyle: TextMateRuleSettings
  ): TextEditorDecorationType {
    const options: DecorationRenderOptions = {};
    options.rangeBehavior = DecorationRangeBehavior.OpenOpen;
    if (themeStyle.foreground) {
      options.color = themeStyle.foreground;
    }
    if (themeStyle.background) {
      options.backgroundColor = themeStyle.background;
    }
    if (themeStyle.fontStyle) {
      const parts: string[] = themeStyle.fontStyle.split(" ");
      parts.forEach((part) => {
        switch (part) {
          case "italic":
            options.fontStyle = "italic";
            break;
          case "bold":
            options.fontWeight = "bold";
            break;
          case "underline":
            options.textDecoration = "underline";
            break;
          default:
            break;
        }
      });
    }
    return window.createTextEditorDecorationType(options);
  }

  /**
   * Load styles from the current active theme
   */
  static async loadStyles() {
    await ScopeService.load();
    // Clear old styles
    for (const style of decorationCache.values()) {
      style.dispose();
    }
    decorationCache.clear();
  }

  static colorEditor(editor: TextEditor, scopes: ColorScopes) {
    for (const scope of Object.keys(scopes)) {
      const dec = ColoringService.decoration(scope);
      if (dec) {
        const ranges = scopes[scope]!.map(HelperService.range);
        editor.setDecorations(dec, ranges);
      } else if (!warnedScopes.has(scope)) {
        console.warn(scope, "was not found in the current theme");
        warnedScopes.add(scope);
      }
    }
    for (const scope of decorationCache.keys()) {
      if (!scopes[scope]) {
        const dec = decorationCache.get(scope)!;
        editor.setDecorations(dec, []);
      }
    }
  }

  static coloriseVisibleEditors() {
    for (const editor of window.visibleTextEditors) {
      EventService.sendColorizeRequest(editor);
    }
  }
}
