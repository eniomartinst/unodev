import { DataTypes, Model } from 'sequelize';
import database from '../config/database/database.js';

class Game extends Model {}

Game.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
  maxPlayers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 4 }
}, { sequelize: database.connection, modelName: 'Game', tableName: 'games', timestamps: true });

export default Game;