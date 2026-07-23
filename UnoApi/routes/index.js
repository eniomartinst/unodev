import { Router } from 'express';
import HealthController from '../controller/HealthController.js';
import PlayerController from '../controller/PlayerController.js';
import GameController from '../controller/GameController.js';
import CardController from '../controller/CardController.js';
import ScoreController from '../controller/ScoreController.js';

const routes = Router();

// Rota de Health Check para testar a API
routes.get('/health', HealthController.check);

// Rotas do Player
routes.post('/players', PlayerController.create);
routes.get('/players', PlayerController.findAll);

// Rotas do Game
routes.post('/games', GameController.create);
routes.get('/games', GameController.findAll);

// Rotas do Card
routes.post('/cards', CardController.create);
routes.get('/cards', CardController.findAll);

// Rotas do Score
routes.post('/scores', ScoreController.create);
routes.get('/scores', ScoreController.findAll);

export default routes;
