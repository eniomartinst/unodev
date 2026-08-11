import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../controller/GameController.js';
import GameService from '../service/GameService.js';

describe('GameController - Lista de Jogadores', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    mock.restoreAll();
    
    req = {
      body: {}
    };
    
    res = {
      status: mock.fn(function() { return this; }),
      json: mock.fn(),
    };
    
    next = mock.fn();
  });

  describe('Obtenção da lista de jogadores', () => {
    it('Deve retornar a lista atual de jogadores com sucesso (HTTP 200)', async () => {
      // 1. Prepara o payload da requisição exigido pelo gameStateQuerySchema
      req.body = { game_id: 1 };
      
      // 2. Prepara o retorno simulado do Service (o que o banco devolveria)
      const mockServiceResponse = {
        game: { id: 1 },
        playerNames: ['Enio', 'Arthur', 'Kaio', 'Elton']
      };

      mock.method(GameService, 'getPlayers', async () => mockServiceResponse);

      // 3. Executa a função do controlador
      await GameController.getPlayers(req, res, next);

      // 4. Validações
      // Garante que não houve erro de validação (Zod) ou execução
      assert.strictEqual(next.mock.calls.length, 0, 'O next() foi chamado com um erro');
      
      // Valida o status 200
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      
      // Valida se o formato do JSON atende à reconstrução manual feita no Controller
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
        game_id: 1,
        players: ['Enio', 'Arthur', 'Kaio', 'Elton']
      });
    });

    it('Deve realizar o tratamento adequado repassando o erro para o next()', async () => {
      req.body = { game_id: 999 }; // Simulando um ID que não existe
      
      const erroSimulado = new Error('Game not found');

      // Forçamos o Service a disparar um erro
      mock.method(GameService, 'getPlayers', async () => {
        throw erroSimulado;
      });

      await GameController.getPlayers(req, res, next);

      // Valida se o Controller capturou o erro no 'catch' e repassou para o ErrorHandler
      assert.strictEqual(next.mock.calls.length, 1, 'O next() deveria ter sido chamado para tratar o erro');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });
});