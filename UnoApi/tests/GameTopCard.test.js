import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../controller/GameController.js';
import GameService from '../service/GameService.js';

// ---------------------------------------------------------------------------
// Tarefa 18 — Teste unitário: Obter a carta superior da pilha de descarte
// O GameController.getTopCard valida o body via gameStateQuerySchema (game_id),
// delega ao GameService.getTopCard e retorna o objeto { game_id, top_card } diretamente.
// ---------------------------------------------------------------------------

describe('GameController - Obter Carta do Topo da Pilha (Tarefa 18)', () => {
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
  describe('Obtenção bem-sucedida da carta do topo', () => {
    it('Deve retornar a carta do topo da pilha de descarte com HTTP 200', async () => {
      req.body = { game_id: 1 };

      // GameService.getTopCard retorna o objeto completo que o Controller devolve direto via res.json
      const mockResposta = {
        game_id: 1,
        top_card: 'Red 5'
      };

      mock.method(GameService, 'getTopCard', async () => mockResposta);

      await GameController.getTopCard(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('ERRO INESPERADO NO CONTROLLER:', next.mock.calls[0].arguments[0]);
      }

      assert.strictEqual(next.mock.calls.length, 0, 'next() não deve ser chamado em caso de sucesso');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockResposta);
    });

    it('Deve retornar corretamente uma carta curinga do topo', async () => {
      req.body = { game_id: 2 };

      const mockResposta = {
        game_id: 2,
        top_card: 'Wild WildDraw4'
      };

      mock.method(GameService, 'getTopCard', async () => mockResposta);

      await GameController.getTopCard(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockResposta);
    });
  });

  // ─── ERROS ────────────────────────────────────────────────────────────────
  describe('Tratamento de erros', () => {
    it('Deve chamar next() quando o jogo não é encontrado (pilha indisponível)', async () => {
      req.body = { game_id: 999 };
      const erroSimulado = new Error('Jogo com ID 999 não encontrado.');

      mock.method(GameService, 'getTopCard', async () => { throw erroSimulado; });

      await GameController.getTopCard(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1, 'next() deve ser chamado quando o jogo não existe');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });

    it('Deve chamar next() quando a pilha de descarte está vazia', async () => {
      req.body = { game_id: 3 };
      const erroSimulado = new Error('A pilha de descarte está vazia.');

      mock.method(GameService, 'getTopCard', async () => { throw erroSimulado; });

      await GameController.getTopCard(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1, 'next() deve ser acionado quando a pilha está vazia');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });
});
