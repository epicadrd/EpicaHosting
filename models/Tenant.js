import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Tenant = sequelize.define(
  'Tenant',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'canceling', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'pending'
    },
    plan: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    stripe_customer_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stripe_subscription_id: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    tableName: 'tenants',
    underscored: true
  }
);