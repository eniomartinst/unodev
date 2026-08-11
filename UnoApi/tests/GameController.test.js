import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../controller/GameController.js';
import GameService from '../service/GameService.js';

describe('GameController - Operações CRUD', () => {
  let req;
  let res;
  let next;

  // Antes de cada teste, recriamos o ambiente de Request/Response e limpamos os Mocks
  beforeEach(() => {
    mock.restoreAll();
    
    // Simulamos um request completo, incluindo um usuário logado no req.user
    req = { 
      params: {}, 
      body: {},
      user: { id: 1 } // Evita falhas de autenticação no Controller
    };
    
    res = {
      status: mock.fn(function() { return this; }),
      json: mock.fn(),
      send: mock.fn()
    };
    
    // Adicionamos o mock do next para o ErrorHandlerMiddleware
    next = mock.fn(); 
  });

  describe('Criação de um novo jogo (create)', () => {
    it('Deve criar um jogo com sucesso e retornar 201', async () => {
      const mockGame = { 
        id: 1, 
        title: 'Sala dos Campeões', 
        status: 'waiting', 
        maxPlayers: 4, 
        usersInGame: [], 
        createdAt: '2026-08-09T12:00:00.000Z' 
      };
      
      // Enviamos o payload completo para passar na validação do Zod
      req.body = { 
        title: 'Sala dos Campeões',
        maxPlayers: 4,
        status: 'waiting'
      };
      
      mock.method(GameService, 'create', async () => mockGame);

      await GameController.create(req, res, next);

      // ARMADILHA: Se o next for chamado, imprime o erro exato no terminal para nós!
      if (next.mock.calls.length > 0) {
        console.error("ERRO DO CONTROLLER:", next.mock.calls[0].arguments[0]);
      }

      assert.strictEqual(next.mock.calls.length, 0, 'O next() foi chamado, indicando um erro no controller');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockGame);
    });
  });

  describe('Obtenção de informações (findAll e findById)', () => {
    it('Deve retornar uma lista de jogos com sucesso (200)', async () => {
      const mockGamesList = [
        { id: 1, title: 'Sala A', status: 'waiting', maxPlayers: 4, usersInGame: [], createdAt: '2026-08-09T12:00:00.000Z' },
        { id: 2, title: 'Sala B', status: 'active', maxPlayers: 4, usersInGame: [1, 2], createdAt: '2026-08-09T12:00:00.000Z' }
      ];
      mock.method(GameService, 'findAll', async () => mockGamesList);

      await GameController.findAll(req, res, next);

      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockGamesList);
    });

    it('Deve retornar os detalhes de um jogo específico (200)', async () => {
      const mockGame = { id: 5, title: 'Sala de Teste', status: 'waiting', maxPlayers: 4, usersInGame: [], createdAt: '2026-08-09T12:00:00.000Z' };
      req.params.id = 5;
      mock.method(GameService, 'findById', async () => mockGame);

      await GameController.findById(req, res, next);

      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockGame);
    });
  });

  describe('Atualização de detalhes (update)', () => {
    it('Deve atualizar os detalhes do jogo e retornar 200', async () => {
      const updatedGame = { id: 1, title: 'Sala Atualizada', status: 'active', maxPlayers: 4, usersInGame: [], createdAt: '2026-08-09T12:00:00.000Z' };
      req.params.id = 1;
      req.body = { status: 'active' };
      mock.method(GameService, 'update', async () => updatedGame);

      await GameController.update(req, res, next);

      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], updatedGame);
    });
  });

  describe('Exclusão de um jogo (delete)', () => {
    it('Deve excluir o jogo e retornar status 204 (No Content)', async () => {
      req.params.id = 10;
      mock.method(GameService, 'delete', async () => true);

      await GameController.delete(req, res, next);

      assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
      assert.strictEqual(res.send.mock.calls.length, 1);
    });
  });
});