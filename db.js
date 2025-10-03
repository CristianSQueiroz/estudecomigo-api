const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGO_URI;
//const uri ="mongodb://localhost:27017";


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

async function connectDB() {
  if (!db) {
    try {
      await client.connect();
      db = client.db("EstudeComigoDB"); // 👈 nome do banco
      console.log("✅ Conectado ao MongoDB Atlas!");
    } catch (err) {
      console.error("❌ Erro ao conectar MongoDB:", err);
    }
  }
  return db;
}

// 👉 função para acessar a coleção "users"
async function getUserCollection() {
  const database = await connectDB();
  return database.collection("users");
}

// 👉 função para acessar a coleção "questions"
async function getQuestionCollection() {
  const database = await connectDB();
  return database.collection("questions");
}

async function getQuizCollection() {
  const database = await connectDB();
  return database.collection("quizzes");
}

async function getResultCollection() {
  const database = await connectDB();
  return database.collection("results");
}

module.exports = { connectDB, getUserCollection, getQuestionCollection, getQuizCollection, getResultCollection };

