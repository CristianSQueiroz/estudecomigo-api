require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");
const app = express(); // 👈 Inicializa o app primeiro
const authRoutes = require("./routes/auth"); 
const adminRoutes = require("./routes/admin");
const questionRoutes = require("./routes/questions");

const quizRoutes = require("./routes/quizzes");
const resultRoutes = require("./routes/results");

// Middlewares
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Servidor Estude Comigo rodando!");
});

// Inicializar conexão
connectDB();

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/results", resultRoutes);



// Start servidor
app.listen(3000, () => console.log("🚀 Servidor rodando em http://localhost:3000"));
// exemplo Express
app.listen(3000, '0.0.0.0', () => console.log('Server ok na porta 3000'));



