import Score from '../repository/Score.js';
import NotFoundException from '../config/exceptions/NotFoundException.js';
class ScoreService {
  async create(data) { return await Score.create(data); }
  async findAll() { return await Score.findAll(); }

  async update(id, data) {
    const existingScore = await Score.findByPk(id);
    
    if (!existingScore) {
      throw new NotFoundException(`Pontuação com ID ${id} não encontrada.`);
    }

    await Score.update(data, {
      where: { id: id }
    });

    return await Score.findByPk(id);
  }

  async delete(id) {
    const existingScore = await Score.findByPk(id);
    
    if (!existingScore) {
      throw new NotFoundException(`Pontuação com ID ${id} não encontrada.`);
    }

    await Score.destroy({
      where: { id: id }
    });

    return true;
  }
}
export default new ScoreService();