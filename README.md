# Claude Config Manager

A VS Code extension that helps you manage Claude Desktop configurations, easily switch the active directory in your Claude Desktop Filesystem MCP configuration, and automatically restart Claude when configurations change.

> [!IMPORTANT]
> [Get started with the Filesystem MCP server here](https://modelcontextprotocol.info/docs/quickstart/user/)

## Features

- Switch the active directory in Claude to your current VS Code project
- Create and save multiple Claude Desktop configurations
- Switch between saved configurations with a simple dropdown
- Delete configurations you no longer need
- Automatically restart Claude Desktop when configurations change
- Manually restart Claude Desktop when needed

## Usage

### Switching Active Directory

1. Open a project folder in VS Code
2. Run the command: `Claude: Switch Active Directory to Current Project` (from Command Palette - Ctrl+Shift+P or Cmd+Shift+P)
3. Confirm the change when prompted
4. Claude Desktop will automatically restart if auto-restart is enabled (default)

### Managing Multiple Configurations

#### Create a Configuration

1. Run the command: `Claude: Create New Configuration` from the Command Palette
2. The first time you run this, it will automatically save your current Claude configuration as "Original Config"
3. For subsequent configurations, you'll have two options:
   - Copy your current Claude configuration and give it a new name
   - Create a new empty template that you can customize
4. After creating a configuration, it will automatically open in the editor for you to customize

#### Select a Configuration

1. Run the command: `Claude: Select Active Configuration` from the Command Palette
2. Choose a configuration from the dropdown menu
3. Your Claude Desktop config file will be updated with the selected configuration
4. Claude Desktop will automatically restart if auto-restart is enabled (default)

#### View/Edit a Configuration

1. Run the command: `Claude: View/Edit Configuration` from the Command Palette
2. Select the configuration you want to edit
3. The configuration will open in the editor for you to modify
4. Save the file to update the configuration
5. If the configuration you're editing is the active one, saving will also update the Claude Desktop config file and automatically restart Claude if auto-restart is enabled

#### Delete a Configuration

1. Run the command: `Claude: Delete Configuration` from the Command Palette
2. Select the configuration you want to delete
3. Confirm the deletion when prompted

### Restart Claude Desktop Manually

1. Run the command: `Claude: Restart Desktop App` from the Command Palette
2. Claude will be gracefully shut down and restarted

### Extension Settings

This extension contributes the following settings:

* `claude-config.autoRestartAfterConfigChange`: Enable/disable automatic restarting of Claude Desktop when configurations change (default: `true`)
* `claude-config.restartDelay`: Delay in seconds before restarting Claude after shutdown (default: `2`)

## Requirements

- VS Code version 1.75.0 or higher
- Claude Desktop application installed

## Installation

### From VS Code

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "Claude Config Manager"
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
3. Run `npm run compile` to build the TypeScript files
4. Press F5 to start debugging
5. Use `vsce package` to create a `.vsix` file for installation

## License

MIT
