import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import AuthController from '../controller/AuthController.js';
import AuthService from '../service/AuthService.js';

describe('AuthController - CRUD de Jogadores/Users (Tarefa 1)', () => {
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
    it('Deve excluir um jogador do banco de dados (HTTP 204)', async () => {
      mock.method(AuthService, 'deleteUser', async () => true);
      await AuthController.delete(req, res, next);
      
      assert.strictEqual(next.mock.calls.length, 0);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
      assert.strictEqual(res.send.mock.calls.length, 1, 'O método send() deve ser chamado para o status 204 (No Content)');
    });
  });
});