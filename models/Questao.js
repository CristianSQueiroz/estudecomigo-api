const mongoose = require('mongoose');

const QuestaoSchema = new mongoose.Schema({
  enunciado: { type: String, required: true },
  alternativas: { type: [String], required: true },
  correta: { type: Number, required: true }, // índice da correta
  materia: { type: String, required: true },
  serie: { type: String, required: true },
  semestre: { type: String, required: true },
  autorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  status: { type: String, default: 'pendente' } // pendente | aprovado | reprovado
});

module.exports = mongoose.model('Questao', QuestaoSchema);
