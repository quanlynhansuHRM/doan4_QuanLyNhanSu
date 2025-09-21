const mysql = require("mysql2/promise");

async function connectDB() {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "mysql",
      database: "quanlynhansu",
    });

    console.log("Kết nối MySQL thành công!");
    return connection;
  } catch (err) {
    console.error("Lỗi kết nối MySQL:", err);
    throw err;
  }
}
connectDB().catch((err) => console.error("Lỗi kết nối MySQL:", err));
module.exports = connectDB;
