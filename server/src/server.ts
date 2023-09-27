import {
  Connection,
  createConnection,
  ProposedFeatures,
  TextDocuments,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ColorizeRequest } from "features/out/services/ColoringService";
import getLanguageFeatures from "features/out";

class ConnectionService {
  private readonly connection: Connection;
  // Create a simple text document manager.
  private documents: TextDocuments<TextDocument> = new TextDocuments(
    TextDocument
  );

  constructor() {
    // Create a connection for the server, using Node's IPC as a transport.
    // Also include all preview / proposed LSP features.
    this.connection = createConnection(ProposedFeatures.all);
    const languageFeaturesService = getLanguageFeatures(this.connection);
    this.connection.onInitialize(
      languageFeaturesService.onInitialize.bind(languageFeaturesService)
    );
    this.connection.onInitialized(
      languageFeaturesService.onInitialized.bind(languageFeaturesService)
    );
    this.connection.onCompletion(
      languageFeaturesService.onCompletion.bind(languageFeaturesService)
    );
    this.connection.onDidChangeConfiguration(
      languageFeaturesService.onDidChangeConfiguration.bind(
        languageFeaturesService
      )
    );
    this.connection.onNotification(
      "ColoringService.getScopes",
      (request: ColorizeRequest) => {
        const response = languageFeaturesService.onColorizeRequest(request);
        this.connection.sendNotification("ColoringService.getScopes", response);
      }
    );
    this.connection.onHover(
      languageFeaturesService.onHover.bind(languageFeaturesService)
    );
    this.documents.onDidClose(
      languageFeaturesService.onDidClose.bind(languageFeaturesService)
    );
    this.documents.onDidOpen(
      languageFeaturesService.onDidChangeContent.bind(languageFeaturesService)
    );
    this.documents.onDidChangeContent(
      languageFeaturesService.onDidChangeContent.bind(languageFeaturesService)
    );
    this.documents.onDidSave(
      languageFeaturesService.onDidSave.bind(languageFeaturesService)
    );
    this.connection.onDefinition(
      languageFeaturesService.onDefinition.bind(languageFeaturesService)
    );
    this.connection.onDidChangeWatchedFiles(
      languageFeaturesService.onDidChangeWatchedFiles.bind(
        languageFeaturesService
      )
    );
    this.connection.onCodeLens(
      languageFeaturesService.onCodeLens.bind(languageFeaturesService)
    );
  }

  listen() {
    // Make the text document manager listen on the connection
    // for open, change and close text document events
    this.documents.listen(this.connection);

    // Listen on the connection
    this.connection.listen();
  }
}

const connectionService = new ConnectionService();
connectionService.listen();
