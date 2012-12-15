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
 * The User interface defines the methods that the auth and nav managers
 * require on a User object.  An unauthenticated user is still represented
 * with a User object.
 */


goog.provide('relief.auth.User');



/**
 * A class that represents a user's details, including identifying information
 * (display name, e-mail address) as well as their authorization level(s).
 *
 * @interface
 */
relief.auth.User = function() {};


/**
 * The navigation manager requires that User objects provide the
 * checkAuthorized method, which takes a relief.nav.Handler constructor
 * and returns a boolean indicating whether the user has sufficient
 * authorization to view that handler.
 *
 * @param {function(new: relief.nav.Handler)} handler The handler against which
 *    to test for sufficient authorization.
 * @return {boolean} Whether or not the user is allowed to execute the given
 *    handler.
 */
relief.auth.User.prototype.checkAuthorized = goog.abstractMethod;


/**
 * Since AuthManager implementations are supposed to pass around clones instead
 * of their canonical version of the user object, User objects must have a way
 * to determine if they are equivalent without being the same object.
 *
 * @param {relief.auth.User} other The other user object.
 * @return {boolean} Whether or not the two user objects are equivalent.
 */
relief.auth.User.prototype.equals = goog.abstractMethod;


/**
 * The Auth manager gets its hands on a User object after a trip to the server
 * for the details, then keeps a reference to that User object until his/her
 * authorization changes (login or logout).  In order to keep that one object
 * safe, the User object must provide a clone method that returns a throw-away
 * copy for distribution to the navigation manager, and then on to the
 * handlers.  A new copy is made for every navigation event to prevent
 * mischeivous handlers from changing it.
 *
 * @return {relief.auth.User} A copy of this user object.
 */
relief.auth.User.prototype.clone = goog.abstractMethod;
