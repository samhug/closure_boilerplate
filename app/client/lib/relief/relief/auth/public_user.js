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
 * A public user is a user on a site which has no authentication/authorization.
 * They are effectively authorized to view the entire site.  PublicUser objects
 * are used by the PublicSiteAuthManager.
 */


goog.provide('relief.auth.PublicUser');

goog.require('relief.auth.User');



/**
 * A PublicUser is authorized to view everything on the site.  It has no
 * identifying details of any kind.
 *
 * @constructor
 * @implements {relief.auth.User}
 */
relief.auth.PublicUser = function() {};


/**
 * PublicUser should only be used on a site that is 100% viewable by the
 * anonymous public.  As such, checkAuthorized always returns true.
 *
 * @return {boolean} Always true.  The whole point is that there is no
 *    athentication on apps that use PublicUsers.
 */
relief.auth.PublicUser.prototype.checkAuthorized = function() {
  return true;
};


/**
 * All PublicUser instances are exactly the same.
 *
 * @param {relief.auth.User} other The other user (not that it matters).
 * @return {boolean} Always returns true.
 */
relief.auth.PublicUser.prototype.equals = function(other) {
  return other instanceof relief.auth.PublicUser;
};


/**
 * @override
 * @return {relief.auth.PublicUser} Returns a new PublicUser.
 */
relief.auth.PublicUser.prototype.clone = function() {
  return new relief.auth.PublicUser();
};
