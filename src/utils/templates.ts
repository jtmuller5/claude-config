/**
 * Creates a default template for a new configuration
 */
export function createDefaultConfigTemplate(): any {
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
