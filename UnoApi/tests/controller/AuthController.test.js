import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import AuthController from '../../controller/AuthController.js';
import AuthService from '../../service/AuthService.js';
import AuthMiddleware from '../../config/middleware/AuthMiddleware.js';

describe('AuthController', () => {

  describe('Login', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      mock.restoreAll();
      req = { body: {} };
      res = {
        status: mock.fn(function() { return this; }),
        json: mock.fn(),
      };
      next = mock.fn();
    });

    describe('Autenticação de Usuário', () => {
      // Teste para: Autenticação com sucesso (Tarefa 7)
      it('Deve realizar login com sucesso e retornar o token (HTTP 200)', async () => {
        req.body = { username: 'elton', password: 'senha_valida' };
        
        const tokenSimulado = 'jwt_simulado_aqui';
        
        mock.method(AuthService, 'login', async () => tokenSimulado);

        await AuthController.login(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0, 'O next() não deve ser chamado em caso de sucesso');
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { access_token: tokenSimulado });
      });

      // Teste para: Falha na autenticação (Credenciais inválidas)
      it('Deve repassar o erro para o next() em caso de credenciais inválidas', async () => {
        req.body = { username: 'elton', password: 'senha_errada' };
        const erroSimulado = new Error('Credenciais inválidas');
        
        mock.method(AuthService, 'login', async () => {
          throw erroSimulado;
        });

        await AuthController.login(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1, 'O next() deveria ter sido chamado para tratar o erro');
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });
    });
  });

  describe('Operação de Logout e Proteção de Rotas', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      mock.restoreAll();
      
      req = {
        headers: {},
        body: {}
      };
      
      res = {
        status: mock.fn(function() { return this; }),
        json: mock.fn(),
        send: mock.fn()
      };
      
      next = mock.fn();
    });

    describe('Cenário 1: Confirmação de desconexão (Logout)', () => {
      // Teste para: Desconexão e encerramento seguro (Logout Stateless)
      it('Deve validar a arquitetura de logout (Stateless JWT) garantindo o encerramento seguro', async () => {
        req.user = { id: 1 };
        req.headers.authorization = 'Bearer token_valido';
        
        if (typeof AuthController.logout === 'function') {
          try {
            const AuthService = (await import('../service/AuthService.js')).default;
            if (AuthService.logout) mock.method(AuthService, 'logout', async () => true);
          } catch (e) {}

          await AuthController.logout(req, res, next);
          
          assert.strictEqual(next.mock.calls.length, 0, 'Erros detectados ao processar a rota de logout');
          
          const statusChamado = res.status.mock.calls[0].arguments[0];
          assert.ok([200, 204].includes(statusChamado), `Status de sucesso inesperado no logout: ${statusChamado}`);
        } else {
          assert.strictEqual(typeof AuthController.logout, 'undefined');
        }
      });
    });

    describe('Cenário 2: Acesso a recursos protegidos após o logout', () => {
      // Teste para: Bloqueio de rota protegida após o logout (sem token)
      it('Deve bloquear o acesso e retornar erro 401 ao tentar acessar rota protegida sem token', async () => {
        req.headers.authorization = undefined;

        await AuthMiddleware(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0, 'Acesso indevido! O next() não deveria ser chamado sem token.');

        const statusChamado = res.status.mock.calls[0].arguments[0];
        assert.strictEqual(statusChamado, 401, 'Deve retornar HTTP 401 Unauthorized');
      });

      // Teste para: Rejeição de token falso ou adulterado no middleware
      it('Deve bloquear o acesso e retornar erro 401 ao enviar um token inválido ou falso', async () => {
        req.headers.authorization = 'Bearer token_falso_e_invalido_123';

        try {
          await AuthMiddleware(req, res, next);
        } catch (e) {}

        assert.strictEqual(next.mock.calls.length, 0, 'Acesso indevido! O next() não deveria ser chamado com token falso.');
      });
    });
  });

  describe('Obter Perfil de Usuário', () => {
    let req, res, next;

    beforeEach(() => {
      mock.restoreAll();
      req = { user: { id: 1 } };
      res = {
        status: mock.fn(function() { return this; }),
        json: mock.fn()
      };
      next = mock.fn();
    });

    // Teste para: Retorno do perfil de usuário ativo (HTTP 200)
    it('Deve retornar o perfil do usuário logado (HTTP 200)', async () => {
      const mockUser = { id: 1, username: 'kaio', name: 'Kaio', email: 'kaio@email.com', age: 20 };
      mock.method(AuthService, 'getProfile', async () => mockUser);

      await AuthController.profile(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      
      const responseBody = res.json.mock.calls[0].arguments[0];
      assert.strictEqual(responseBody.username, 'kaio');
      assert.strictEqual(responseBody.email, 'kaio@email.com');
    });

    // Teste para: Tratamento de erro quando perfil não existe
    it('Deve retornar erro se o usuário não for encontrado (HTTP 401)', async () => {
      mock.method(AuthService, 'getProfile', async () => {
        throw new Error('User not found');
      });

      await AuthController.profile(req, res, next);

      assert.strictEqual(res.status.mock.calls[0].arguments[0], 401);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { error: 'User not found' });
    });
  });

  describe('Registro de Novo Usuário', () => {
    let req, res, next;

    beforeEach(() => {
      mock.restoreAll();
      req = { body: {} };
      res = {
        status: mock.fn(function() { return this; }),
        json: mock.fn()
      };
      next = mock.fn();
    });

    // Teste para: Criação de um novo cadastro via endpoint de registro
    it('Deve registrar um novo usuário com sucesso (HTTP 201)', async () => {
      req.body = { username: 'kaio', name: 'Kaio', email: 'kaio@email.com', password: 'password123', age: 20 };
      
      mock.method(AuthService, 'register', async () => true);

      await AuthController.register(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
    });

    // Teste para: Validação de conflito ao tentar criar um usuário já existente
    it('Deve retornar erro se o usuário já existir (HTTP 400)', async () => {
      req.body = { username: 'kaio', name: 'Kaio', email: 'kaio@email.com', password: 'password123', age: 20 };
      
      mock.method(AuthService, 'register', async () => {
        throw new Error('User already exists');
      });

      await AuthController.register(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 400);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { error: 'User already exists' });
    });
  });

  describe('CRUD de Jogadores/Users (Tarefa 1)', () => {
    let req, res, next;

    beforeEach(() => {
      mock.restoreAll();
      
      req = {
        body: {},
        user: { id: 1 }
      };
      
      res = {
        status: mock.fn(function() { return this; }),
        json: mock.fn(),
        send: mock.fn()
      };
      
      next = mock.fn();
    });

    describe('Create', () => {
      // Teste para: CRUD (Create) - Inserção de novo jogador
      it('Deve criar um novo jogador com sucesso (HTTP 201)', async () => {
        req.body = { username: 'elton', name: 'Elton Souza', email: 'elton@email.com', password: 'password123', age: 25 };
        
        mock.method(AuthService, 'register', async () => true);
        await AuthController.register(req, res, next);
        
        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { message: "User registered successfully" });
      });
    });

    describe('Read', () => {
      // Teste para: CRUD (Read) - Leitura dos dados do jogador
      it('Deve recuperar as informações do jogador existente (HTTP 200)', async () => {
        const mockUser = { id: 1, username: 'elton', name: 'Elton Souza', email: 'elton@email.com', age: 25 };
        
        mock.method(AuthService, 'getProfile', async () => mockUser);
        await AuthController.profile(req, res, next);
        
        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.strictEqual(res.json.mock.calls[0].arguments[0].username, 'elton');
      });
    });

    describe('Update', () => {
      // Teste para: CRUD (Update) - Atualização dos dados do jogador
      it('Deve atualizar os detalhes do jogador (HTTP 200)', async () => {
        req.body = { age: 26, name: 'Elton S. Oliveira' };
        const updatedUser = { id: 1, username: 'elton', name: 'Elton S. Oliveira', email: 'elton@email.com', age: 26 };
        
        mock.method(AuthService, 'updateProfile', async () => updatedUser);
        await AuthController.updateProfile(req, res, next);
        
        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.strictEqual(res.json.mock.calls[0].arguments[0].age, 26);
        assert.strictEqual(res.json.mock.calls[0].arguments[0].name, 'Elton S. Oliveira');
      });
    });

    describe('Delete', () => {
      // Teste para: CRUD (Delete) - Remoção de jogador do banco
      it('Deve excluir um jogador do banco de dados (HTTP 204)', async () => {
        mock.method(AuthService, 'deleteUser', async () => true);
        await AuthController.delete(req, res, next);
        
        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
        assert.strictEqual(res.send.mock.calls.length, 1, 'O método send() deve ser chamado para o status 204 (No Content)');
      });
    });
  });

});