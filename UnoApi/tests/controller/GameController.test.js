import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import GameController from '../../controller/GameController.js';
import GameService from '../../service/GameService.js';

describe('GameController', () => {

  // ─── OPERAÇÕES CRUD BASE ──────────────────────────────────────────────────
  describe('Operações CRUD Base', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      mock.restoreAll();
      req = { 
        params: {}, 
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

    describe('Criação de um novo jogo (create)', () => {
      // Teste para: Criação de um novo jogo via CRUD (HTTP 201)
      it('Deve criar um jogo com sucesso e retornar 201', async () => {
        const mockGame = { 
          id: 1, 
          title: 'Sala dos Campeões', 
          status: 'waiting', 
          maxPlayers: 4, 
          usersInGame: [], 
          createdAt: '2026-08-09T12:00:00.000Z' 
        };
        
        req.body = { 
          title: 'Sala dos Campeões',
          maxPlayers: 4,
          status: 'waiting'
        };
        
        mock.method(GameService, 'create', async () => mockGame);

        await GameController.create(req, res, next);

        if (next.mock.calls.length > 0) {
          console.error("ERRO DO CONTROLLER:", next.mock.calls[0].arguments[0]);
        }

        assert.strictEqual(next.mock.calls.length, 0, 'O next() foi chamado, indicando um erro no controller');
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockGame);
      });
    });

    describe('Obtenção de informações (findAll e findById)', () => {
      // Teste para: Listagem de todos os jogos registrados (HTTP 200)
      it('Deve retornar uma lista de jogos com sucesso (200)', async () => {
        const mockGamesList = [
          { id: 1, title: 'Sala A', status: 'waiting', maxPlayers: 4, usersInGame: [], createdAt: '2026-08-09T12:00:00.000Z' },
          { id: 2, title: 'Sala B', status: 'active', maxPlayers: 4, usersInGame: [1, 2], createdAt: '2026-08-09T12:00:00.000Z' }
        ];
        mock.method(GameService, 'findAll', async () => mockGamesList);

        await GameController.findAll(req, res, next);

        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockGamesList);
      });

      // Teste para: Recuperação de detalhes de um jogo específico (HTTP 200)
      it('Deve retornar os detalhes de um jogo específico (200)', async () => {
        const mockGame = { id: 5, title: 'Sala de Teste', status: 'waiting', maxPlayers: 4, usersInGame: [], createdAt: '2026-08-09T12:00:00.000Z' };
        req.params.id = 5;
        mock.method(GameService, 'findById', async () => mockGame);

        await GameController.findById(req, res, next);

        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockGame);
      });
    });

    describe('Atualização de detalhes (update)', () => {
      // Teste para: Atualização dos atributos de um jogo (HTTP 200)
      it('Deve atualizar os detalhes do jogo e retornar 200', async () => {
        const updatedGame = { id: 1, title: 'Sala Atualizada', status: 'active', maxPlayers: 4, usersInGame: [], createdAt: '2026-08-09T12:00:00.000Z' };
        req.params.id = 1;
        req.body = { status: 'active' };
        mock.method(GameService, 'update', async () => updatedGame);

        await GameController.update(req, res, next);

        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], updatedGame);
      });
    });

    describe('Exclusão de um jogo (delete)', () => {
      // Teste para: Remoção de um jogo com sucesso (HTTP 204)
      it('Deve excluir o jogo e retornar status 204 (No Content)', async () => {
        req.params.id = 10;
        mock.method(GameService, 'delete', async () => true);

        await GameController.delete(req, res, next);

        assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
        assert.strictEqual(res.send.mock.calls.length, 1);
      });
    });
  });

  // ─── ENDPOINTS ESPECÍFICOS DE REGRAS DE NEGÓCIO ───────────────────────────

  describe('Criar Novo Jogo (Custom Endpoint)', () => {
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

    // Teste para: Criação de sala de jogo com parâmetros reduzidos (HTTP 201)
    it('Deve criar um novo jogo com sucesso (HTTP 201)', async () => {
      req.body = { title: 'Test Game', maxPlayers: 4 };
      const mockGame = { id: 1, maxPlayers: 4, status: 'waiting', usersInGame: [] };
      
      mock.method(GameService, 'create', async () => mockGame);

      await GameController.create(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
      
      const responseBody = res.json.mock.calls[0].arguments[0];
      assert.strictEqual(responseBody.id, 1);
      assert.strictEqual(responseBody.status, 'waiting');
    });
  });

  describe('Obter Jogador Atual do Turno (Tarefa 17)', () => {
    let req, res, next;

    beforeEach(() => {
      mock.restoreAll();
      req = { params: {}, body: {}, user: { id: 1 } };
      res = {
        status: mock.fn(function () { return this; }),
        json: mock.fn(),
        send: mock.fn()
      };
      next = mock.fn();
    });

    describe('Obtenção bem-sucedida do jogador atual', () => {
      // Teste para: Retorno correto de quem é o turno na partida
      it('Deve retornar o jogador do turno atual com HTTP 200', async () => {
        req.body = { game_id: 1 };
        const mockGame = {
          id: 1, title: 'Sala Principal', status: 'in_progress', maxPlayers: 4,
          usersInGame: [
            { username: 'alice', token: 'tok_alice', isCreator: true, isReady: true },
            { username: 'bob',   token: 'tok_bob',   isCreator: false, isReady: true }
          ],
          currentPlayerIndex: 0, createdAt: '2026-08-09T12:00:00.000Z'
        };

        mock.method(GameService, 'getCurrentTurnPlayer', async () => ({
          game: mockGame, currentPlayer: 'alice'
        }));

        await GameController.getCurrentPlayer(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0, 'next() não deve ser chamado em caso de sucesso');
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
          game_id: 1, current_player: 'alice'
        });
      });

      // Teste para: Retorno de turno nulo quando a sala está vazia
      it('Deve retornar current_player como null quando usersInGame está vazio', async () => {
        req.body = { game_id: 2 };
        const mockGame = {
          id: 2, title: 'Sala Vazia', status: 'waiting', maxPlayers: 4,
          usersInGame: [], currentPlayerIndex: null, createdAt: '2026-08-09T12:00:00.000Z'
        };

        mock.method(GameService, 'getCurrentTurnPlayer', async () => ({
          game: mockGame, currentPlayer: null
        }));

        await GameController.getCurrentPlayer(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
          game_id: 2, current_player: null
        });
      });
    });

    describe('Tratamento de erros', () => {
      // Teste para: Exceção ao consultar turno de jogo inexistente
      it('Deve chamar next() quando o turno não está definido (jogo não encontrado)', async () => {
        req.body = { game_id: 999 };
        const erroSimulado = new Error('Jogo com ID 999 não encontrado.');
        mock.method(GameService, 'getCurrentTurnPlayer', async () => { throw erroSimulado; });

        await GameController.getCurrentPlayer(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });

      // Teste para: Exceção por falha interna ao determinar o turno
      it('Deve chamar next() quando o serviço falhar ao determinar o turno', async () => {
        req.body = { game_id: 3 };
        const erroSimulado = new Error('Não foi possível determinar o jogador do turno atual.');
        mock.method(GameService, 'getCurrentTurnPlayer', async () => { throw erroSimulado; });

        await GameController.getCurrentPlayer(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });
    });
  });

  describe('Finalizar o Jogo', () => {
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

    // Teste para: Encerramento de partida via criador
    it('Deve finalizar um jogo com sucesso (HTTP 200)', async () => {
      req.body = { game_id: 1, access_token: 'token_valido' };
      mock.method(GameService, 'endGame', async () => true);

      await GameController.end(req, res, next);

      assert.strictEqual(next.mock.calls.length, 0);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
      const responseBody = res.json.mock.calls[0].arguments[0];
      assert.strictEqual(responseBody.message, 'Game ended successfully');
    });

    // Teste para: Bloqueio ao tentar finalizar jogo sem ser o criador
    it('Deve repassar erros da camada de serviço', async () => {
      req.body = { game_id: 1, access_token: 'token_valido' };
      const businessError = new Error('Apenas o criador do jogo pode encerrá-lo.');
      mock.method(GameService, 'endGame', async () => { throw businessError; });

      await GameController.end(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1);
      assert.strictEqual(next.mock.calls[0].arguments[0], businessError);
    });
  });

  describe('Lista de Jogadores', () => {
    let req, res, next;

    beforeEach(() => {
      mock.restoreAll();
      req = { body: {} };
      res = {
        status: mock.fn(function() { return this; }),
        json: mock.fn(),
      };
      next = mock.fn();
    });

    describe('Obtenção da lista de jogadores', () => {
      // Teste para: Retorno de nomes dos jogadores conectados na sala
      it('Deve retornar a lista atual de jogadores com sucesso (HTTP 200)', async () => {
        req.body = { game_id: 1 };
        const mockServiceResponse = {
          game: { id: 1 },
          playerNames: ['Enio', 'Arthur', 'Kaio', 'Elton']
        };

        mock.method(GameService, 'getPlayers', async () => mockServiceResponse);

        await GameController.getPlayers(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
          game_id: 1, players: ['Enio', 'Arthur', 'Kaio', 'Elton']
        });
      });

      // Teste para: Falha ao buscar lista de jogadores em sala inválida
      it('Deve realizar o tratamento adequado repassando o erro para o next()', async () => {
        req.body = { game_id: 999 };
        const erroSimulado = new Error('Game not found');
        mock.method(GameService, 'getPlayers', async () => { throw erroSimulado; });

        await GameController.getPlayers(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });
    });
  });

  describe('Pontuações Atuais', () => {
    let req, res, next;

    beforeEach(() => {
      mock.restoreAll();
      req = { body: {} };
      res = {
        status: mock.fn(function() { return this; }),
        json: mock.fn(),
      };
      next = mock.fn();
    });

    describe('Obtenção das pontuações dos jogadores', () => {
      // Teste para: Retorno correto do placar da partida
      it('Deve retornar as pontuações atuais com sucesso (HTTP 200)', async () => {
        req.body = { game_id: 1 };
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

        await GameController.getScores(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockScoresResponse);
      });

      // Teste para: Exceção ao consultar pontuação de partida que não existe
      it('Deve repassar o erro para o next() quando as informações não estão disponíveis', async () => {
        req.body = { game_id: 999 };
        const erroSimulado = new Error('Game or scores not found');
        mock.method(GameService, 'getScores', async () => { throw erroSimulado; });

        await GameController.getScores(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });
    });
  });

  describe('Ingressar em um Jogo (Tarefa 11)', () => {
    let req, res, next;

    beforeEach(() => {
      mock.restoreAll();
      req = { user: { id: 1 }, body: {} };
      res = {
        status: mock.fn(function() { return this; }),
        json: mock.fn(),
      };
      next = mock.fn();
    });

    describe('Fluxo de entrada na mesa', () => {
      // Teste para: Participação bem sucedida de um usuário na sala
      it('Deve ingressar em um jogo disponível com sucesso (HTTP 200)', async () => {
        req.body = { game_id: 15, access_token: 'token_valido' };
        mock.method(GameService, 'joinGame', async () => true);

        await GameController.join(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { message: "User joined the game successfully" });
      });

      // Teste para: Bloqueio de acesso a sala que já atingiu o limite de jogadores
      it('Deve repassar o erro para o next() se o jogo estiver cheio ou indisponível', async () => {
        req.body = { game_id: 99, access_token: 'token_valido' };
        const erroSimulado = new Error('Game is full or not available');
        mock.method(GameService, 'joinGame', async () => { throw erroSimulado; });

        await GameController.join(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });
    });
  });

  describe('Deixar o Jogo (Tarefa 13)', () => {
    let req, res, next;

    beforeEach(() => {
      mock.restoreAll();
      req = { body: {} };
      res = {
        status: mock.fn(function() { return this; }),
        json: mock.fn(),
      };
      next = mock.fn();
    });

    describe('Fluxo de saída da mesa', () => {
      // Teste para: Desconexão intencional de um jogador durante a partida
      it('Deve sair de um jogo em andamento com sucesso (HTTP 200)', async () => {
        req.body = { game_id: 15, access_token: 'token_valido' };
        mock.method(GameService, 'leaveGame', async () => true);

        await GameController.leave(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { message: "User left the game successfully" });
      });

      // Teste para: Falha ao tentar abandonar sala na qual o usuário não está
      it('Deve repassar o erro para o next() se o jogo não estiver em andamento ou jogador não estiver nele', async () => {
        req.body = { game_id: 99, access_token: 'token_valido' };
        const erroSimulado = new Error('Usuário não encontrado nesta partida');
        mock.method(GameService, 'leaveGame', async () => { throw erroSimulado; });

        await GameController.leave(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });
    });
  });

  describe('Iniciar o Jogo (Tarefa 12)', () => {
    let req, res, next;

    beforeEach(() => {
      mock.restoreAll();
      req = { params: {}, body: {}, user: { id: 1 } };
      res = {
        status: mock.fn(function () { return this; }),
        json: mock.fn(),
        send: mock.fn()
      };
      next = mock.fn();
    });

    describe('Início bem-sucedido', () => {
      // Teste para: Início da partida pelo proprietário/host da sala
      it('Deve iniciar o jogo com sucesso e retornar HTTP 200', async () => {
        req.body = { game_id: 1, access_token: 'token_do_criador_valido' };
        mock.method(GameService, 'startGame', async () => true);

        await GameController.start(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { message: 'Game started successfully' });
      });
    });

    describe('Tratamento de erros', () => {
      // Teste para: Bloqueio de início por insuficiência de usuários
      it('Deve chamar next() quando não há jogadores suficientes (mínimo 2)', async () => {
        req.body = { game_id: 2, access_token: 'token_valido' };
        const erroSimulado = new Error('Mínimo de 2 jogadores para iniciar.');
        mock.method(GameService, 'startGame', async () => { throw erroSimulado; });

        await GameController.start(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });

      // Teste para: Bloqueio ao tentar iniciar partida que já está ativa
      it('Deve chamar next() quando o jogo já está em andamento', async () => {
        req.body = { game_id: 3, access_token: 'token_valido' };
        const erroSimulado = new Error('Este jogo já começou ou foi encerrado.');
        mock.method(GameService, 'startGame', async () => { throw erroSimulado; });

        await GameController.start(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });

      // Teste para: Bloqueio de início de partida por usuário sem privilégios
      it('Deve chamar next() quando quem tenta iniciar não é o criador da sala', async () => {
        req.body = { game_id: 4, access_token: 'token_nao_criador' };
        const erroSimulado = new Error('Apenas o criador pode iniciar a partida.');
        mock.method(GameService, 'startGame', async () => { throw erroSimulado; });

        await GameController.start(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });
    });
  });

  describe('Obter Estado do Jogo (Tarefa 15)', () => {
    let req, res, next;

    beforeEach(() => {
      mock.restoreAll();
      req = { params: {}, body: {}, user: { id: 1 } };
      res = {
        status: mock.fn(function () { return this; }),
        json: mock.fn(),
        send: mock.fn()
      };
      next = mock.fn();
    });

    describe('Obtenção bem-sucedida do estado', () => {
      // Teste para: Verificação de status de partida em andamento
      it('Deve retornar o estado atual do jogo com HTTP 200 (jogo em andamento)', async () => {
        req.body = { game_id: 1 };
        const mockGame = {
          id: 1, title: 'Sala UNO', status: 'in_progress', maxPlayers: 4,
          usersInGame: [{ username: 'alice' }, { username: 'bob' }],
          createdAt: '2026-08-09T12:00:00.000Z'
        };

        mock.method(GameService, 'getGameState', async () => mockGame);

        await GameController.getState(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { game_id: 1, state: 'in_progress' });
      });

      // Teste para: Verificação de status de sala aguardando jogadores
      it('Deve retornar o estado "waiting" para um jogo que ainda não começou', async () => {
        req.body = { game_id: 2 };
        const mockGame = {
          id: 2, title: 'Sala Aguardando', status: 'waiting', maxPlayers: 4,
          usersInGame: [], createdAt: '2026-08-09T12:00:00.000Z'
        };

        mock.method(GameService, 'getGameState', async () => mockGame);

        await GameController.getState(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { game_id: 2, state: 'waiting' });
      });
    });

    describe('Tratamento de erros', () => {
      // Teste para: Falha ao solicitar status de jogo que não existe na base
      it('Deve chamar next() quando o jogo não for encontrado (informações não disponíveis)', async () => {
        req.body = { game_id: 999 };
        const erroSimulado = new Error('Jogo com ID 999 não encontrado.');
        mock.method(GameService, 'getGameState', async () => { throw erroSimulado; });

        await GameController.getState(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });

      // Teste para: Tratamento de acesso à partida que já foi encerrada
      it('Deve chamar next() quando o jogo não está em andamento (status "finished")', async () => {
        req.body = { game_id: 5 };
        const erroSimulado = new Error('O jogo não está em andamento.');
        mock.method(GameService, 'getGameState', async () => { throw erroSimulado; });

        await GameController.getState(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });
    });
  });

  describe('Obter Carta do Topo da Pilha (Tarefa 18)', () => {
    let req, res, next;

    beforeEach(() => {
      mock.restoreAll();
      req = { params: {}, body: {}, user: { id: 1 } };
      res = {
        status: mock.fn(function () { return this; }),
        json: mock.fn(),
        send: mock.fn()
      };
      next = mock.fn();
    });

    describe('Obtenção bem-sucedida da carta do topo', () => {
      // Teste para: Retorno padrão da carta ativa no descarte
      it('Deve retornar a carta do topo da pilha de descarte com HTTP 200', async () => {
        req.body = { game_id: 1 };
        const mockResposta = { game_id: 1, top_card: 'Red 5' };
        mock.method(GameService, 'getTopCard', async () => mockResposta);

        await GameController.getTopCard(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockResposta);
      });

      // Teste para: Retorno de carta de efeito/curinga no topo do descarte
      it('Deve retornar corretamente uma carta curinga do topo', async () => {
        req.body = { game_id: 2 };
        const mockResposta = { game_id: 2, top_card: 'Wild WildDraw4' };
        mock.method(GameService, 'getTopCard', async () => mockResposta);

        await GameController.getTopCard(req, res, next);

        assert.strictEqual(next.mock.calls.length, 0);
        assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
        assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], mockResposta);
      });
    });

    describe('Tratamento de erros', () => {
      // Teste para: Falha de acesso a pilha de descarte de jogo inválido
      it('Deve chamar next() quando o jogo não é encontrado (pilha indisponível)', async () => {
        req.body = { game_id: 999 };
        const erroSimulado = new Error('Jogo com ID 999 não encontrado.');
        mock.method(GameService, 'getTopCard', async () => { throw erroSimulado; });

        await GameController.getTopCard(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });

      // Teste para: Exceção lógica quando a mesa não possui nenhuma carta inicializada
      it('Deve chamar next() quando a pilha de descarte está vazia', async () => {
        req.body = { game_id: 3 };
        const erroSimulado = new Error('A pilha de descarte está vazia.');
        mock.method(GameService, 'getTopCard', async () => { throw erroSimulado; });

        await GameController.getTopCard(req, res, next);

        assert.strictEqual(next.mock.calls.length, 1);
        assert.strictEqual(next.mock.calls[0].arguments[0], erroSimulado);
      });
    });
  });

});