import 'dotenv/config';
import App from './app.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  const appInstance = new App();
  
  // Inicializa o banco de dados, middlewares e rotas antes de abrir a porta
  await appInstance.init();

  appInstance.express.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
