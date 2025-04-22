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
exports.ConfigService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class ConfigService {
    /**
     * Get the storage path for the extension
     */
    getStoragePath() {
        return this.extensionStoragePath;
    }
    constructor(context) {
        this.configsKey = 'claude-configs';
        this.activeConfigKey = 'claude-active-config';
        this.extensionContext = context;
        this.extensionStoragePath = context.globalStorageUri.fsPath;
        // Ensure the storage directory exists
        if (!fs.existsSync(this.extensionStoragePath)) {
            fs.mkdirSync(this.extensionStoragePath, { recursive: true });
        }
    }
    /**
     * Get the path to the Claude desktop config file based on the OS
     */
    getClaudeConfigPath() {
        if (process.platform === 'darwin') {
            // macOS
            return path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
        }
        else if (process.platform === 'win32') {
            // Windows
            return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
        }
        else {
            // Not supported
            throw new Error('Unsupported platform');
        }
    }
    /**
     * Get all saved configurations
     */
    getConfigs() {
        const configs = this.extensionContext.globalState.get(this.configsKey) || [];
        return configs;
    }
    /**
     * Get the active configuration name
     */
    getActiveConfigName() {
        return this.extensionContext.globalState.get(this.activeConfigKey);
    }
    /**
     * Get a configuration by name
     */
    getConfig(name) {
        const configs = this.getConfigs();
        return configs.find(c => c.name === name);
    }
    /**
     * Create a new configuration with the given name and content
     */
    async createConfig(name, content) {
        const configs = this.getConfigs();
        // Check if config with this name already exists
        if (configs.some(c => c.name === name)) {
            throw new Error(`Configuration "${name}" already exists`);
        }
        configs.push({ name, content });
        await this.extensionContext.globalState.update(this.configsKey, configs);
        // If this is the first config, set it as active
        if (configs.length === 1) {
            await this.setActiveConfig(name);
        }
    }
    /**
     * Update an existing configuration with new content
     */
    async updateConfig(name, content) {
        const configs = this.getConfigs();
        const configIndex = configs.findIndex(c => c.name === name);
        if (configIndex === -1) {
            throw new Error(`Configuration "${name}" not found`);
        }
        configs[configIndex].content = content;
        await this.extensionContext.globalState.update(this.configsKey, configs);
    }
    /**
     * Delete a configuration by name
     */
    async deleteConfig(name) {
        const configs = this.getConfigs();
        const configIndex = configs.findIndex(c => c.name === name);
        if (configIndex === -1) {
            throw new Error(`Configuration "${name}" not found`);
        }
        configs.splice(configIndex, 1);
        await this.extensionContext.globalState.update(this.configsKey, configs);
        // If the active config was deleted, set a new active config if any exist
        const activeConfigName = this.getActiveConfigName();
        if (activeConfigName === name && configs.length > 0) {
            await this.setActiveConfig(configs[0].name);
        }
        else if (configs.length === 0) {
            await this.extensionContext.globalState.update(this.activeConfigKey, undefined);
        }
    }
    /**
     * Set the active configuration
     */
    async setActiveConfig(name) {
        const config = this.getConfig(name);
        if (!config) {
            throw new Error(`Configuration "${name}" not found`);
        }
        // Update the Claude config file with the selected configuration content
        const claudeConfigPath = this.getClaudeConfigPath();
        try {
            fs.writeFileSync(claudeConfigPath, JSON.stringify(config.content, null, 2), 'utf8');
            await this.extensionContext.globalState.update(this.activeConfigKey, name);
        }
        catch (error) {
            throw new Error(`Failed to update Claude config file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Read the current Claude config file
     */
    readCurrentClaudeConfig() {
        const claudeConfigPath = this.getClaudeConfigPath();
        try {
            if (fs.existsSync(claudeConfigPath)) {
                const content = fs.readFileSync(claudeConfigPath, 'utf8');
                return JSON.parse(content);
            }
        }
        catch (error) {
            throw new Error(`Failed to read Claude config file: ${error instanceof Error ? error.message : String(error)}`);
        }
        return null;
    }
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=configService.js.map