import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import CardService from '../../service/CardService.js';
import Card from '../../repository/Card.js';
import NotFoundException from '../../config/exceptions/NotFoundException.js';

describe('CardService', () => {
  beforeEach(() => { mock.restoreAll(); });

  describe('CRUD Base', () => {
    // Teste para: Recuperação de todas as cartas cadastradas no banco
    it('deve retornar todas as cartas', async () => {
      mock.method(Card, 'findAll', async () => [{ id: 1, color: 'Red', value: '5' }]);
      const result = await CardService.findAll();
      assert.strictEqual(result.length, 1);
    });

    // Teste para: Validação de erro ao tentar excluir uma carta que não existe
    it('deve lançar NotFoundException ao tentar deletar carta inexistente', async () => {
      mock.method(Card, 'findByPk', async () => null);
      await assert.rejects(async () => await CardService.delete(99), NotFoundException);
    });
  });

  describe('seedCards', () => {
    // Teste para: Prevenção de duplicidade ao tentar popular um banco já preenchido (seed)
    it('não deve fazer nada se o banco já tiver cartas', async () => {
      mock.method(Card, 'count', async () => 108);
      mock.method(Card, 'bulkCreate', async () => []);
      
      await CardService.seedCards();
      assert.strictEqual(Card.bulkCreate.mock.callCount(), 0);
    });

    // Teste para: Geração automatizada do baralho oficial de 108 cartas (seed)
    it('deve popular o banco com 108 cartas se estiver vazio', async () => {
      mock.method(Card, 'count', async () => 0);
      mock.method(Card, 'bulkCreate', async () => []);
      
      await CardService.seedCards();
      assert.strictEqual(Card.bulkCreate.mock.callCount(), 1);
      
      const createdDeck = Card.bulkCreate.mock.calls[0].arguments[0];
      assert.strictEqual(createdDeck.length, 108);
    });
  });

  describe('CRUD Adicional e Validações', () => {
    // Teste para: Criação de um novo registro de carta
    it('deve criar uma nova carta com sucesso', async () => {
      mock.method(Card, 'create', async () => ({ id: 1, color: 'Red' }));
      const result = await CardService.create({ color: 'Red' });
      assert.strictEqual(result.id, 1);
    });

    // Teste para: Atualização dos dados de uma carta específica
    it('deve atualizar uma carta existente', async () => {
      mock.method(Card, 'findByPk', async () => ({ id: 1, color: 'Red' }));
      mock.method(Card, 'update', async () => [1]);
      const result = await CardService.update(1, { color: 'Blue' });
      assert.strictEqual(result.id, 1);
    });

    // Teste para: Validação de erro ao tentar atualizar uma carta que não existe
    it('deve lançar NotFoundException no update de carta inexistente', async () => {
      mock.method(Card, 'findByPk', async () => null);
      await assert.rejects(async () => await CardService.update(99, {}), NotFoundException);
    });

    // Teste para: Exclusão física de uma carta existente
    it('deve deletar uma carta existente', async () => {
      mock.method(Card, 'findByPk', async () => ({ id: 1 }));
      mock.method(Card, 'destroy', async () => 1);
      const result = await CardService.delete(1);
      assert.strictEqual(result, true);
    });
  });
});