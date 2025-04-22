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
exports.deleteConfig = void 0;
const vscode = __importStar(require("vscode"));
async function deleteConfig(configService) {
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
            placeHolder: 'Select a configuration to delete'
        });
        if (!selectedItem) {
            return; // User cancelled
        }
        // Ask for confirmation before deleting
        const confirmed = await vscode.window.showWarningMessage(`Are you sure you want to delete "${selectedItem.config.name}"?`, { modal: true }, 'Delete', 'Cancel');
        if (confirmed !== 'Delete') {
            return; // User cancelled
        }
        await configService.deleteConfig(selectedItem.config.name);
        vscode.window.showInformationMessage(`Deleted configuration: ${selectedItem.config.name}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error deleting configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.deleteConfig = deleteConfig;
//# sourceMappingURL=deleteConfig.js.map