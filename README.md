# Uno Project

This is a monorepo containing both the Backend (API) and the Frontend for the Uno game.

## Project Structure

- `UnoApi/`: The backend built with Node.js using Express 5, Sequelize (PostgreSQL), and Zod.
- `Front-end`: *To be implemented in the future.*

---

## How to Run the Project

You can run the project using Docker or locally on your machine.

### Option 1: Run with Docker (Recommended)

Docker configures the database and the API automatically.

1. In the `UnoApi/.env` file, configure the host:
   ```env
   DB_HOST=db
   ```
2. At the root of the project, start the containers:
   ```bash
   docker-compose up -d
   ```
The API will be available at `http://localhost:3000`.

---

### Option 2: Run Locally (Without Docker)

If you prefer to run it using your local Node.js and PostgreSQL installations:

1. Create a database named `unodb` in your local PostgreSQL.
2. In the `UnoApi/.env` file, change the host to your local machine:
   ```env
   DB_HOST=localhost
   ```
3. Inside the `UnoApi` folder, install the dependencies:
   ```bash
   cd UnoApi
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
The API will be running at `http://localhost:3000` consuming your local database.

---

### Frontend
*Waiting for implementation...*
