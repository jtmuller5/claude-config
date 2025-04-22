"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultConfigTemplate = void 0;
/**
 * Creates a default template for a new configuration
 */
function createDefaultConfigTemplate() {
    return {
        "mcpServers": {
            "filesystem": {
                "command": "npx",
                "args": [
                    "-y",
                    "@modelcontextprotocol/server-filesystem",
                    "/path/to/your/directory" // User will need to replace this
                ]
            }
            // User can add more servers here
        }
    };
}
exports.createDefaultConfigTemplate = createDefaultConfigTemplate;
//# sourceMappingURL=templates.js.map