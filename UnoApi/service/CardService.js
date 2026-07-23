import Card from '../repository/Card.js';
class CardService {
  async create(data) { return await Card.create(data); }
  async findAll() { return await Card.findAll(); }
}
export default new CardService();