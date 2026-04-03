import { sequelize } from '../config/database.js';
import { Tenant } from './Tenant.js';
import { User } from './User.js';

Tenant.hasMany(User, {
  foreignKey: 'tenant_id',
  as: 'users'
});

User.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

export { sequelize, Tenant, User };