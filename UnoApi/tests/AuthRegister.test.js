import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import AuthController from '../controller/AuthController.js';
import AuthService from '../service/AuthService.js';

describe('AuthController - Registro de Novo Usuário', () => {
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

  it('Deve registrar um novo usuário com sucesso (HTTP 201)', async () => {
    req.body = { username: 'kaio', name: 'Kaio', email: 'kaio@email.com', password: 'password123', age: 20 };
    
    mock.method(AuthService, 'register', async () => true);

    await AuthController.register(req, res, next);

    assert.strictEqual(next.mock.calls.length, 0);
    assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
  });

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
