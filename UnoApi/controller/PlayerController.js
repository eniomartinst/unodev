import PlayerService from '../service/PlayerService.js';
import { createPlayerSchema } from '../dtos/request/PlayerRequestDTO.js';
import { formatPlayerResponse, formatManyPlayersResponse } from '../dtos/response/PlayerResponseDTO.js';

class PlayerController {
  async create(req, res, next) {
    try {
      // Valida o corpo da requisição com o Zod
      const validatedData = createPlayerSchema.parse(req.body);

      // Chama o service para processar a criacao
      const player = await PlayerService.create(validatedData);

      // Retorna 201 (Created) e a resposta formatada pelo DTO
      return res.status(201).json(formatPlayerResponse(player));
    } catch (error) {
      // Passa o erro adiante para o middleware de tratamento de erro global
      next(error); 
    }
  }

  async findAll(req, res, next) {
    try {
      const players = await PlayerService.findAll();
      return res.status(200).json(formatManyPlayersResponse(players));
    } catch (error) {
      next(error);
    }
  }
}

export default new PlayerController();