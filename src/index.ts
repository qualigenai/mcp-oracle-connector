import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Create the MCP Server
const server = new Server(
  { name: "qualigenai-oracle-bridge", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Register the tools for the AI
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_oracle_tables",
      description: "Lists all tables in the Oracle database to understand the data structure.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "execute_query",
      description: "Execute any SQL command (CREATE, INSERT, SELECT, UPDATE, DELETE) on the Oracle database.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "The full SQL query to execute" }
        },
        required: ["sql"]
      }
    }
  ]
}));

// Handle the AI's request to use the tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  let conn;
  try {
    conn = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING
    });

    if (name === "list_oracle_tables") {
      const result = await conn.execute("SELECT table_name FROM user_tables");
      return { content: [{ type: "text", text: JSON.stringify(result.rows) }] };
    }

    if (name === "execute_query") {
      const sql = (args as any).sql;
      // autoCommit is essential for DDL and DML operations to persist
      const result = await conn.execute(sql, [], { autoCommit: true });
      
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify(result.rows || { message: "Command executed successfully", rowsAffected: result.rowsAffected }) 
        }] 
      };
    }

    throw new Error(`Tool not found: ${name}`);

  } catch (err: any) {
    return { 
      content: [{ type: "text", text: `Oracle Error: ${err.message}` }], 
      isError: true 
    };
  } finally {
    if (conn) await conn.close();
  }
});

// Start the bridge
const transport = new StdioServerTransport();
await server.connect(transport);