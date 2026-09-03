import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sequelize from '../../../config/database/database.js';
import Game from '../../../repository/Game.js';
import User from '../../../repository/User.js';
import GameService from '../../../service/GameService.js'; 

describe('Interação com Banco de Dados - Mock Unitário', () => {
  
  beforeEach(() => {
    mock.restoreAll();
  });

  describe('Fluxo CRUD de Interação com o ORM (Sequelize)', () => {
    
    it('1. CREATE: Deve inserir dados no banco relacional', async () => {
      const payload = { title: 'Partida Mockada', maxPlayers: 4 };
      const mockDbResponse = { id: 1, ...payload, createdAt: new Date() };

      mock.method(Game, 'create', async () => mockDbResponse);

      const result = await GameService.create(payload);

      assert.strictEqual(Game.create.mock.calls.length, 1, 'O Sequelize (Game.create) deve ser chamado 1 vez');
      assert.deepStrictEqual(Game.create.mock.calls[0].arguments[0], payload, 'O payload deve ser repassado intacto ao ORM');
      assert.strictEqual(result.id, 1, 'Deve retornar o ID gerado pelo banco mockado');
    });

    it('2. READ: Deve recuperar dados do banco relacional', async () => {
      const mockDbResponse = { id: 1, title: 'Partida Mockada' };

      mock.method(Game, 'findByPk', async () => mockDbResponse);

      const result = await GameService.findById(1);

      assert.strictEqual(Game.findByPk.mock.calls.length, 1);
      assert.strictEqual(Game.findByPk.mock.calls[0].arguments[0], 1, 'Deve buscar no banco pelo ID correto');
      assert.deepStrictEqual(result, mockDbResponse);
    });

    it('3. UPDATE: Deve atualizar dados no banco relacional', async () => {
      const existingRecord = { id: 1, title: 'Antigo', status: 'waiting' };
      const updatePayload = { status: 'active' };
      const updatedRecord = { ...existingRecord, ...updatePayload };

      let findCallCount = 0;
      mock.method(Game, 'findByPk', async () => {
        findCallCount++;
        return findCallCount === 1 ? existingRecord : updatedRecord;
      });
      mock.method(Game, 'update', async () => [1]);

      const result = await GameService.update(1, updatePayload);

      assert.strictEqual(Game.update.mock.calls.length, 1, 'O comando UPDATE do Sequelize deve ser chamado');
      assert.deepStrictEqual(Game.update.mock.calls[0].arguments[0], updatePayload, 'Deve enviar os dados corretos para update');
      assert.strictEqual(result.status, 'active');
    });

    it('4. DELETE: Deve excluir dados do banco relacional', async () => {
      const existingRecord = { id: 1, title: 'Para Deletar' };

      mock.method(Game, 'findByPk', async () => existingRecord);
      mock.method(Game, 'destroy', async () => 1);

      const result = await GameService.delete(1);

      assert.strictEqual(Game.destroy.mock.calls.length, 1, 'O comando DELETE (destroy) do Sequelize deve ser acionado');
      assert.deepStrictEqual(Game.destroy.mock.calls[0].arguments[0], { where: { id: 1 } }, 'A cláusula WHERE deve ser montada corretamente');
      assert.strictEqual(result, true);
    });
  });
});