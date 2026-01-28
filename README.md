# QualigenAI Oracle Bridge (MCP) 🚀

An advanced **Model Context Protocol (MCP)** server that enables Claude Desktop to act as an autonomous Oracle Database Administrator and Data Analyst. 

Unlike standard SQL tools, this bridge allows for **Agentic workflows**, where the AI explores the schema, self-corrects SQL errors, and handles complex joins through natural language.

## 🧠 Agentic Intelligence Features
- **Autonomous Schema Discovery**: Claude identifies tables and relationships without manual mapping.
- **Self-Healing Queries**: Automatically interprets Oracle `ORA-` errors and rewrites SQL to fix issues.
- **Complex Data Handling**: Native support for `CLOB` data types and multi-table `JOIN` operations.
- **Automatic Commits**: Built-in `autoCommit` for persistent DDL (CREATE/DROP) and DML (INSERT/UPDATE) operations.

## 🛠️ Setup Instructions

### 1. Prerequisites
- **Node.js** (v18+)
- **Docker** (for Oracle XE)
- **Claude Desktop**

### 2. Database Setup
Run the Oracle XE container using the following command:
```bash
docker run -d --name qualigenai-db -p 1521:1521 -e ORACLE_PASSWORD='YOURPASSWORD' gvenzl/oracle-xe

3. Environment Configuration
Create a .env file in the root directory:

Code snippet
DB_USER=system
DB_PASSWORD=<YOUR_PASSWORD>
DB_CONNECTION_STRING=localhost:1521/FREEPDB1
4. Build the Bridge
Run these commands to install dependencies and compile the TypeScript code:

Bash
npm install
npm run build
🖥️ Claude Integration
Add this configuration to your claude_desktop_config.json (located at %APPDATA%\Claude\claude_desktop_config.json on Windows):

JSON
{
  "mcpServers": {
    "qualigenai-oracle": {
      "command": "node",
      "args": ["C:/ABS/path/to/your/project/dist/index.js"],
      "env": {
        "DB_USER": "system",
        "DB_PASSWORD": "<YOUR_PASSWORD>",
        "DB_CONNECTION_STRING": "localhost:1521/FREEPDB1"
      }
    }
  }
}

Disclaimer: This project is an independent open-source tool and is not affiliated with, sponsored by, or endorsed by Oracle Corporation. "Oracle" is a registered trademark of Oracle Corporation.