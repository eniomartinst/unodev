import { DataTypes, Model } from 'sequelize';
import database from '../config/database/database.js';

class Player extends Model {}

Player.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize: database.connection,
  modelName: 'Player',
  tableName: 'players',
  timestamps: true
});

export default Player;
