import { Router } from 'express';
import HealthController from '../controller/HealthController.js';
import GameController from '../controller/GameController.js';
import CardController from '../controller/CardController.js';
import ScoreController from '../controller/ScoreController.js';
import AuthController from '../controller/AuthController.js';
import AuthMiddleware from '../config/middleware/AuthMiddleware.js';

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

export default routes;