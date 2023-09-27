import {
  ConfigurationChangeEvent,
  ExtensionContext,
  TextEditor,
  workspace,
  window,
} from "vscode";
import { LanguageClient, RequestType } from "vscode-languageclient/node";
import { getClient } from "../extension";
import ColoringService from "./ColoringService";
import HelperService, { ColorScopes } from "./HelperService";

export default class EventService {
  /**
   * Entry point for syntax coloring
   */
  static initialize(context: ExtensionContext, client: LanguageClient) {
    const self = EventService;
    context.subscriptions.push(
      workspace.onDidChangeConfiguration(self.onChangeConfiguration)
    );

    client.onNotification("ColoringService.getScopes", self.onColorizeResponse);
    const type = new RequestType("ColoringService.colorize");
    client.onRequest(type, self.onColorizeResponse);
    ColoringService.loadStyles().then(ColoringService.coloriseVisibleEditors);

    self.startListenChangeActiveTextEditor(client);
  }

  /**
   * Load active color theme
   */
  static async onChangeConfiguration(event: ConfigurationChangeEvent) {
    const colorizationNeedsReload: boolean =
      event.affectsConfiguration("workbench.colorTheme") ||
      event.affectsConfiguration("editor.tokenColorCustomizations");
    if (colorizationNeedsReload) {
      await ColoringService.loadStyles();
      ColoringService.coloriseVisibleEditors();
    }
  }

  static sendColorizeRequest(textEditor: TextEditor) {
    if (HelperService.isLeoFileEditor(textEditor)) {
      const client = getClient();
      const uri = textEditor.document.uri.toString();
      const visibleRanges = HelperService.visibleLines(textEditor);
      client.sendNotification("ColoringService.getScopes", {
        uri,
        visibleRanges,
      });
    }
  }

  static onColorizeResponse(response: { uri: string; scopes: ColorScopes }) {
    const { uri, scopes } = response;
    const editor = HelperService.getEditorForUri(uri);
    if (editor) {
      ColoringService.colorEditor(editor, scopes);
    }
  }

  static startListenChangeActiveTextEditor(client: LanguageClient) {
    window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        client.sendNotification("textDocument/didSave", {
          textDocument: { uri: editor.document.uri.toString() },
        });
      }
    });
  }
}
