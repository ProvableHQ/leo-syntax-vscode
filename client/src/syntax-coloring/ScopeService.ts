import { extensions } from "vscode";
import * as jsonc from "jsonc-parser";
import * as path from "path";
import HelperService, {
  TextMateRuleSettings,
  TextMateRule,
} from "./HelperService";

// Current theme colors
const colors = new Map<string, TextMateRuleSettings>();

export default class ScopeService {
  static find(scope: string): TextMateRuleSettings | undefined {
    return colors.get(scope);
  }

  /**
   * Load all textmate scopes in the currently active theme
   */
  static async load() {
    // Remove any previous theme
    colors.clear();
    const themeName = "Leo Theme";
    // Try to load colors from that theme
    try {
      await ScopeService.loadThemeNamed(themeName);
    } catch (e) {
      console.warn("failed to load theme", themeName, e);
    }
  }

  /**
   * Find current theme on disk
   */
  static async loadThemeNamed(themeName: string) {
    for (const extension of extensions.all) {
      const extensionPath: string = extension.extensionPath;
      const extensionPackageJsonPath: string = path.join(
        extensionPath,
        "package.json"
      );
      if (!(await HelperService.checkFileExists(extensionPackageJsonPath))) {
        continue;
      }
      const packageJsonText: string = await HelperService.readFileText(
        extensionPackageJsonPath
      );
      const packageJson: any = jsonc.parse(packageJsonText);
      if (packageJson.contributes && packageJson.contributes.themes) {
        for (const theme of packageJson.contributes.themes) {
          const id = theme.id || theme.label;
          if (id == themeName) {
            const themeRelativePath: string = theme.path;
            const themeFullPath: string = path.join(
              extensionPath,
              themeRelativePath
            );
            await ScopeService.loadThemeFile(themeFullPath);
          }
        }
      }
    }
  }

  static async loadThemeFile(themePath: string) {
    if (await HelperService.checkFileExists(themePath)) {
      const themeContentText: string = await HelperService.readFileText(
        themePath
      );
      const themeContent: any = jsonc.parse(themeContentText);
      if (themeContent && themeContent.tokenColors) {
        ScopeService.loadColors(themeContent.tokenColors);
        if (themeContent.include) {
          // parse included theme file
          const includedThemePath: string = path.join(
            path.dirname(themePath),
            themeContent.include
          );
          await ScopeService.loadThemeFile(includedThemePath);
        }
      }
    }
  }

  static loadColors(textMateRules: TextMateRule[]): void {
    for (const rule of textMateRules) {
      if (typeof rule.scope == "string") {
        if (!colors.has(rule.scope)) {
          colors.set(rule.scope, rule.settings);
        }
      } else if (rule.scope instanceof Array) {
        for (const scope of rule.scope) {
          if (!colors.has(scope)) {
            colors.set(scope, rule.settings);
          }
        }
      }
    }
  }
}
