import Game from '../repository/Game.js';
import NotFoundException from '../config/exceptions/NotFoundException.js';

class GameService {
  async create(data) { return await Game.create(data); }
  async findAll() { return await Game.findAll(); }

  async update(id, data) {
    // Busca pela chave primária (Primary Key) no Sequelize
    const existingGame = await Game.findByPk(id);
    
    if (!existingGame) {
      throw new NotFoundException(`Jogo com ID ${id} não encontrado.`);
    }

    // Executa o update passando os dados e a condição (where)
    await Game.update(data, {
      where: { id: id }
    });

    // Retorna o objeto recém-atualizado
    return await Game.findByPk(id);
  }

  async delete(id) {
    const existingGame = await Game.findByPk(id);
    
    if (!existingGame) {
      throw new NotFoundException(`Jogo com ID ${id} não encontrado.`);
    }

    await Game.destroy({
      where: { id: id }
    });

    return true;
  }
}
export default new GameService();