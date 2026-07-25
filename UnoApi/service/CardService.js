import Card from '../repository/Card.js';
import NotFoundException from '../config/exceptions/NotFoundException.js';
class CardService {
  async create(data) { return await Card.create(data); }
  async findAll() { return await Card.findAll(); }

  async update(id, data) {
    const existingCard = await Card.findByPk(id);
    
    if (!existingCard) {
      throw new NotFoundException(`Cartão com ID ${id} não encontrado.`);
    }

    await Card.update(data, {
      where: { id: id }
    });

    return await Card.findByPk(id);
  }

  async delete(id) {
    const existingCard = await Card.findByPk(id);
    
    if (!existingCard) {
      throw new NotFoundException(`Cartão com ID ${id} não encontrado.`);
    }

    await Card.destroy({
      where: { id: id }
    });

    return true;
  }
}
export default new CardService();