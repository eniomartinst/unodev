import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import CardController from '../controller/CardController.js';
import CardService from '../service/CardService.js';

// ---------------------------------------------------------------------------
// Tarefa 3 — Teste unitário: CRUD de Cartões
// Estratégia: isolar CardController fazendo mock do CardService.
// req/res/next são recriados no beforeEach para garantir isolamento total.
// ---------------------------------------------------------------------------

describe('CardController - Operações CRUD de Cartões (Tarefa 3)', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Restaura todos os mocks antes de cada teste para evitar contaminação
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

  // ─── CREATE ───────────────────────────────────────────────────────────────
  describe('Criação de novos cartões (create)', () => {
    it('Deve criar um cartão com sucesso e retornar HTTP 201', async () => {
      // Payload válido para passar no createCardSchema do Zod
      req.body = { color: 'Red', value: '5', gameId: 1 };

      const mockCard = {
        id: 1,
        color: 'Red',
        value: '5',
        gameId: 1,
        createdAt: '2026-08-09T12:00:00.000Z'
      };

      mock.method(CardService, 'create', async () => mockCard);

      await CardController.create(req, res, next);

      // Debug: imprime erro no terminal se o next() for acionado inesperadamente
      if (next.mock.calls.length > 0) {
        console.error('ERRO INESPERADO NO CONTROLLER:', next.mock.calls[0].arguments[0]);
      }

      assert.strictEqual(next.mock.calls.length, 0, 'next() não deve ser chamado em sucesso');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockCard);
    });

    it('Deve chamar next() se o CardService.create lançar um erro', async () => {
      req.body = { color: 'Red', value: '5', gameId: 1 };
      const erroSimulado = new Error('Falha ao criar cartão no banco de dados');

      mock.method(CardService, 'create', async () => { throw erroSimulado; });

      await CardController.create(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1, 'next() deve ser acionado ao receber um erro de service');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });

  // ─── READ (findAll) ───────────────────────────────────────────────────────
  describe('Recuperação de informações (findAll)', () => {
    it('Deve retornar a lista completa de cartões com HTTP 200', async () => {
      const mockCards = [
        { id: 1, color: 'Red',  value: '5', gameId: 1, createdAt: '2026-08-09T12:00:00.000Z' },
        { id: 2, color: 'Blue', value: 'Skip', gameId: 1, createdAt: '2026-08-09T12:00:00.000Z' }
      ];

      mock.method(CardService, 'findAll', async () => mockCards);

      await CardController.findAll(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0, 'next() não deve ser chamado em sucesso');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      // formatManyCardsResponse mapeia cada carta — resultado deve ser idêntico ao mock
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockCards);
    });

    it('Deve chamar next() se o CardService.findAll lançar um erro', async () => {
      const erroSimulado = new Error('Falha de conexão com o banco de dados');

      mock.method(CardService, 'findAll', async () => { throw erroSimulado; });

      await CardController.findAll(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1);
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  describe('Atualização de detalhes (update)', () => {
    it('Deve atualizar um cartão existente e retornar HTTP 200', async () => {
      req.params.id = '1';
      // updateCardSchema é partial() — só os campos a alterar são obrigatórios
      req.body = { color: 'Green', value: 'Reverse' };

      const cardAtualizado = {
        id: 1,
        color: 'Green',
        value: 'Reverse',
        gameId: 1,
        createdAt: '2026-08-09T12:00:00.000Z'
      };

      mock.method(CardService, 'update', async () => cardAtualizado);

      await CardController.update(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0, 'next() não deve ser chamado em sucesso');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], cardAtualizado);
    });

    it('Deve chamar next() se o cartão não for encontrado (NotFoundException)', async () => {
      req.params.id = '999';
      req.body = { color: 'Yellow' };
      const erroSimulado = new Error('Carta com ID 999 não encontrada.');

      mock.method(CardService, 'update', async () => { throw erroSimulado; });

      await CardController.update(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1);
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('Exclusão do banco de dados (delete)', () => {
    it('Deve excluir o cartão e retornar HTTP 204 (No Content)', async () => {
      req.params.id = '1';

      mock.method(CardService, 'delete', async () => true);

      await CardController.delete(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0, 'next() não deve ser chamado em sucesso');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
      assert.strictEqual(res.send.mock.calls.length, 1, 'send() deve ser chamado para status 204 (No Content)');
    });

    it('Deve chamar next() se o cartão não existir no banco (NotFoundException)', async () => {
      req.params.id = '999';
      const erroSimulado = new Error('Carta com ID 999 não encontrada.');

      mock.method(CardService, 'delete', async () => { throw erroSimulado; });

      await CardController.delete(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1);
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });
});
