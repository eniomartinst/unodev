import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import ScoreController from '../controller/ScoreController.js';
import ScoreService from '../service/ScoreService.js';

describe('ScoreController - Operações CRUD de Pontuação Histórica', () => {
  let req, res, next;

  beforeEach(() => {
    mock.restoreAll();
    req = { params: {}, body: {} };
    res = {
      status: mock.fn(function() { return this; }),
      json: mock.fn(),
      send: mock.fn()
    };
    next = mock.fn();
  });

  it('Deve criar uma pontuação com sucesso (HTTP 201)', async () => {
    req.body = { playerId: 1, gameId: 1, score: 500 };
    const mockCreated = { id: 1, ...req.body };
    mock.method(ScoreService, 'create', async () => mockCreated);

    await ScoreController.create(req, res, next);

    assert.strictEqual(next.mock.calls.length, 0);
    assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
    assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { ...mockCreated, createdAt: undefined });
  });

  it('Deve retornar todas as pontuações (HTTP 200)', async () => {
    const mockScores = [{ id: 1, playerId: 1, gameId: 1, score: 500 }];
    mock.method(ScoreService, 'findAll', async () => mockScores);

    await ScoreController.findAll(req, res, next);

    assert.strictEqual(next.mock.calls.length, 0);
    assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], [{ ...mockScores[0], createdAt: undefined }]);
  });

  it('Deve atualizar uma pontuação existente (HTTP 200)', async () => {
    req.params.id = 1;
    req.body = { score: 600 };
    const mockUpdated = { id: 1, playerId: 1, gameId: 1, score: 600 };
    mock.method(ScoreService, 'update', async () => mockUpdated);

    await ScoreController.update(req, res, next);

    assert.strictEqual(next.mock.calls.length, 0);
    assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
  });

  it('Deve deletar uma pontuação com sucesso (HTTP 204)', async () => {
    req.params.id = 1;
    mock.method(ScoreService, 'delete', async () => true);

    await ScoreController.delete(req, res, next);

    assert.strictEqual(next.mock.calls.length, 0);
    assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
  });
});
