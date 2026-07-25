import Player from '../repository/Player.js';
import BusinessException from '../config/exceptions/BusinessException.js';
import NotFoundException from '../config/exceptions/NotFoundException.js';

class PlayerService {
  async create(playerData) {
    // Verificação de email duplicado
    const existingPlayer = await Player.findOne({ where: { email: playerData.email } });
    
    if (existingPlayer) {
      throw new BusinessException('Email já está em uso.');
    }

    // Cria e retorna o novo jogador
    const newPlayer = await Player.create(playerData);
    
    return newPlayer;
  }

  async findAll() {
    return await Player.findAll();
  }

  async update(id, data) {
    // Busca pela chave primária no banco
    const existingPlayer = await Player.findByPk(id);
    
    if (!existingPlayer) {
      throw new NotFoundException(`Jogador com ID ${id} não encontrado.`);
    }

    // Executa a atualização
    await Player.update(data, {
      where: { id: id }
    });

    // Retorna o jogador com os dados novos
    return await Player.findByPk(id);
  }

  async delete(id) {
    const existingPlayer = await Player.findByPk(id);
    
    if (!existingPlayer) {
      throw new NotFoundException(`Jogador com ID ${id} não encontrado.`);
    }

    await Player.destroy({
      where: { id: id }
    });

    return true;
  }
}

export default new PlayerService();