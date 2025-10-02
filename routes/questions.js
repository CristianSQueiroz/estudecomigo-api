// routes/questions.js
const express = require("express");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { getQuestionCollection } = require("../db");

const router = express.Router();

// Professores podem cadastrar questões
router.post("/create", authenticateToken, requireRole(1), async (req, res) => {
  try {
    const { enunciado, alternativas, correta, materia, serie, semestre, countryGrade } = req.body;

    if (!enunciado || !alternativas || alternativas.length < 2) {
      return res.status(400).json({ error: "Questão inválida: precisa de enunciado e pelo menos 2 alternativas" });
    }

    const questions = await getQuestionCollection();

    const novaQuestao = {
      enunciado,
      alternativas,       // 👈 bate com o app
      correta,            // índice da resposta correta
      materia,            // disciplina / matéria
      serie,
      semestre,
      countryGrade,       // país
      autorId: req.user.id, // quem cadastrou
      status: "pendente",
      motivoReprovacao: null,
      createdAt: new Date()
    };

    const result = await questions.insertOne(novaQuestao);

    res.json({ message: "Questão cadastrada com sucesso!", id: result.insertedId });
  } catch (err) {
    console.error("❌ Erro ao cadastrar questão:", err);
    res.status(500).json({ error: err.message });
  }
});

// Questões criadas pelo professor logado
router.get("/mine", authenticateToken, requireRole([2, 3]), async (req, res) => {
  try {
    const questions = await getQuestionCollection();
    const minhasQuestoes = await questions.find({ autorId: req.user.id }).toArray();
    res.json(minhasQuestoes);
  } catch (err) {
    console.error("❌ Erro ao listar questões do professor:", err);
    res.status(500).json({ error: err.message });
  }
});

// Questões pendentes (para admin ou validador revisar)
router.get("/pending", authenticateToken, requireRole([2, 3]), async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const questions = await getQuestionCollection();
    const { getUserCollection } = require("../models/user"); // importa a função
    const usersCollection = await getUserCollection();

    // busca todas as questões pendentes
    const pendentes = await questions.find({ status: "pendente" }).toArray();

    // adiciona o objeto autor com nome e email em cada questão
    for (let q of pendentes) {
      if (q.autorId) {
        const user = await usersCollection.findOne({ _id: new ObjectId(q.autorId) });
        q.autor = user
          ? { nome: user.nome, email: user.email }
          : { nome: "Desconhecido" };
      }
    }

    res.json(pendentes);
  } catch (err) {
    console.error("❌ Erro ao listar pendentes:", err);
    res.status(500).json({ error: err.message });
  }
});


// Validar questão (aprovar ou reprovar com motivo)
router.post("/validate", authenticateToken, requireRole([2, 3]), async (req, res) => {
  try {
    const { questaoId, acao, motivo } = req.body;
    if (!questaoId || !acao) {
      return res.status(400).json({ error: "questaoId e acao são obrigatórios" });
    }

    const { ObjectId } = require("mongodb");
    const questions = await getQuestionCollection();

    let updateData = {};
    if (acao === "aprovar") {
      updateData = { status: "aprovada", motivoReprovacao: null };
    } else if (acao === "reprovar") {
      updateData = { status: "reprovada", motivoReprovacao: motivo || "Sem motivo informado" };
    } else {
      return res.status(400).json({ error: "Ação inválida" });
    }

    await questions.updateOne({ _id: new ObjectId(questaoId) }, { $set: updateData });

    res.json({ message: `Questão ${acao} com sucesso` });
  } catch (err) {
    console.error("❌ Erro ao validar questão:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
