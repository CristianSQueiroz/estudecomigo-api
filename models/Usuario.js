const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  tipo: { type: Number, default: 0 } // 0 = estudante, 1 = professor, 2 = admin
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
