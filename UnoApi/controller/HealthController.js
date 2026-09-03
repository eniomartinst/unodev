import HealthService from '../service/HealthService.js';

class HealthController {
  check(req, res) {
    const healthStatus = HealthService.check();
    return res.status(200).json(healthStatus);
  }
}

export default new HealthController();
