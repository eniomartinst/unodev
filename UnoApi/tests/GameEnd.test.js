import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../controller/GameController.js';
import GameService from '../service/GameService.js';

describe('GameController - Finalizar o Jogo', () => {
  let req, res, next;

  beforeEach(() => {
    mock.restoreAll();
    req = { body: {} };
    res = {
      status: mock.fn(function() { return this; }),
      json: mock.fn()
    };
    next = mock.fn();
  });

  it('Deve finalizar um jogo com sucesso (HTTP 200)', async () => {
    req.body = { game_id: 1, access_token: 'token_valido' };
    
    mock.method(GameService, 'endGame', async () => true);

    await GameController.end(req, res, next);

    assert.strictEqual(next.mock.calls.length, 0);
    assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    
    const responseBody = res.json.mock.calls[0].arguments[0];
    assert.strictEqual(responseBody.message, 'Game ended successfully');
  });

  it('Deve repassar erros da camada de serviço', async () => {
    req.body = { game_id: 1, access_token: 'token_valido' };
    
    const businessError = new Error('Apenas o criador do jogo pode encerrá-lo.');
    mock.method(GameService, 'endGame', async () => {
      throw businessError;
    });

    await GameController.end(req, res, next);

    assert.strictEqual(next.mock.calls.length, 1);
    assert.strictEqual(next.mock.calls[0].arguments[0], businessError);
  });
});
