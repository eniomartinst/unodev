import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../controller/GameController.js';
import GameService from '../service/GameService.js';

describe('GameController - Deixar o Jogo (Tarefa 13)', () => {
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

  describe('Fluxo de saída da mesa', () => {
    it('Deve sair de um jogo em andamento com sucesso (HTTP 200)', async () => {
      req.body = { game_id: 15, access_token: 'token_valido' };
      
      mock.method(GameService, 'leaveGame', async () => true);

      await GameController.leave(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0, 'O next() não deve ser chamado em caso de sucesso');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { message: "User left the game successfully" });
    });

    it('Deve repassar o erro para o next() se o jogo não estiver em andamento ou jogador não estiver nele', async () => {
      req.body = { game_id: 99, access_token: 'token_valido' };
      
      const erroSimulado = new Error('Usuário não encontrado nesta partida');
      
      mock.method(GameService, 'leaveGame', async () => {
        throw erroSimulado;
      });

      await GameController.leave(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1, 'O next() deveria ser acionado para lidar com o erro de negócio');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });
});