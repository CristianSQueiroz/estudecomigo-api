const Questao = require('../models/Questao');

exports.getQuestoesPendentes = async (req, res) => {
  try {
    const questoes = await Questao.find({ status: 'pendente' })
      .populate('autorId', 'nome email'); // traz nome e email do professor

    res.json(questoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar questões', details: err.message });
  }
};
