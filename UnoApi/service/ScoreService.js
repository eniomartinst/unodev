import Score from '../repository/Score.js';
class ScoreService {
  async create(data) { return await Score.create(data); }
  async findAll() { return await Score.findAll(); }
}
export default new ScoreService();