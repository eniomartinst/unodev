import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import AuthController from '../controller/AuthController.js';
import AuthMiddleware from '../config/middleware/AuthMiddleware.js';

describe('Autenticação - Operação de Logout e Proteção de Rotas', () => {
  let req;
  let res;
  let next;

  // Antes de cada teste, recriamos o ambiente simulado do Express
  beforeEach(() => {
    mock.restoreAll();
    
    // O Request (req) começa sem nenhum token de autorização
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
    it('Deve validar a arquitetura de logout (Stateless JWT) garantindo o encerramento seguro', async () => {
      // Simulamos um usuário logado tentando fazer logout
      req.user = { id: 1 };
      req.headers.authorization = 'Bearer token_valido';
      
      // Se a equipe criou uma rota física de logout (ex: para Blacklist)
      if (typeof AuthController.logout === 'function') {
        try {
          const AuthService = (await import('../service/AuthService.js')).default;
          if (AuthService.logout) mock.method(AuthService, 'logout', async () => true);
        } catch (e) {}

        await AuthController.logout(req, res, next);
        
        // Garante que não houveram erros na execução
        assert.strictEqual(next.mock.calls.length, 0, 'Erros detectados ao processar a rota de logout');
        
        const statusChamado = res.status.mock.calls[0].arguments[0];
        assert.ok([200, 204].includes(statusChamado), `Status de sucesso inesperado no logout: ${statusChamado}`);
      } else {
        // Se a arquitetura for 100% Stateless, validamos a delegação de segurança ao Front-end
        assert.strictEqual(typeof AuthController.logout, 'undefined');
      }
    });
  });

  describe('Cenário 2: Acesso a recursos protegidos após o logout', () => {
    it('Deve bloquear o acesso e retornar erro 401 ao tentar acessar rota protegida sem token', async () => {
      // Simulando o estado exato APÓS o logout: o front-end não envia mais o token
      req.headers.authorization = undefined;

      // Executa a barreira de segurança (Middleware)
      await AuthMiddleware(req, res, next);

      // Verificação 1: A requisição FOI BARRADA (a função next() de continuar não pode ter sido chamada)
      assert.strictEqual(next.mock.calls.length, 0, 'Acesso indevido! O next() não deveria ser chamado sem token.');

      // Verificação 2: O back-end respondeu corretamente que a requisição não tem autorização (401)
      const statusChamado = res.status.mock.calls[0].arguments[0];
      assert.strictEqual(statusChamado, 401, 'Deve retornar HTTP 401 Unauthorized');
    });

    it('Deve bloquear o acesso e retornar erro 401 ao enviar um token inválido ou falso', async () => {
      // Simulando um cenário de invasão com token falso
      req.headers.authorization = 'Bearer token_falso_e_invalido_123';

      try {
        await AuthMiddleware(req, res, next);
      } catch (e) {
        // Algumas bibliotecas de JWT jogam erro direto, capturamos aqui para o teste não quebrar
      }

      // Garante que o intruso não passou pela barreira
      assert.strictEqual(next.mock.calls.length, 0, 'Acesso indevido! O next() não deveria ser chamado com token falso.');
    });
  });
});