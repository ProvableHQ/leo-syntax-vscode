# Official leo features plugin

Leo is a new programming language built with intuitive semantics to enable developers to write applications that are private-by-default and formally verified.

Aleo programs are files with a .aleo extension. Aleo programs contain Aleo instructions - an assembly-like programming language. Aleo instructions are compiled into AVM opcodes that can be executed by the Aleo Virtual Machine.

https://developer.aleo.org/overview/

Leo support for Sublime's LSP plugin provided through language-server.

### Installation

- Install [LSP](https://packagecontrol.io/packages/LSP) and [LSP-leo](https://packagecontrol.io/packages/LSP-leo) from Package Control.
- Restart Sublime.

### Recommendations

In order for the highlighting of tokens, hover, and token semantics to work, you need to select a color scheme.

- From `Preferences > Select Color Scheme... > LSP-leo`

### Configuration

There are some ways to configure the package and the language server.

- From `Preferences > Package Settings > LSP > Servers > LSP-leo`
- From the command palette `Preferences: LSP-leo Settings`
