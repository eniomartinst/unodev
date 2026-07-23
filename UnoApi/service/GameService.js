import Game from '../repository/Game.js';
class GameService {
  async create(data) { return await Game.create(data); }
  async findAll() { return await Game.findAll(); }
}
export default new GameService();