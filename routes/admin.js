// routes/admin.js
const express = require("express");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { getUserCollection } = require("../db"); // 👈 importa do db.js

const router = express.Router();

// Todas as rotas abaixo requerem token e role 'admin'
router.use(authenticateToken);
router.use(requireRole(3));

// Listar todos os usuários (ex: id, nome, email, tipo)
router.get("/users", async (req, res) => {
  try {
    const users = await getUserCollection();
    const docs = await users.find({}, { projection: { senha: 0 } }).toArray();
    res.json(docs);
  } catch (err) {
    console.error("❌ Erro em /api/admin/users:", err);
    res.status(500).json({ error: err.message });
  }
});

// Alterar tipo de usuário (body: { userId, tipo })
router.post("/users/change-role", async (req, res) => {
  try {
    const { userId, tipo } = req.body;
    console.log("userID:"+req.body.userId + " tipo:"+req.body.tipo);
    if (!userId) {
      return res.status(400).json({ error: "userId e tipo são obrigatórios" });
    }
    const users = await getUserCollection();
    const { ObjectId } = require("mongodb");

    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { tipo } }
    );

    res.json({ message: "Tipo de usuário atualizado" });
  } catch (err) {
    console.error("❌ Erro em /api/admin/users/change-role:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
