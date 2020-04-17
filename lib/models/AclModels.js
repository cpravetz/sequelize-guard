'use strict';
const { DataTypes } = require("sequelize");
var {schemas,tablesMap,  } = require("../migrations/acl-schema");
var modelOptions  = require("./modelOptions");

module.exports = (acl, options) => {
    const  sequelize = acl._sequelize;

    const AclResource = sequelize.define("AclResource",
        {
            ...schemas[tablesMap.resources]
        },
        {
            ...modelOptions(options),
            tableName: options.prefix + tablesMap.resources,
        }
    );

    const AclPermission = sequelize.define("AclPermission",
        {
            ...schemas[tablesMap.permissions]
        }, {
            ...modelOptions(options),
            tableName: options.prefix + tablesMap.permissions,
        }
    );


    const AclRole = sequelize.define("AclRole",
        {
            ...schemas[tablesMap.roles]
        },{
            ...modelOptions(options),
            tableName: options.prefix + tablesMap.roles,
        }
    );

    AclRole.hasMany(AclRole, { as: 'ChildRoles', foreignKey: 'parent_id'});
    AclRole.belongsTo(AclRole, {foreignKey: 'parent_id', as: 'Parent'});

    const RolePermission = sequelize.define('RolePermission',
        {
            id : {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },    
            role_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: AclRole, // 'Movies' would also work
                    key: 'id'
                }
            },
            permission_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: AclPermission, // 'Actors' would also work
                    key: 'id'
                }
            }
        },
        {
            ...modelOptions(options),
            tableName: options.prefix + tablesMap.role_permission,
            indexes: [
                {
                    unique: true,
                    fields: ['role_id', 'permission_id']
                }
            ],
        }
    );
    

    AclRole.belongsToMany(AclPermission, { through: 'RolePermission', as: "Permissions" , foreignKey: 'role_id'});
    AclPermission.belongsToMany(AclRole, { through: 'RolePermission', as: "Roles", foreignKey: 'permission_id' });

    const AclModels = {AclResource, AclRole, AclPermission, RolePermission,};

    let AclUser = options.UserModel;
    let userColId = `user_id`;
    let roleColId = `role_id`;

    if(!AclUser){
        AclUser = sequelize.define("User", {
            ...schemas['users'],
        },{tableName : `${options.prefix}users`});
    }

    AclModels.AclUser = AclUser;

    let roleUserSchema = {
        id : {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        }
    };
    roleUserSchema[`${roleColId}`] = {
        type: DataTypes.INTEGER,
        references: {
            model: AclRole,
            key: 'id'
        },
        onDelete: 'cascade'
    };
    roleUserSchema[`${userColId}`] = {
        type: DataTypes.INTEGER,
        references: {
            model: AclUser,
            key: options.userPk
        },
        onDelete: 'cascade'
    };

    const RoleUser = sequelize.define('RoleUser', roleUserSchema,
        {
            ...modelOptions(options),
            tableName: options.prefix + tablesMap.role_user,
            indexes: [
                {
                    unique: true,
                    fields: [roleColId, userColId]
                }
            ]
        }
    );
    AclModels.RoleUser = RoleUser;

    AclRole.belongsToMany(AclUser, { through: 'RoleUser', as: 'Users', foreignKey: roleColId });
    AclUser.belongsToMany(AclRole, { through: 'RoleUser', as: 'Roles', foreignKey: userColId });

    return AclModels;
}