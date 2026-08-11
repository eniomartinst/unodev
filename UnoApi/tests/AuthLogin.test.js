import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import AuthController from '../controller/AuthController.js';
import AuthService from '../service/AuthService.js';

describe('AuthController - Login (Tarefa 7)', () => {
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
    it('Deve realizar login com sucesso e retornar o token (HTTP 200)', async () => {
      req.body = { username: 'elton', password: 'senha_valida' };
      
      const tokenSimulado = 'jwt_simulado_aqui';
      
      mock.method(AuthService, 'login', async () => tokenSimulado);

      await AuthController.login(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0, 'O next() não deve ser chamado em caso de sucesso');
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { access_token: tokenSimulado });
    });

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