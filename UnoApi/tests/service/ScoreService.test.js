import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import ScoreService from '../../service/ScoreService.js';
import Score from '../../repository/Score.js';
import Game from '../../repository/Game.js';
import User from '../../repository/User.js';
import NotFoundException from '../../config/exceptions/NotFoundException.js';

describe('ScoreService', () => {
  beforeEach(() => { mock.restoreAll(); });

  describe('addPoints', () => {
    // Teste para: Adição de pontos com criação de um novo registro no banco de dados
    it('deve adicionar pontos criando um novo registro de Score se não existir', async () => {
      mock.method(User, 'findOne', async () => ({ id: 10, username: 'winner' }));
      mock.method(Score, 'findOne', async () => null);
      mock.method(Score, 'create', async () => ({}));
      mock.method(Game, 'findByPk', async () => ({ id: 1, totalScores: {} }));
      mock.method(Game, 'update', async () => [1]);
      
      const result = await ScoreService.addPoints(1, 'winner', 45);
      
      assert.strictEqual(Score.create.mock.callCount(), 1);
      assert.deepEqual(Score.create.mock.calls[0].arguments[0], { gameId: 1, playerId: 10, totalPoints: 45 });
      assert.deepEqual(result, { winner: 45 });
    });

    // Teste para: Falha ao tentar atribuir pontos a um usuário que não existe
    it('deve lançar erro se usuário não for encontrado', async () => {
      mock.method(User, 'findOne', async () => null);
      await assert.rejects(
        async () => await ScoreService.addPoints(1, 'ghost', 50),
        NotFoundException
      );
    });
  });

  describe('checkGameWinner', () => {
    // Teste para: Identificação de vitória quando um jogador atinge ou ultrapassa o limite de pontos
    it('deve retornar o username se alguém bater o limite de pontos', async () => {
      mock.method(Game, 'findByPk', async () => ({ id: 1, totalScores: { player1: 450, player2: 505 } }));
      
      const winner = await ScoreService.checkGameWinner(1, 500);
      assert.strictEqual(winner, 'player2');
    });

    // Teste para: Retorno nulo quando a partida continua (ninguém atingiu o limite)
    it('deve retornar null se ninguém atingiu o limite', async () => {
      mock.method(Game, 'findByPk', async () => ({ id: 1, totalScores: { player1: 100, player2: 120 } }));
      
      const winner = await ScoreService.checkGameWinner(1, 500);
      assert.strictEqual(winner, null);
    });
  });

  describe('CRUD Base', () => {
    // Teste para: Criação de um registro genérico de pontuação
    it('deve criar um score', async () => {
      mock.method(Score, 'create', async () => ({ id: 1, totalPoints: 10 }));
      const result = await ScoreService.create({ totalPoints: 10 });
      assert.strictEqual(result.id, 1);
    });

    // Teste para: Listagem de todas as pontuações do sistema
    it('deve buscar todos os scores', async () => {
      mock.method(Score, 'findAll', async () => [{ id: 1 }]);
      const result = await ScoreService.findAll();
      assert.strictEqual(result.length, 1);
    });

    // Teste para: Atualização bem sucedida de um registro de pontuação
    it('deve atualizar um score existente', async () => {
      mock.method(Score, 'findByPk', async () => ({ id: 1 }));
      mock.method(Score, 'update', async () => [1]);
      const result = await ScoreService.update(1, { totalPoints: 50 });
      assert.strictEqual(result.id, 1);
    });

    // Teste para: Tratamento de exceção ao tentar alterar pontuação inexistente
    it('deve falhar update se score não existir', async () => {
      mock.method(Score, 'findByPk', async () => null);
      await assert.rejects(async () => await ScoreService.update(99, {}), NotFoundException);
    });

    // Teste para: Exclusão física de pontuação e bloqueio de exclusão em registro fantasma
    it('deve deletar um score e falhar se não achar', async () => {
      mock.method(Score, 'findByPk', async () => ({ id: 1 }));
      mock.method(Score, 'destroy', async () => 1);
      const result = await ScoreService.delete(1);
      assert.strictEqual(result, true);

      mock.method(Score, 'findByPk', async () => null);
      await assert.rejects(async () => await ScoreService.delete(99), NotFoundException);
    });
  });
});