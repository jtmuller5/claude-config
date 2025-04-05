# Claude Config Switcher

A simple VS Code extension that switches the active directory in your Claude Desktop Filesystem MCP configuration to point to the current VS Code project.

> [!IMPORTANT]
> [Get started with the Filesystem MCP server here](https://modelcontextprotocol.info/docs/quickstart/user/)

## Features

- Single command to update the Claude Desktop config file
- Confirmation dialog before making changes
- Automatically uses the root of the current workspace

## Usage
    
1. Open a project folder in VS Code
2. Run the command: `Claude: Switch Active Directory to Current Project` (from Command Palette - Ctrl+Shift+P or Cmd+Shift+P)
3. Confirm the change when prompted
4. Restart Claude Desktop for the change to take effect

## Requirements

- VS Code version 1.75.0 or higher
- Claude Desktop application installed

## Installation

### From VS Code

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "Claude Config Switcher"
4. Click Install

### From VSIX file

1. Download the `.vsix` file from the releases
2. Open VS Code
3. Go to Extensions
4. Click the "..." menu and select "Install from VSIX..."
5. Browse to the downloaded file and select it

## Development

To build this extension locally:

1. Clone the repository
2. Run `npm install`
3. Press F5 to start debugging
4. Use `vsce package` to create a `.vsix` file for installation

## License

MIT
