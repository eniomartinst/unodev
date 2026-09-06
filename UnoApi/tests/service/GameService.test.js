import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import GameService from '../../service/GameService.js';
import Game from '../../repository/Game.js';
import Round from '../../repository/Round.js';
import jwt from 'jsonwebtoken';
import BusinessException from '../../config/exceptions/BusinessException.js';
import NotFoundException from '../../config/exceptions/NotFoundException.js';

describe('GameService', () => {
  // Restaura todos os mocks do banco antes de cada teste
  beforeEach(() => { mock.restoreAll(); });

  describe('CRUD Base', () => {
    // Teste para: Recuperação de um jogo existente pelo seu ID
    it('deve retornar um jogo pelo ID com sucesso', async () => {
      const mockGame = { id: 1, status: 'active' };
      mock.method(Game, 'findByPk', async () => mockGame);

      const result = await GameService.findById(1);
      assert.deepEqual(result, mockGame);
    });

    // Teste para: Validação de erro ao buscar um jogo que não existe
    it('deve lançar NotFoundException ao buscar jogo inexistente', async () => {
      mock.method(Game, 'findByPk', async () => null);
      await assert.rejects(async () => await GameService.findById(99), NotFoundException);
    });
  });

  describe('Regras de Negócio: startGame', () => {
    // Teste para: Bloqueio de início de partida por um jogador que não é o host/criador
    it('deve lançar erro se usuário não for o criador', async () => {
      const mockGame = { 
        id: 1, 
        usersInGame: [{ username: 'tester', token: 'token123', isCreator: false, isReady: true }] 
      };
      mock.method(Game, 'findByPk', async () => mockGame);
      mock.method(jwt, 'decode', () => ({ username: 'tester' }));

      await assert.rejects(
        async () => await GameService.startGame({ game_id: 1, access_token: 'token123' }),
        BusinessException
      );
    });
  });

  describe('Regras de Negócio: endGame', () => {
    // Teste para: Impedimento de encerramento de um jogo que já acabou ou ainda não começou
    it('deve lançar erro se o jogo não estiver em andamento', async () => {
      mock.method(Game, 'findByPk', async () => ({ id: 1, status: 'finished' }));
      await assert.rejects(
        async () => await GameService.endGame({ game_id: 1, access_token: 'token123' }),
        BusinessException
      );
    });
  });

  describe('Operações Complementares (CRUD, Join, Leave, Lookups)', () => {
    // Teste para: Criação de nova partida e listagem geral de jogos ativos/registrados
    it('deve criar e listar jogos', async () => {
      mock.method(Game, 'create', async () => ({ id: 1 }));
      mock.method(Game, 'findAll', async () => [{ id: 1 }]);
      
      const created = await GameService.create({});
      const list = await GameService.findAll();
      assert.strictEqual(created.id, 1);
      assert.strictEqual(list.length, 1);
    });

    // Teste para: Atualização de status e exclusão física de um jogo (Update/Delete)
    it('deve atualizar e deletar jogos', async () => {
      mock.method(Game, 'findByPk', async () => ({ id: 1 }));
      mock.method(Game, 'update', async () => [1]);
      mock.method(Game, 'destroy', async () => 1);
      
      const updated = await GameService.update(1, { status: 'finished' });
      const deleted = await GameService.delete(1);
      assert.strictEqual(updated.id, 1);
      assert.strictEqual(deleted, true);
    });

    // Teste para: Ingresso bem-sucedido de um novo jogador em uma sala disponível (Join)
    it('joinGame deve adicionar um jogador novo', async () => {
      const mockGame = { id: 1, status: 'waiting', maxPlayers: 4, usersInGame: [] };
      mock.method(Game, 'findByPk', async () => mockGame);
      mock.method(jwt, 'decode', () => ({ username: 'jogador1' }));
      mock.method(Game, 'update', async () => [1]);
      
      const res = await GameService.joinGame({ game_id: 1, access_token: 'token123' });
      assert.strictEqual(res, true);
    });

    // Teste para: Remoção segura de um jogador da partida (Leave)
    it('leaveGame deve remover o jogador da sala', async () => {
      const mockGame = { id: 1, status: 'in_progress', usersInGame: [{ token: 'token123' }] };
      mock.method(Game, 'findByPk', async () => mockGame);
      mock.method(Game, 'update', async () => [1]);
      
      const res = await GameService.leaveGame({ game_id: 1, access_token: 'token123' });
      assert.strictEqual(res, true);
    });

    // Teste para: Recuperação de informações do estado da partida e da carta do descarte
    it('Consultas: getTopCard e getGameState', async () => {
      mock.method(Game, 'findByPk', async () => ({ id: 1 }));
      mock.method(Round, 'findOne', async () => ({
        discardPile: [{ id: 1, color: 'Red', value: '5' }]
      }));
      
      const state = await GameService.getGameState({ game_id: 1 });
      const topCard = await GameService.getTopCard({ game_id: 1 });
      
      assert.strictEqual(state.id, 1);
      assert.strictEqual(topCard.top_card, "Red 5");
    });

    it('getTopCard deve lançar erro se a pilha de descarte estiver vazia', async () => {
      mock.method(Game, 'findByPk', async () => ({ id: 1 }));
      mock.method(Round, 'findOne', async () => null);

      await assert.rejects(
        async () => await GameService.getTopCard({ game_id: 1 }),
        BusinessException
      );
    });
  });
});