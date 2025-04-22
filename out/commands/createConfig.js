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
exports.createConfig = void 0;
const vscode = __importStar(require("vscode"));
const editConfig_1 = require("./editConfig");
const templates_1 = require("../utils/templates");
async function createConfig(configService) {
    try {
        // Check if this is the first config - if so, use current Claude config and name it "Original Config"
        const existingConfigs = configService.getConfigs();
        if (existingConfigs.length === 0) {
            // First time configuration - read existing Claude config
            const currentConfig = configService.readCurrentClaudeConfig();
            if (!currentConfig) {
                vscode.window.showErrorMessage('Could not read current Claude configuration');
                return;
            }
            // Save it as "Original Config"
            await configService.createConfig('Original Config', currentConfig);
            vscode.window.showInformationMessage('Saved current Claude configuration as "Original Config"');
            // Open the config for editing
            const config = configService.getConfig('Original Config');
            if (config) {
                await (0, editConfig_1.openConfigForEditing)(configService, config);
            }
            return;
        }
        // Prompt user for creation method
        const createMethod = await vscode.window.showQuickPick([
            { label: 'Copy Current Config', description: 'Create a new config based on your current Claude configuration' },
            { label: 'Create Empty Template', description: 'Create a new config from a basic template' }
        ], { placeHolder: 'How would you like to create a new configuration?' });
        if (!createMethod) {
            return; // User cancelled
        }
        // Prompt user for a new config name
        const configName = await vscode.window.showInputBox({
            prompt: 'Enter a name for the new configuration',
            placeHolder: 'My Config'
        });
        if (!configName) {
            return; // User cancelled
        }
        let configContent;
        if (createMethod.label === 'Copy Current Config') {
            // Read current Claude config and save it with the new name
            configContent = configService.readCurrentClaudeConfig();
            if (!configContent) {
                vscode.window.showErrorMessage('Could not read current Claude configuration');
                return;
            }
        }
        else {
            // Create from template
            configContent = (0, templates_1.createDefaultConfigTemplate)();
        }
        await configService.createConfig(configName, configContent);
        vscode.window.showInformationMessage(`Created new configuration: ${configName}`);
        // Open the config for editing
        const config = configService.getConfig(configName);
        if (config) {
            await (0, editConfig_1.openConfigForEditing)(configService, config);
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error creating configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.createConfig = createConfig;
//# sourceMappingURL=createConfig.js.map