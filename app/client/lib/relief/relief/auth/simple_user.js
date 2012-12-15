// Copyright 2011 Jay Young. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview
 *
 * The SimpleUser class encapsulates enough information to identify a user and
 * his/her authorization level along a single axis.  This class includes the
 * information provided by the Google App Engine that a client side web app
 * is most likely to care about.
 */


goog.provide('relief.auth.SimpleUser');

goog.require('relief.auth.User');



/**
 * A simple representation of a user.  Once a user is created, it should be
 * considered immutable.  To avoid misbehaving clients, the Auth Manager should
 * keep a private object and return copies when asked for them.  Only the Nav
 * Manager should be requesting the user's details, which it then passes on to
 * handlers.
 *
 * @param {number} authLevel A number representing a level of authorization.
 *    Only the Auth Manager should be concerned with the meaning behind that
 *    number.
 * @param {string=} opt_displayName The string used to refer to the user on the
 *    page.  Omitted if this object is representing an unauthenticated user.
 * @param {string=} opt_uniqueID The string used to uniquely identify this user.
 *    Omitted if this object is representing an unauthenticated user.
 *
 * @constructor
 * @implements {relief.auth.User}
 */
relief.auth.SimpleUser = function(authLevel, opt_displayName, opt_uniqueID) {
  /**
   * @type {number}
   * @private
   */
  this.authLevel_ = authLevel;

  /**
   * @type {string}
   * @private
   */
  this.displayName_ = opt_displayName || '';

  /**
   * @type {string}
   * @private
   */
  this.uniqueID_ = opt_uniqueID || '';
};


/**
 * @return {number} Returns the auth level of this user.
 */
relief.auth.SimpleUser.prototype.getAuthLevel = function() {
  return this.authLevel_;
};


/**
 * @return {string} Returns the display name of the user.
 */
relief.auth.SimpleUser.prototype.getDisplayName = function() {
  return this.displayName_;
};


/**
 * @return {string} Returns the unique identifier for this user.
 */
relief.auth.SimpleUser.prototype.getUniqueID = function() {
  return this.uniqueID_;
};


/**
 * SimpleUser tests for sufficient authorization by comparing this.authLevel_
 * to handler.requiredAuth.
 *
 * @param {function(new: relief.nav.Handler)} handler The handler against which
 *    to test for sufficient authorization.
 * @return {boolean} Whether or not the user is allowed to execute the given
 *    handler.
 */
relief.auth.SimpleUser.prototype.checkAuthorized = function(handler) {
  return (this.authLevel_ >= handler.requiredAuth);
};


/**
 * @override
 */
relief.auth.SimpleUser.prototype.clone = function() {
  return new relief.auth.SimpleUser(this.authLevel_, this.displayName_,
                                    this.uniqueID_);
};
