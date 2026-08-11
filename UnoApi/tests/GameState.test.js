import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../controller/GameController.js';
import GameService from '../service/GameService.js';

// ---------------------------------------------------------------------------
// Tarefa 15 — Teste unitário: Obter o estado atual do jogo
// O GameController.getState valida o body via gameStateQuerySchema (game_id),
// delega ao GameService.getGameState e formata via formatGameStateResponse,
// que retorna { game_id: game.id, state: game.status }.
// ---------------------------------------------------------------------------

describe('GameController - Obter Estado do Jogo (Tarefa 15)', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    mock.restoreAll();

    req = {
      params: {},
      body: {},
      user: { id: 1 }
    };

    res = {
      status: mock.fn(function () { return this; }),
      json: mock.fn(),
      send: mock.fn()
    };

    next = mock.fn();
  });

  // ─── SUCESSO ──────────────────────────────────────────────────────────────
  describe('Obtenção bem-sucedida do estado', () => {
    it('Deve retornar o estado atual do jogo com HTTP 200 (jogo em andamento)', async () => {
      req.body = { game_id: 1 };

      // Mock do objeto Game retornado pelo GameService.getGameState
      // O formatGameStateResponse extrai apenas { game_id: game.id, state: game.status }
      const mockGame = {
        id: 1,
        title: 'Sala UNO',
        status: 'in_progress',
        maxPlayers: 4,
        usersInGame: [{ username: 'alice' }, { username: 'bob' }],
        createdAt: '2026-08-09T12:00:00.000Z'
      };

      mock.method(GameService, 'getGameState', async () => mockGame);

      await GameController.getState(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('ERRO INESPERADO NO CONTROLLER:', next.mock.calls[0].arguments[0]);
      }

      assert.strictEqual(next.mock.calls.length, 0, 'next() não deve ser chamado em caso de sucesso');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);

      // Valida que a resposta respeita exatamente o contrato do formatGameStateResponse
      const respostaEsperada = { game_id: 1, state: 'in_progress' };
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], respostaEsperada);
    });

    it('Deve retornar o estado "waiting" para um jogo que ainda não começou', async () => {
      req.body = { game_id: 2 };

      const mockGame = {
        id: 2,
        title: 'Sala Aguardando',
        status: 'waiting',
        maxPlayers: 4,
        usersInGame: [],
        createdAt: '2026-08-09T12:00:00.000Z'
      };

      mock.method(GameService, 'getGameState', async () => mockGame);

      await GameController.getState(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { game_id: 2, state: 'waiting' });
    });
  });

  // ─── ERROS ────────────────────────────────────────────────────────────────
  describe('Tratamento de erros', () => {
    it('Deve chamar next() quando o jogo não for encontrado (informações não disponíveis)', async () => {
      req.body = { game_id: 999 };
      const erroSimulado = new Error('Jogo com ID 999 não encontrado.');

      mock.method(GameService, 'getGameState', async () => { throw erroSimulado; });

      await GameController.getState(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1, 'next() deve ser chamado quando o jogo não existe');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });

    it('Deve chamar next() quando o jogo não está em andamento (status "finished")', async () => {
      req.body = { game_id: 5 };
      const erroSimulado = new Error('O jogo não está em andamento.');

      mock.method(GameService, 'getGameState', async () => { throw erroSimulado; });

      await GameController.getState(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1, 'next() deve ser chamado para jogo encerrado');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });
});
