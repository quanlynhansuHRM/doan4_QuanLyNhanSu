const mysql = require("mysql2/promise");

async function connectDB() {
  try {
    const pool = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "mysql",
      database: "quanlynhansu",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log("Kết nối MySQL thành công!");
    return pool;
  } catch (err) {
    console.error("Lỗi kết nối MySQL:", err.message);
    throw err;
  }
}

module.exports = connectDB;
