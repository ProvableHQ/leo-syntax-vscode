import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import EventService from "./syntax-coloring/EventService";

declare const PLUGINS_INFO: { name: string; version: string }[];
declare const PLUGIN_NAME: string;
declare const COMPILER_VERSION: string;

const pluginName = PLUGIN_NAME ? PLUGIN_NAME : "leo-extension";
const compilerVersion = COMPILER_VERSION ? COMPILER_VERSION : "---";
const pluginsInfo = PLUGINS_INFO ? PLUGINS_INFO : [];

let client: LanguageClient;

export function getClient(): LanguageClient {
  return client;
}

function getCompiler(): string {
  const folderPath = vscode.extensions.getExtension(`aleohq.${pluginName}`)
    .extensionUri.fsPath;
  const compilerPath = path.join(
    folderPath,
    "leo" + (os.type() === "Windows_NT" ? ".exe" : "")
  );
  const compiler = fs.existsSync(compilerPath) ? compilerPath : "leo";
  return compiler;
}

export function activate(context: ExtensionContext) {
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join("server", "out", "server.js")
  );
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [
      { scheme: "file", language: "aleo" },
      { scheme: "file", language: "leo" },
      { scheme: "file", language: "leoInput" },
    ],
    synchronize: {
      fileEvents: [
        vscode.workspace.createFileSystemWatcher("**/*.leo"),
        vscode.workspace.createFileSystemWatcher("**/*.in"),
        vscode.workspace.createFileSystemWatcher("**/*.state"),
        vscode.workspace.createFileSystemWatcher("**/*.out"),
        vscode.workspace.createFileSystemWatcher("**/*.env"),
        vscode.workspace.createFileSystemWatcher("**/*.aleo"),
        vscode.workspace.createFileSystemWatcher("**/*.json"),
      ],
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "leo_lsp",
    "Leo Language Server",
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client.start().then(() => {
    EventService.initialize(context, client);
  });

  const getCommitHash = () => {
    return pluginsInfo;
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${pluginName}.getPluginsInfo`,
      getCommitHash
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${pluginName}.leo-run-transition`,
      (name: string, cwd: string) => {
        const terminal = vscode.window.createTerminal({
          name: `leo run ${name}`,
          cwd,
        });
        terminal.show();
        terminal.sendText(`${getCompiler()} run ${name}`);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(`${pluginName}.leo-run`, () => {
      const terminal = vscode.window.createTerminal(`leo run`);
      terminal.show();
      terminal.sendText(`${getCompiler()} run`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(`${pluginName}.about`, () => {
      vscode.env.clipboard.writeText(`
        - leo-extension Version: ${pluginsInfo[0].version}
        - leo-tree-sitter Version: ${pluginsInfo[1].version}
        - leo compiler: ${compilerVersion}
        - IDE Version: ${vscode.version}
        - Computer OS: ${os.type()}
    `);
    })
  );
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
