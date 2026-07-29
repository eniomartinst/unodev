import AuthService from '../service/AuthService.js';
import { registerSchema, loginSchema, tokenSchema, updateProfileSchema } from '../dtos/request/AuthRequestDTO.js';
import {
  formatRegisterResponse,
  formatLoginResponse,
  formatLogoutResponse,
  formatProfileResponse
} from '../dtos/response/AuthResponseDTO.js';

class AuthController {
  async register(req, res, next) {
    try {
      const validatedData = registerSchema.parse(req.body);

      await AuthService.register(validatedData);

      return res.status(201).json(formatRegisterResponse());
    } catch (error) {
      if (error.message === 'User already exists') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const validatedData = loginSchema.parse(req.body);

      const token = await AuthService.login(validatedData);

      return res.status(200).json(formatLoginResponse(token));
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: error.message });
      }
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // Middleware já validou o token, req.user tem os dados
      await AuthService.logout(req.user.id);

      return res.status(200).json(formatLogoutResponse());
    } catch (error) {
      next(error);
    }
  }

  async profile(req, res, next) {
    try {
      // Passamos o ID do usuário direto, extraído pelo middleware
      const user = await AuthService.getProfile(req.user.id);

      return res.status(200).json(formatProfileResponse(user));
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(401).json({ error: error.message });
      }
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await AuthService.updateProfile(req.user.id, validatedData);
      
      return res.status(200).json(formatProfileResponse(user));
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(401).json({ error: error.message });
      }
      if (error.message === 'Email already in use') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await AuthService.deleteUser(req.user.id);

      return res.status(204).send();
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(401).json({ error: error.message });
      }
      next(error);
    }
  }
}

export default new AuthController();
