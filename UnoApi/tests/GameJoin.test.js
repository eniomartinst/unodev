import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../controller/GameController.js';
import GameService from '../service/GameService.js';

describe('GameController - Ingressar em um Jogo (Tarefa 11)', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    mock.restoreAll();
    req = {
      user: { id: 1 },
      body: {}
    };
    res = {
      status: mock.fn(function() { return this; }),
      json: mock.fn(),
    };
    next = mock.fn();
  });

  describe('Fluxo de entrada na mesa', () => {
    it('Deve ingressar em um jogo disponível com sucesso (HTTP 200)', async () => {
      req.body = { game_id: 15, access_token: 'token_valido' };
      
      mock.method(GameService, 'joinGame', async () => true);

      await GameController.join(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0, 'O next() não deve ser chamado em caso de sucesso');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { message: "User joined the game successfully" });
    });

    it('Deve repassar o erro para o next() se o jogo estiver cheio ou indisponível', async () => {
      req.body = { game_id: 99, access_token: 'token_valido' };
      const erroSimulado = new Error('Game is full or not available');
      
      mock.method(GameService, 'joinGame', async () => {
        throw erroSimulado;
      });

      await GameController.join(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1, 'O next() deveria ser acionado para lidar com o erro de negócio');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });
});