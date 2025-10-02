const { connectDB } = require("../db");

async function getUserCollection() {
  const db = await connectDB();
  return db.collection("users");
}

module.exports = { getUserCollection };
