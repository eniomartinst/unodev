import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import AuthService from '../../service/AuthService.js';
import User from '../../repository/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('AuthService', () => {
  beforeEach(() => { mock.restoreAll(); });

  describe('register', () => {
    // Teste para: Registro de um novo usuário com dados válidos
    it('deve registrar um novo usuario com sucesso', async () => {
      mock.method(User, 'findOne', async () => null); // Simula que não existe email/username igual
      mock.method(bcrypt, 'genSalt', async () => 'salt');
      mock.method(bcrypt, 'hash', async () => 'hashedPassword');
      mock.method(User, 'create', async () => ({ id: 1, username: 'testuser' }));

      const result = await AuthService.register({ username: 'testuser', password: '123' });
      assert.strictEqual(result.id, 1);
    });

    // Teste para: Bloqueio de cadastro quando o username ou email já estão em uso
    it('deve lancar erro se email ou username ja existir', async () => {
      mock.method(User, 'findOne', async () => ({ id: 2, username: 'existente' }));
      await assert.rejects(
        async () => await AuthService.register({ username: 'existente', password: '123' }),
        /User already exists/
      );
    });
  });

  describe('login', () => {
    // Teste para: Autenticação de usuário e geração do token JWT
    it('deve fazer login e retornar um token', async () => {
      mock.method(User, 'findOne', async () => ({ id: 1, username: 'testuser', password: 'hashedPassword' }));
      mock.method(bcrypt, 'compare', async () => true);
      mock.method(jwt, 'sign', () => 'fake_jwt_token');

      const token = await AuthService.login({ username: 'testuser', password: '123' });
      assert.strictEqual(token, 'fake_jwt_token');
    });

    // Teste para: Falha na autenticação ao informar um usuário inexistente
    it('deve lancar erro para credenciais invalidas (usuario nao encontrado)', async () => {
      mock.method(User, 'findOne', async () => null);
      await assert.rejects(
        async () => await AuthService.login({ username: 'ghost', password: '123' }),
        /Invalid credentials/
      );
    });
  });

  describe('getProfile e updateProfile', () => {
    // Teste para: Recuperação dos dados do perfil do usuário logado
    it('deve retornar o perfil', async () => {
      mock.method(User, 'findByPk', async () => ({ id: 1, username: 'testuser' }));
      const user = await AuthService.getProfile(1);
      assert.strictEqual(user.username, 'testuser');
    });

    // Teste para: Atualização bem-sucedida de informações básicas do perfil
    it('deve atualizar o perfil', async () => {
      const mockUser = { id: 1, username: 'testuser', save: mock.fn(async () => {}) };
      mock.method(User, 'findByPk', async () => mockUser);
      mock.method(User, 'findOne', async () => null); // Para email

      const updated = await AuthService.updateProfile(1, { name: 'Novo Nome' });
      assert.strictEqual(updated.name, 'Novo Nome');
      assert.strictEqual(mockUser.save.mock.callCount(), 1);
    });
  });

  describe('Operações Adicionais de Perfil', () => {
    // Teste para: Execução correta do fluxo de logout na camada de serviço
    it('deve realizar logout com sucesso', async () => {
      const result = await AuthService.logout(1);
      assert.strictEqual(result, true);
    });

    // Teste para: Exceção ao tentar buscar informações de um perfil que não existe
    it('deve falhar ao buscar perfil inexistente', async () => {
      mock.method(User, 'findByPk', async () => null);
      await assert.rejects(async () => await AuthService.getProfile(99), /User not found/);
    });

    // Teste para: Exceção ao tentar atualizar informações de um perfil fantasma
    it('deve falhar ao atualizar perfil inexistente', async () => {
      mock.method(User, 'findByPk', async () => null);
      await assert.rejects(async () => await AuthService.updateProfile(99, {}), /User not found/);
    });

    // Teste para: Validação de conflito ao tentar usar um email pertencente a outra conta
    it('deve falhar no update se email já estiver em uso', async () => {
      mock.method(User, 'findByPk', async () => ({ id: 1, email: 'me@mail.com' }));
      mock.method(User, 'findOne', async () => ({ id: 2, email: 'novo@mail.com' })); 
      await assert.rejects(async () => await AuthService.updateProfile(1, { email: 'novo@mail.com' }), /Email already in use/);
    });

    // Teste para: Fluxo de atualização de senha garantindo a criptografia (hash) dos novos dados
    it('deve atualizar senha com hash e demais dados', async () => {
      const mockUser = { id: 1, save: mock.fn(async () => {}) };
      mock.method(User, 'findByPk', async () => mockUser);
      mock.method(bcrypt, 'genSalt', async () => 'salt');
      mock.method(bcrypt, 'hash', async () => 'hashedNewPass');
      
      await AuthService.updateProfile(1, { password: 'newpass', age: 25, username: 'newname' });
      assert.strictEqual(mockUser.password, 'hashedNewPass');
      assert.strictEqual(mockUser.age, 25);
    });

    // Teste para: Exclusão física da conta do usuário e tratamento caso a conta não exista
    it('deve deletar usuário com sucesso e falhar se não achar', async () => {
      const mockUser = { id: 1, destroy: mock.fn(async () => {}) };
      mock.method(User, 'findByPk', async () => mockUser);
      const result = await AuthService.deleteUser(1);
      assert.strictEqual(result, true);

      mock.method(User, 'findByPk', async () => null);
      await assert.rejects(async () => await AuthService.deleteUser(99), /User not found/);
    });
  });
});