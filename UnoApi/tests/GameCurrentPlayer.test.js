import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../controller/GameController.js';
import GameService from '../service/GameService.js';

// ---------------------------------------------------------------------------
// Tarefa 17 — Teste unitário: Obter o jogador atual que deve jogar uma carta
// O GameController.getCurrentPlayer valida o body via gameStateQuerySchema (game_id),
// delega ao GameService.getCurrentTurnPlayer e retorna { game_id, current_player }.
// ---------------------------------------------------------------------------

describe('GameController - Obter Jogador Atual do Turno (Tarefa 17)', () => {
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
  describe('Obtenção bem-sucedida do jogador atual', () => {
    it('Deve retornar o jogador do turno atual com HTTP 200', async () => {
      req.body = { game_id: 1 };

      // GameService.getCurrentTurnPlayer retorna { game, currentPlayer }
      // O Controller monta a resposta manualmente: { game_id: game.id, current_player: currentPlayer }
      const mockGame = {
        id: 1,
        title: 'Sala Principal',
        status: 'in_progress',
        maxPlayers: 4,
        usersInGame: [
          { username: 'alice', token: 'tok_alice', isCreator: true, isReady: true },
          { username: 'bob',   token: 'tok_bob',   isCreator: false, isReady: true }
        ],
        currentPlayerIndex: 0,
        createdAt: '2026-08-09T12:00:00.000Z'
      };

      mock.method(GameService, 'getCurrentTurnPlayer', async () => ({
        game: mockGame,
        currentPlayer: 'alice'
      }));

      await GameController.getCurrentPlayer(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('ERRO INESPERADO NO CONTROLLER:', next.mock.calls[0].arguments[0]);
      }

      assert.strictEqual(next.mock.calls.length, 0, 'next() não deve ser chamado em caso de sucesso');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
        game_id: 1,
        current_player: 'alice'
      });
    });

    it('Deve retornar current_player como null quando usersInGame está vazio', async () => {
      req.body = { game_id: 2 };

      const mockGame = {
        id: 2,
        title: 'Sala Vazia',
        status: 'waiting',
        maxPlayers: 4,
        usersInGame: [],
        currentPlayerIndex: null,
        createdAt: '2026-08-09T12:00:00.000Z'
      };

      mock.method(GameService, 'getCurrentTurnPlayer', async () => ({
        game: mockGame,
        currentPlayer: null
      }));

      await GameController.getCurrentPlayer(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
        game_id: 2,
        current_player: null
      });
    });
  });

  // ─── ERROS ────────────────────────────────────────────────────────────────
  describe('Tratamento de erros', () => {
    it('Deve chamar next() quando o turno não está definido (jogo não encontrado)', async () => {
      req.body = { game_id: 999 };
      const erroSimulado = new Error('Jogo com ID 999 não encontrado.');

      mock.method(GameService, 'getCurrentTurnPlayer', async () => { throw erroSimulado; });

      await GameController.getCurrentPlayer(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1, 'next() deve ser chamado quando o jogo não existe');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });

    it('Deve chamar next() quando o serviço falhar ao determinar o turno', async () => {
      req.body = { game_id: 3 };
      const erroSimulado = new Error('Não foi possível determinar o jogador do turno atual.');

      mock.method(GameService, 'getCurrentTurnPlayer', async () => { throw erroSimulado; });

      await GameController.getCurrentPlayer(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1, 'next() deve ser acionado para falhas de serviço');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });
});
