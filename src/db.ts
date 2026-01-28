import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Use Thin mode for easier setup
oracledb.initOracleClient();

async function run() {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING
    });

    console.log("-----------------------------------------");
    console.log("SUCCESS: Connected to Oracle Database!");
    
    // Run a classic Oracle test query
    const result = await connection.execute(`SELECT 'QualiGenAI Bridge Active' FROM dual`);
    console.log("DB RESPONSE:", result.rows);
    console.log("-----------------------------------------");

  } catch (err) {
    console.error("CONNECTION ERROR:", err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

run();