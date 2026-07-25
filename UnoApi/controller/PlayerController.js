import PlayerService from '../service/PlayerService.js';
import { createPlayerSchema, updatePlayerSchema } from '../dtos/request/PlayerRequestDTO.js';
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

async update(req, res, next) {
    try {
      const { id } = req.params;
      
      // Valida o corpo da requisição usando o seu novo schema parcial
      const validatedData = updatePlayerSchema.parse(req.body); 

      // Chama o service para realizar a atualização passando os dados já validados
      const updatedPlayer = await PlayerService.update(id, validatedData);

      // Retorna 200 (OK) e a resposta padronizada
      return res.status(200).json(formatPlayerResponse(updatedPlayer));
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await PlayerService.delete(id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new PlayerController();
