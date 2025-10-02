const express = require("express");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { getQuestionCollection, getQuizCollection } = require("../db");
const { ObjectId } = require("mongodb");

const router = express.Router();

// Criar quiz (professor/admin)
router.post("/create", authenticateToken, requireRole(1), async (req, res) => {
  try {
    const { titulo, questoes } = req.body;
    if (!titulo || !questoes || questoes.length === 0) {
      return res.status(400).json({ error: "Título e questões são obrigatórios" });
    }

    const quizzes = await getQuizCollection();
    const novoQuiz = {
      titulo,
      questoes: questoes.map(q => ({ questaoId: new ObjectId(q) })),
      criadorId: req.user.id,
      status: "ativo",
      createdAt: new Date()
    };

    const result = await quizzes.insertOne(novoQuiz);
    res.json({ message: "Quiz criado com sucesso!", id: result.insertedId });
  } catch (err) {
    console.error("❌ Erro ao criar quiz:", err);
    res.status(500).json({ error: err.message });
  }
});

// Listar quizzes ativos (para estudantes)
router.get("/list", authenticateToken, requireRole(0), async (req, res) => {
  try {
    const quizzes = await getQuizCollection();
    const lista = await quizzes.find({ status: "ativo" }).toArray();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter quiz específico com questões
router.get("/get/:id", authenticateToken, requireRole(0), async (req, res) => {
  try {
    const { id } = req.params;
    const quizzes = await getQuizCollection();
    const questions = await getQuestionCollection();

    const quiz = await quizzes.findOne({ _id: new ObjectId(id) });
    if (!quiz) return res.status(404).json({ error: "Quiz não encontrado" });

    const questoes = await Promise.all(
      quiz.questoes.map(async q => {
        const questao = await questions.findOne(
          { _id: q.questaoId },
          { projection: { enunciado: 1, opcoes: 1 } }
        );
        return questao;
      })
    );

    res.json({ ...quiz, questoes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/generate", authenticateToken, requireRole(0), async (req, res) => {
  try {
    const { subject, grade, semester, countryGrade, quantidade } = req.body;
    const questions = await getQuestionCollection();

    const filtro = {
      subject,
      grade,
      semester,
      countryGrade,
      status: "aprovada" // só questões aprovadas
    };

    const questoes = await questions.aggregate([
      { $match: filtro },
      { $sample: { size: quantidade || 10 } } // pega aleatório
    ]).toArray();

    if (!questoes.length) {
      return res.status(404).json({ error: "Nenhuma questão encontrada" });
    }

    // quiz gerado dinamicamente
    res.json({
      titulo: `Prova de ${subject} - ${grade}ª série (${semester}º semestre)`,
      questoes
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
