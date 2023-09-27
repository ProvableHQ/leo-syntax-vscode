import {
  _Connection,
  TextDocuments,
  createConnection,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import getLanguageFeatures from "features/out";
import LanguageFeaturesService from "features/out/services/LanguageFeaturesService";

class LeoServer {
  protected readonly documents = new TextDocuments(TextDocument);

  constructor(
    protected readonly connection: _Connection,
    protected readonly languageFeaturesService: LanguageFeaturesService
  ) {
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
    this.connection.onRequest(
      "ColoringService.colorize",
      (request: { uri: string }) => {
        languageFeaturesService.sendColorizeRequest(request.uri);
        return null;
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
  }

  listen() {
    // Make the text document manager listen on the connection
    // for open, change and close text document events
    this.documents.listen(this.connection);

    // Listen on the connection
    this.connection.listen();
  }
}

const connection: _Connection = createConnection();
console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);
const languageFeaturesService = getLanguageFeatures(connection);
const server = new LeoServer(connection, languageFeaturesService);
server.listen();
