import { Router } from 'express';
import HealthController from '../controller/HealthController.js';
import GameController from '../controller/GameController.js';
import CardController from '../controller/CardController.js';
import ScoreController from '../controller/ScoreController.js';
import AuthController from '../controller/AuthController.js';
import StatsController from '../controller/StatsController.js';
import AuthMiddleware from '../config/middleware/AuthMiddleware.js';
import MemoizationMiddleware from '../config/middleware/MemoizationMiddleware.js';

const routes = Router();

// Rota de Health Check para testar a API
routes.get('/health', HealthController.check);

// Rotas de Autenticacao
routes.post('/auth/register', AuthController.register);
routes.post('/auth/login', AuthController.login);
routes.post('/auth/logout', AuthMiddleware, AuthController.logout);
routes.get('/auth/profile', AuthMiddleware, AuthController.profile);
routes.put('/auth/profile', AuthMiddleware, AuthController.updateProfile);
routes.delete('/auth', AuthMiddleware, AuthController.delete);

// Rotas do Game
routes.post('/games', GameController.create);
routes.get('/games', GameController.findAll);
routes.get('/games/:id', GameController.findById);
routes.put('/games/:id', GameController.update);
routes.delete('/games/:id', GameController.delete);

// Rotas do Card
routes.post('/cards', CardController.create);
routes.get('/cards', CardController.findAll);
routes.put('/cards/:id', CardController.update);
routes.delete('/cards/:id', CardController.delete);

// Rotas do Score
routes.post('/scores', ScoreController.create);
routes.get('/scores', ScoreController.findAll);
routes.put('/scores/:id', ScoreController.update);
routes.delete('/scores/:id', ScoreController.delete);

// Rotas de ações avançadas do Game (Reqs 6, 7 e 8)
routes.post('/games/join', GameController.join);
routes.post('/games/start', GameController.start);
routes.post('/games/leave', GameController.leave);

// Rotas de ações avançadas do Game (Reqs 9, 10, 11 e 12)
routes.post('/games/end', GameController.end);                         // Etapa 9 — Finalizar jogo
routes.post('/games/state', GameController.getState);                  // Etapa 10 — Estado do jogo
routes.post('/games/players', GameController.getPlayers);              // Etapa 11 — Listar jogadores
routes.post('/games/current-player', GameController.getCurrentPlayer); // Etapa 12 — Jogador atual

routes.post('/games/top-card', GameController.getTopCard);             // Etapa 13 - Carta do topo
routes.post('/games/scores', MemoizationMiddleware({ max: 50, maxAge: 5000 }), GameController.getScores);                // Etapa 14 - Pontuações

// Rotas de Estatísticas
routes.get('/stats/usage', StatsController.getUsage);
routes.get('/stats/performance', StatsController.getPerformance);
routes.get('/stats/status-codes', StatsController.getStatusCodes);
routes.get('/stats/popular-endpoints', StatsController.getPopularEndpoints);

export default routes;
