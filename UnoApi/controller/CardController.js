import CardService from '../service/CardService.js';
import { createCardSchema } from '../dtos/request/CardRequestDTO.js';
import { formatCardResponse, formatManyCardsResponse } from '../dtos/response/CardResponseDTO.js';

class CardController {
  async create(req, res, next) {
    try {
      const validatedData = createCardSchema.parse(req.body);
      const card = await CardService.create(validatedData);
      return res.status(201).json(formatCardResponse(card));
    } catch (error) { next(error); }
  }

  async findAll(req, res, next) {
    try {
      const cards = await CardService.findAll();
      return res.status(200).json(formatManyCardsResponse(cards));
    } catch (error) { next(error); }
  }
}
export default new CardController();