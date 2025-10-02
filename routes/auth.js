// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getUserCollection } = require("../db");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

const router = express.Router();

// Função auxiliar para enviar email
async function sendResetEmail(to, token) {
  const transporter = nodemailer.createTransport({
    service: "gmail", // pode trocar por outro provider (Outlook, SendGrid etc.)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: '"Estude Comigo" <no-reply@estudecomigo.com>',
    to,
    subject: "Recuperação de senha",
    text: `Use este código para redefinir sua senha: ${token}`,
    html: `<p>Use este código para redefinir sua senha:</p><h3>${token}</h3>`,
  });

  console.log("📧 Email enviado:", info.messageId);
}

// Registro de usuário
router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha, tipo } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
    }

    const users = await getUserCollection();
    const existing = await users.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email já cadastrado" });

    const hashed = await bcrypt.hash(senha, 10);

    const novoUsuario = {
      nome,
      email,
      senha: hashed,
      tipo: Number(tipo) || 0, // default estudante
      createdAt: new Date(),
    };

    const result = await users.insertOne(novoUsuario);

    res.json({ message: "Usuário registrado com sucesso", id: result.insertedId });
  } catch (err) {
    console.error("❌ Erro register:", err);
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const users = await getUserCollection();
    const user = await users.findOne({ email });
    if (!user) return res.status(400).json({ error: "Usuário não encontrado" });

    const match = await bcrypt.compare(senha, user.senha);
    if (!match) return res.status(400).json({ error: "Senha inválida" });

    const token = jwt.sign(
      { id: user._id, tipo: user.tipo },
      process.env.JWT_SECRET || "seuSegredo",
      { expiresIn: "1h" }
    );

    res.json({ message: "Login efetuado com sucesso", token, tipo: user.tipo });
  } catch (err) {
    console.error("❌ Erro login:", err);
    res.status(500).json({ error: err.message });
  }
});

// Esqueci minha senha
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const users = await getUserCollection();

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 3600000); // expira em 1h

    await users.updateOne(
      { _id: user._id },
      { $set: { resetToken: token, resetExpires: expires } }
    );

    await sendResetEmail(email, token);

    res.json({ message: "Instruções enviadas para o email" });
  } catch (err) {
    console.error("❌ Erro forgot-password:", err);
    res.status(500).json({ error: err.message });
  }
});

// Redefinir senha
router.post("/reset-password", async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    const users = await getUserCollection();

    const user = await users.findOne({
      resetToken: token,
      resetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Token inválido ou expirado" });
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    await users.updateOne(
      { _id: user._id },
      {
        $set: { senha: hashedPassword },
        $unset: { resetToken: "", resetExpires: "" },
      }
    );

    res.json({ message: "Senha redefinida com sucesso" });
  } catch (err) {
    console.error("❌ Erro reset-password:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
