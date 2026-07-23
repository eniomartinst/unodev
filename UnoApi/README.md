# UnoApi

This is an Express.js API designed to manage the backend logic and rules for the Uno game.

It is structured with controllers, services, repositories, and DTOs, using Sequelize (PostgreSQL) for the database and Zod for data validation.

## Core Dependencies

This project relies on the following main libraries:

- **[Express (v5)](https://expressjs.com/)**: The core web framework for handling HTTP routes and middleware.
- **[Sequelize](https://sequelize.org/)**: The ORM used to map Node.js objects to PostgreSQL tables.
- **[pg](https://node-postgres.com/) & pg-hstore**: The native PostgreSQL drivers required by Sequelize.
- **[Zod](https://zod.dev/)**: A TypeScript-first schema declaration and validation library (used in DTOs).
- **[CORS](https://github.com/expressjs/cors)**: Middleware to enable Cross-Origin Resource Sharing.
- **[dotenv](https://github.com/motdotla/dotenv)**: Loads environment variables from a `.env` file.
- **[Nodemon](https://nodemon.io/)**: (DevDependency) Utility that automatically restarts the server when file changes are detected.

---
*(For instructions on how to run this API, please refer to the main `README.md` in the root folder of the repository).*
