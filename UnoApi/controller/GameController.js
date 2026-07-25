import GameService from '../service/GameService.js';
import { createGameSchema, updateGameSchema } from '../dtos/request/GameRequestDTO.js';
import { formatGameResponse, formatManyGamesResponse } from '../dtos/response/GameResponseDTO.js';

class GameController {
  async create(req, res, next) {
    try {
      const validatedData = createGameSchema.parse(req.body);
      const game = await GameService.create(validatedData);
      return res.status(201).json(formatGameResponse(game));
    } catch (error) { next(error); }
  }

  async findAll(req, res, next) {
    try {
      const games = await GameService.findAll();
      return res.status(200).json(formatManyGamesResponse(games));
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = updateGameSchema.parse(req.body); 
      const updatedGame = await GameService.update(id, validatedData);
      return res.status(200).json(formatGameResponse(updatedGame));
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await GameService.delete(id);
      return res.status(204).send();
    } catch (error) { next(error); }
  }
}
export default new GameController();
