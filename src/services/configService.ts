import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ClaudeService } from './claudeService';

export interface ConfigItem {
    name: string;
    content: any;
}

export class ConfigService {
    private extensionContext: vscode.ExtensionContext;
    private extensionStoragePath: string;
    /**
     * Get the storage path for the extension
     */
    public getStoragePath(): string {
        return this.extensionStoragePath;
    }
    private configsKey: string = 'claude-configs';
    private activeConfigKey: string = 'claude-active-config';

    constructor(context: vscode.ExtensionContext) {
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
    public getClaudeConfigPath(): string {
        return ClaudeService.getClaudeConfigPath();
    }

    /**
     * Get all saved configurations
     */
    public getConfigs(): ConfigItem[] {
        const configs = this.extensionContext.globalState.get<ConfigItem[]>(this.configsKey) || [];
        return configs;
    }

    /**
     * Get the active configuration name
     */
    public getActiveConfigName(): string | undefined {
        return this.extensionContext.globalState.get<string>(this.activeConfigKey);
    }

    /**
     * Get a configuration by name
     */
    public getConfig(name: string): ConfigItem | undefined {
        const configs = this.getConfigs();
        return configs.find(c => c.name === name);
    }

    /**
     * Create a new configuration with the given name and content
     */
    public async createConfig(name: string, content: any): Promise<void> {
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
    public async updateConfig(name: string, content: any): Promise<void> {
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
    public async deleteConfig(name: string): Promise<void> {
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
        } else if (configs.length === 0) {
            await this.extensionContext.globalState.update(this.activeConfigKey, undefined);
        }
    }

    /**
     * Set the active configuration
     */
    public async setActiveConfig(name: string): Promise<void> {
        const config = this.getConfig(name);
        
        if (!config) {
            throw new Error(`Configuration "${name}" not found`);
        }
        
        // Update the Claude config file with the selected configuration content
        const claudeConfigPath = this.getClaudeConfigPath();
        
        try {
            fs.writeFileSync(claudeConfigPath, JSON.stringify(config.content, null, 2), 'utf8');
            await this.extensionContext.globalState.update(this.activeConfigKey, name);
            
            // Auto-restart Claude if enabled
            const autoRestart = vscode.workspace.getConfiguration('claude-config').get<boolean>('autoRestartAfterConfigChange', true);
            if (autoRestart) {
                vscode.window.showInformationMessage('Claude config updated, restarting Claude...');
                await ClaudeService.restartClaude();
            }
        } catch (error) {
            throw new Error(`Failed to update Claude config file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Read the current Claude config file
     */
    public readCurrentClaudeConfig(): any {
        const claudeConfigPath = this.getClaudeConfigPath();
        
        try {
            if (fs.existsSync(claudeConfigPath)) {
                const content = fs.readFileSync(claudeConfigPath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            throw new Error(`Failed to read Claude config file: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        return null;
    }
}
