import os
import sublime, sublime_plugin
from lsp_utils import NpmClientHandler
from LSP.plugin.core.registry import windows
from LSP.plugin.core.protocol import Request
from LSP.plugin.core.views import range_to_region, region_to_range
from LSP.plugin.core.typing import Any, Dict
from LSP.plugin.core.url import view_to_uri
from lsp_utils import request_handler
from LSP.plugin import uri_to_filename
from LSP.plugin.documents import DocumentSyncListener

def plugin_loaded() -> None:
    LspLeoPlugin.setup()
    setup_leohover_settings()

def plugin_unloaded() -> None:
    LspLeoPlugin.cleanup()

def setup_leohover_settings() -> None:  
    preferences_filename = 'Preferences.sublime-settings'
    preferences = sublime.load_settings(preferences_filename)
    value = preferences.get("mdpopups.sublime_user_lang_map")
    value["leohover"] = (('leohover',), ('LSP-leo/leoHover',))
    preferences.set("mdpopups.sublime_user_lang_map", value)
    sublime.save_settings(preferences_filename)

class LspLeoPlugin(NpmClientHandler):
    package_name = __package__
    server_directory = 'language-server'
    server_binary_path = os.path.join(server_directory, 'server.js')
    skip_npm_install = True
    
    @request_handler('ColoringService.colorize')
    def on_coloring_service_colorize(self, request, response):
        filename = uri_to_filename(request['uri'])
        view = sublime.active_window().find_open_file(filename)

        if view:
            syntax_coloring = SyntaxColoring()
            syntax_coloring.view = view
            syntax_coloring.colorize(request)
        # Server doesn't require any specific response.
        response(None)

def sendColorizeRequest(view):
    listener = windows.listener_for_view(view)
    if listener:
        language = listener.get_language_id()
        if language == "leo":    
            exists = bool(listener.session_async('hoverProvider'))
            if not exists:
                # if there is no listener need to wait for it
                print("No listener found!")
                return
            for session in listener.sessions_async():
                uri = view_to_uri(view)
                params = {"uri": uri}
                request = Request("ColoringService.colorize", params)
                session.send_request_async(request, lambda res: res, lambda res: res)

class SyntaxColoringViewListener(sublime_plugin.ViewEventListener):
    def on_selection_modified_async(self):
        sendColorizeRequest(self.view)

class SyntaxColoring():
    def colorize(self, request) -> None:
        settings = self.view.settings()
        color_scheme = settings.get("color_scheme")
        if color_scheme != "Packages/LSP-leo/leo.sublime-color-scheme":
            return None
        highlight_line = settings.get("highlight_line")
        for key, values in request["scopes"].items():
            if len(values):
                flags = sublime.DRAW_NO_OUTLINE
                regularScope = key
                highlightedScope = key.replace("server.leo", "highlight.server.leo")
                self.view.erase_regions(regularScope)
                self.view.erase_regions(highlightedScope)
                regularRegions = []
                highlightedRegions = []
                for item in values:
                    lsp_range = self.server_range_to_lsp(item)
                    region = range_to_region(lsp_range, self.view)
                    selected_row = self.view.sel()
                    cursorRegion = selected_row[0]
                    scope = regularScope
                    is_point = cursorRegion.begin() == cursorRegion.end()
                    
                    if not is_point and selected_row.contains(region):
                        scope = highlightedScope

                    if is_point and highlight_line:
                        cursorRange = region_to_range(self.view, cursorRegion)
                        if lsp_range.start.row == cursorRange.start.row:
                            scope = highlightedScope

                    if scope == regularScope:
                        regularRegions.append(region)
                    else:
                        highlightedRegions.append(region)

                self.view.add_regions(regularScope, regularRegions, scope=regularScope, flags=flags)
                self.view.add_regions(highlightedScope, highlightedRegions, scope=highlightedScope, flags=flags)
                    

    def server_range_to_lsp(self, sever_range: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'start': {
                "line": sever_range["start"]["row"],
                "character": sever_range["start"]["column"]
            },
            'end': {
                "line": sever_range["end"]["row"],
                "character": sever_range["end"]["column"]
            }
        }
