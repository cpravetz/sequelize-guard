var _ = require('lodash');

/**
@constructor
 *
 * @param {SequelizeAcl} acl -  SequelizeAcl instance
 *
 * @example
 * control = new AclControl(acl);
 * control.allow('admin').to('view').on('blog');
 * //this is not recommended approach use it with SequelizeAcl only.
 */
function AclControl(acl) {
  this.acl = acl;
  this._roles = [];
  this._actions = [];

  this._resources = [];
}

/**
 * Specify role to allow
 * @memberof AclControl
 * @example
 * // allow admin
 * control.allow('admin')
 *
 *
 * @param {string} roles - The name of role
 */
AclControl.prototype.allow = function (roles) {
  if (typeof roles === 'string') this._roles = roles;
  // if(typeof roles === 'string') this._control._roles = _.uniq([...this._control._roles, roles ])
  // if(Array.isArray(roles)) {
  //     this._control._roles = _.uniq([...this._control._roles, ...roles ])
  // }
  return this;
};

/**
 * Specify actions for current control
 *
 * @memberof AclControl
 *
 * @example
 * // to view
 * control.to('view')
 *
 * @param {Array|string} actions - The name(s) of actions
 */
AclControl.prototype.to = function (actions) {
  if (typeof actions === 'string') {
    this._actions = _.uniq([...this._actions, actions]);
  }

  if (Array.isArray(actions)) {
    this._actions = _.uniq([...this._actions, ...actions]);
  }

  return this;
};

/**
 * Specify resources for current control
 * @memberof AclControl
 *
 * @example
 * // add blog to current control
 * control.on('blog')
 *
 * @param {Array|string} resources - The name(s) of resources
 */
AclControl.prototype.on = function (resources) {
  if (typeof resources === 'string')
    this._resources = _.uniq([...this._resources, resources]);

  if (Array.isArray(resources))
    this._resources = _.uniq([...this._resources, ...resources]);

  return this;
};

/**
 * Commit current control
 *
  * @memberof AclControl

 * @example
 *
 * control.commit()
 *
 *  @return {Promise} Promise resolved when finished
 */
AclControl.prototype.commit = async function () {
  let acl = this.acl;
  let roles = this._roles;
  let actions = this._actions;
  let resources = this._resources;

  return acl.addPermsToRole(roles, actions, resources);
};

module.exports = function (SequelizeAcl) {
  /**
  * @description start new control statement

   *
   * @example
   * // empty previous specification
   * let aclControl = acl.init();
   *
   */
  SequelizeAcl.prototype.init = function () {
    return new AclControl(this);
  };

  /**
   * create access control in one sentence
   *

   * @example
   * acl.allow('admin','view','blogs');
   * allows admin to view blog.
   *
   * @param {string} role - role to assign permissions to
   * @param {Array} actions - array of actions
   * @param {Array} resources - array of resources
   *
   * @returns {Promise<{role, permissions}>} - roles with assigned permissions.
   */
  SequelizeAcl.prototype.allow = function (role, actions, resources) {
    return this.init().allow(role).to(actions).on(resources).commit();
  };
};