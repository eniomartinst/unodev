import GameService from '../service/GameService.js';
import { createGameSchema } from '../dtos/request/GameRequestDTO.js';
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
}
export default new GameController();