import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../controller/GameController.js';
import GameService from '../service/GameService.js';

describe('GameController - Pontuações Atuais', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    mock.restoreAll();
    
    req = {
      body: {}
    };
    
    res = {
      status: mock.fn(function() { return this; }),
      json: mock.fn(),
    };
    
    next = mock.fn();
  });

  describe('Obtenção das pontuações dos jogadores', () => {
    it('Deve retornar as pontuações atuais com sucesso (HTTP 200)', async () => {
      // 1. Prepara o payload da requisição (espera apenas o game_id)
      req.body = { game_id: 1 };
      
      // 2. Prepara o retorno simulado do Service (Mock do Placar com a equipe)
      const mockScoresResponse = {
        game_id: 1,
        scores: [
          { playerName: 'Enio', score: 250 },
          { playerName: 'Arthur', score: 120 },
          { playerName: 'Kaio', score: 50 },
          { playerName: 'Elton', score: 0 }
        ]
      };

      mock.method(GameService, 'getScores', async () => mockScoresResponse);

      // 3. Executa a função do controlador
      await GameController.getScores(req, res, next);

      // 4. Validações
      // Garante que não houve erro de validação (Zod) ou execução
      assert.strictEqual(next.mock.calls.length, 0, 'O next() foi chamado indicando erro indevido');
      
      // Valida o status 200
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      
      // Valida se o formato do JSON atende à resposta do Service, já que o Controller faz o repasse direto
      assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockScoresResponse);
    });

    it('Deve repassar o erro para o next() quando as informações não estão disponíveis', async () => {
      // Simulando a busca por um jogo que não existe
      req.body = { game_id: 999 };
      
      const erroSimulado = new Error('Game or scores not found');

      // Forçamos o Service a disparar um erro
      mock.method(GameService, 'getScores', async () => {
        throw erroSimulado;
      });

      await GameController.getScores(req, res, next);

      // Valida se o Controller capturou o erro no 'catch' e repassou para o ErrorHandler
      assert.strictEqual(next.mock.calls.length, 1, 'O next() deveria ter sido chamado para tratar o erro');
      assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
    });
  });
});