import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../controller/GameController.js';
import GameService from '../service/GameService.js';

// ---------------------------------------------------------------------------
// Tarefa 12 — Teste unitário: Iniciar o jogo quando os jogadores estiverem prontos
// O GameController.start valida o body via gameActionSchema (game_id + access_token),
// delega ao GameService.startGame e responde 200 com { message: "Game started successfully" }.
// ---------------------------------------------------------------------------

describe('GameController - Iniciar o Jogo (Tarefa 12)', () => {
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
  describe('Início bem-sucedido', () => {
    it('Deve iniciar o jogo com sucesso e retornar HTTP 200', async () => {
      // Payload válido para passar no gameActionSchema do Zod
      req.body = { game_id: 1, access_token: 'token_do_criador_valido' };

      mock.method(GameService, 'startGame', async () => true);

      await GameController.start(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('ERRO INESPERADO NO CONTROLLER:', next.mock.calls[0].arguments[0]);
      }

      assert.strictEqual(next.mock.calls.length, 0, 'next() não deve ser chamado em caso de sucesso');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        { message: 'Game started successfully' }
      );
    });
  });

  // ─── ERROS ────────────────────────────────────────────────────────────────
  describe('Tratamento de erros', () => {
    it('Deve chamar next() quando não há jogadores suficientes (mínimo 2)', async () => {
      req.body = { game_id: 2, access_token: 'token_valido' };
      const erroSimulado = new Error('Mínimo de 2 jogadores para iniciar.');

      mock.method(GameService, 'startGame', async () => { throw erroSimulado; });

      await GameController.start(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1, 'next() deve ser chamado ao falhar validação de jogadores');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });

    it('Deve chamar next() quando o jogo já está em andamento', async () => {
      req.body = { game_id: 3, access_token: 'token_valido' };
      const erroSimulado = new Error('Este jogo já começou ou foi encerrado.');

      mock.method(GameService, 'startGame', async () => { throw erroSimulado; });

      await GameController.start(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1, 'next() deve ser chamado quando o jogo já começou');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });

    it('Deve chamar next() quando quem tenta iniciar não é o criador da sala', async () => {
      req.body = { game_id: 4, access_token: 'token_nao_criador' };
      const erroSimulado = new Error('Apenas o criador pode iniciar a partida.');

      mock.method(GameService, 'startGame', async () => { throw erroSimulado; });

      await GameController.start(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1);
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });
});
