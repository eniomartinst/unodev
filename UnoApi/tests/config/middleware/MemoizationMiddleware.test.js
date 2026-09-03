import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import MemoizationMiddleware from '../../../config/middleware/MemoizationMiddleware.js';

/**
 * Utilitário para criar instâncias mock de req, res e next para Express.
 */
const createReqRes = (method = 'GET', url = '/api/scores', body = {}) => {
  const req = {
    method,
    originalUrl: url,
    url,
    body,
  };
  const res = {
    json: mock.fn(function (data) {
      this.sentData = data;
      return this;
    }),
  };
  const next = mock.fn();
  return { req, res, next };
};

describe('MemoizationMiddleware - Testes Unitários de Cache e LRU', () => {

  describe('Cenário 1: Armazenamento em Cache (Hit / Miss)', () => {
    it('Deve chamar next() no primeiro request (Cache Miss) e retornar dados do cache sem chamar next() no segundo request (Cache Hit)', () => {
      const middleware = MemoizationMiddleware({ max: 10, maxAge: 5000 });
      const { req: req1, res: res1, next: next1 } = createReqRes('GET', '/api/scores');

      // Primeira requisição - Miss (deve chamar next)
      middleware(req1, res1, next1);
      assert.strictEqual(next1.mock.calls.length, 1);

      // Simula a resposta do controller
      const mockData = [{ id: 1, score: 100 }];
      res1.json(mockData);
      assert.deepStrictEqual(res1.sentData, mockData);

      // Segunda requisição com a mesma rota/método/body - Hit (não chama next e retorna cache)
      const { req: req2, res: res2, next: next2 } = createReqRes('GET', '/api/scores');
      middleware(req2, res2, next2);

      assert.strictEqual(next2.mock.calls.length, 0);
      assert.strictEqual(res2.json.mock.calls.length, 1);
      assert.deepStrictEqual(res2.sentData, mockData);
    });

    it('Deve tratar requisições com bodies ou métodos diferentes como chaves distintas (Cache Miss)', () => {
      const middleware = MemoizationMiddleware({ max: 10, maxAge: 5000 });

      // Request 1
      const { req: req1, res: res1, next: next1 } = createReqRes('POST', '/api/scores', { gameId: 1 });
      middleware(req1, res1, next1);
      res1.json({ success: true, gameId: 1 });

      // Request 2 - mesmo endpoint mas body diferente -> Miss
      const { req: req2, res: res2, next: next2 } = createReqRes('POST', '/api/scores', { gameId: 2 });
      middleware(req2, res2, next2);
      assert.strictEqual(next2.mock.calls.length, 1);

      // Request 3 - mesmo endpoint mas método diferente -> Miss
      const { req: req3, res: res3, next: next3 } = createReqRes('GET', '/api/scores');
      middleware(req3, res3, next3);
      assert.strictEqual(next3.mock.calls.length, 1);
    });
  });

  describe('Cenário 2: Filtro de Expiração (maxAge)', () => {
    it('Deve invalidar e limpar o cache quando o tempo maxAge expirar', async () => {
      const maxAge = 50; // 50ms
      const middleware = MemoizationMiddleware({ max: 5, maxAge });

      // Primeira requisição - Miss
      const { req: req1, res: res1, next: next1 } = createReqRes('GET', '/api/scores');
      middleware(req1, res1, next1);
      res1.json([{ id: 1, score: 50 }]);

      // Requisição antes de expirar - Hit
      const { req: req2, res: res2, next: next2 } = createReqRes('GET', '/api/scores');
      middleware(req2, res2, next2);
      assert.strictEqual(next2.mock.calls.length, 0);

      // Aguarda 70ms (> maxAge de 50ms)
      await new Promise((resolve) => setTimeout(resolve, 70));

      // Requisição após expiração - Miss (deve chamar next novamente)
      const { req: req3, res: res3, next: next3 } = createReqRes('GET', '/api/scores');
      middleware(req3, res3, next3);
      assert.strictEqual(next3.mock.calls.length, 1);
    });
  });

  describe('Cenário 3: Acumulador LRU (Capacidade Máxima e Evicção por lastAccessed)', () => {
    it('Deve ejetar o item menos recentemente acessado (menor lastAccessed) quando atingir o limite max', async () => {
      const middleware = MemoizationMiddleware({ max: 2, maxAge: 10000 });

      // 1. Armazena Item A (/api/scores/1)
      const { req: reqA, res: resA, next: nextA } = createReqRes('GET', '/api/scores/1');
      middleware(reqA, resA, nextA);
      resA.json({ item: 'A' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 2. Armazena Item B (/api/scores/2)
      const { req: reqB, res: resB, next: nextB } = createReqRes('GET', '/api/scores/2');
      middleware(reqB, resB, nextB);
      resB.json({ item: 'B' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 3. Acessa Item A novamente -> atualiza lastAccessed de A (A fica mais recente que B)
      const { req: reqA2, res: resA2, next: nextA2 } = createReqRes('GET', '/api/scores/1');
      middleware(reqA2, resA2, nextA2);
      assert.strictEqual(nextA2.mock.calls.length, 0); // Hit em A
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 4. Armazena Item C (/api/scores/3) -> atinge limite (max: 2), deve ejetar B (menor lastAccessed)
      const { req: reqC, res: resC, next: nextC } = createReqRes('GET', '/api/scores/3');
      middleware(reqC, resC, nextC);
      resC.json({ item: 'C' });

      // 5. Verifica se B foi ejetado (Miss -> chama next)
      const { req: reqB2, res: resB2, next: nextB2 } = createReqRes('GET', '/api/scores/2');
      middleware(reqB2, resB2, nextB2);
      assert.strictEqual(nextB2.mock.calls.length, 1);

      // 6. Verifica se A ainda está no cache (Hit -> não chama next)
      const { req: reqA3, res: resA3, next: nextA3 } = createReqRes('GET', '/api/scores/1');
      middleware(reqA3, resA3, nextA3);
      assert.strictEqual(nextA3.mock.calls.length, 0);
      assert.deepStrictEqual(resA3.sentData, { item: 'A' });
    });
  });

});
