import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../controller/GameController.js';
import GameService from '../service/GameService.js';

describe('GameController - Criar Novo Jogo', () => {
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

  it('Deve criar um novo jogo com sucesso (HTTP 201)', async () => {
    req.body = { title: 'Test Game', maxPlayers: 4 };
    const mockGame = { id: 1, maxPlayers: 4, status: 'waiting', usersInGame: [] };
    
    mock.method(GameService, 'create', async () => mockGame);

    await GameController.create(req, res, next);

    assert.strictEqual(next.mock.calls.length, 0);
    assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
    
    const responseBody = res.json.mock.calls[0].arguments[0];
    assert.strictEqual(responseBody.id, 1);
    assert.strictEqual(responseBody.status, 'waiting');
  });
});
