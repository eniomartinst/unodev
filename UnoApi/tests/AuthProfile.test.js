import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import AuthController from '../controller/AuthController.js';
import AuthService from '../service/AuthService.js';

describe('AuthController - Obter Perfil de Usuário', () => {
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

  it('Deve retornar erro se o usuário não for encontrado (HTTP 401)', async () => {
    mock.method(AuthService, 'getProfile', async () => {
      throw new Error('User not found');
    });

    await AuthController.profile(req, res, next);

    assert.strictEqual(res.status.mock.calls[0].arguments[0], 401);
    assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { error: 'User not found' });
  });
});
