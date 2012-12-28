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
 * The PublicAuthManager is the simplest implementation of the Auth Manager
 * possible.  It is intended for use on sites that are 100% viewable by the
 * anonymous public.  It has no authentication functionality and returns a
 * PublicUser object whenever it's queried for the current user.
 */


goog.provide('relief.auth.PublicAuthManager');

goog.require('relief.auth.AuthManager');
goog.require('relief.auth.PublicUser');



/**
 * An auth manager for sites that do not require authentication.
 *
 * @constructor
 * @extends {relief.auth.AuthManager}
 */
relief.auth.PublicAuthManager = function() {
  goog.base(this);

  /**
   * @type {relief.auth.PublicUser}
   * @private
   */
  this.user_ = new relief.auth.PublicUser();
};
goog.inherits(relief.auth.PublicAuthManager, relief.auth.AuthManager);


/**
 * Since this class represents a site with no authentication, we always
 * immediately pass a relief.auth.PublicUser to the callback.
 *
 * @param {function(relief.auth.User)} callback The client's callback.
 */
relief.auth.PublicAuthManager.prototype.getCurrentUser = function(callback) {
  setTimeout(goog.partial(callback, this.user_), 0);
};
