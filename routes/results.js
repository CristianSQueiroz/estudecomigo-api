const express = require("express");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { getResultCollection } = require("../db");
const { ObjectId } = require("mongodb");

const router = express.Router();

// Salvar resultado de um quiz
router.post("/save", authenticateToken, requireRole(0), async (req, res) => {
  try {
    const { quizId, respostas, nota } = req.body;
    if (!quizId || !respostas) {
      return res.status(400).json({ error: "quizId e respostas são obrigatórios" });
    }

    const results = await getResultCollection();
    const resultado = {
      quizId: new ObjectId(quizId),
      alunoId: req.user.id,
      respostas,
      nota,
      createdAt: new Date()
    };

    await results.insertOne(resultado);
    res.json({ message: "Resultado salvo com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar resultados do aluno logado
router.get("/mine", authenticateToken, requireRole(0), async (req, res) => {
  try {
    const results = await getResultCollection();
    const docs = await results.find({ alunoId: req.user.id }).toArray();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
