"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openConfigForEditing = exports.editConfig = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function editConfig(configService) {
    try {
        const configs = configService.getConfigs();
        if (configs.length === 0) {
            vscode.window.showInformationMessage('No configurations found. Create a configuration first.');
            return;
        }
        const activeConfigName = configService.getActiveConfigName();
        const configItems = configs.map(config => ({
            label: config.name,
            description: config.name === activeConfigName ? '(active)' : '',
            config
        }));
        const selectedItem = await vscode.window.showQuickPick(configItems, {
            placeHolder: 'Select a configuration to edit'
        });
        if (!selectedItem) {
            return; // User cancelled
        }
        await openConfigForEditing(configService, selectedItem.config);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error editing configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.editConfig = editConfig;
// Helper function to open a config for editing
async function openConfigForEditing(configService, config) {
    // Create a temp file in the extension's storage directory
    const storageDir = configService.getStoragePath();
    const tempFilePath = path.join(storageDir, `${config.name.replace(/[^a-z0-9]/gi, '_')}_config.json`);
    // Write the config to the temp file
    fs.writeFileSync(tempFilePath, JSON.stringify(config.content, null, 2), 'utf8');
    // Open the file in the editor
    const doc = await vscode.workspace.openTextDocument(tempFilePath);
    const editor = await vscode.window.showTextDocument(doc);
    // Register a command to save the config when the file is saved
    const disposable = vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
        if (savedDoc.fileName === tempFilePath) {
            try {
                // Parse the updated content
                const updatedContent = JSON.parse(savedDoc.getText());
                // Update the config
                await configService.updateConfig(config.name, updatedContent);
                // If this is the active config, update the Claude config file
                if (config.name === configService.getActiveConfigName()) {
                    await configService.setActiveConfig(config.name);
                }
                vscode.window.showInformationMessage(`Configuration "${config.name}" updated successfully.`);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });
    // Clean up the event listener when the editor is closed
    const closeDisposable = vscode.window.onDidChangeVisibleTextEditors((editors) => {
        if (!editors.some(e => e.document.fileName === tempFilePath)) {
            disposable.dispose();
            closeDisposable.dispose();
        }
    });
}
exports.openConfigForEditing = openConfigForEditing;
//# sourceMappingURL=editConfig.js.map