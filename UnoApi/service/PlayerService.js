import Player from '../repository/Player.js';
import BusinessException from '../config/exceptions/BusinessException.js';

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
}

export default new PlayerService();