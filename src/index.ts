import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

const ENABLE_SELF_HEALING = process.env.ENABLE_SELF_HEALING === 'true';
const RETRY_LIMIT = parseInt(process.env.RETRY_LIMIT || '3');

async function getStableConnection(): Promise<oracledb.Connection> {
    let attempts = 0;
    while (attempts < RETRY_LIMIT) {
        try {
            return await oracledb.getConnection({
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                connectString: process.env.DB_CONNECTION_STRING
            });
        } catch (err: any) {
            attempts++;
            console.error(`[DB-RETRY] Attempt ${attempts}/${RETRY_LIMIT} failed: ${err.message}`);
            if (!ENABLE_SELF_HEALING || attempts >= RETRY_LIMIT) throw err;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    throw new Error("Failed to connect to Oracle after retries.");
}

const server = new Server(
    { name: "qualigenai-oracle-bridge", version: "1.1.0" }, 
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "list_oracle_tables",
            description: "Lists all tables in the Oracle database.",
            inputSchema: { type: "object", properties: {} }
        },
        {
            name: "execute_query",
            description: "Execute any SQL command.",
            inputSchema: {
                type: "object",
                properties: {
                    sql: { type: "string", description: "The full SQL query" }
                },
                required: ["sql"]
            }
        }
    ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    let conn: oracledb.Connection | undefined;

    try {
        conn = await getStableConnection();

        if (name === "list_oracle_tables" && conn) {
            const result = await conn.execute("SELECT table_name FROM user_tables");
            return { content: [{ type: "text", text: JSON.stringify(result.rows) }] };
        }

        if (name === "execute_query" && conn) {
            const sql = (args as { sql: string }).sql;
            try {
                const result = await conn.execute(sql, [], { autoCommit: true });
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result.rows || { 
                            message: "Command executed successfully", 
                            rowsAffected: result.rowsAffected 
                        })
                    }]
                };
            } catch (sqlErr: any) {
                let advice = "";
                if (sqlErr.message.includes("ORA-00942")) {
                    advice = " TIP: Table not found. Try list_oracle_tables.";
                } else if (sqlErr.message.includes("ORA-00904")) {
                    advice = " TIP: Invalid column name.";
                }
                return {
                    content: [{ type: "text", text: `Oracle SQL Error: ${sqlErr.message}.${advice}` }],
                    isError: true
                };
            }
        }
        throw new Error(`Tool not found: ${name}`);
    } catch (err: any) {
        return {
            content: [{ type: "text", text: `Error: ${err.message}` }],
            isError: true
        };
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) { console.error("Close error", e); }
        }
    }
});

const transport = new StdioServerTransport();
await server.connect(transport);