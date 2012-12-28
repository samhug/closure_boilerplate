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
 * relief.nav.Handler is an interface which all handler classes must implement.
 */

goog.provide('relief.nav.Handler');

goog.require('goog.disposable.IDisposable');

goog.require('relief.nav.NavServiceProvider');
goog.require('relief.nav.Path');



/**
 * The interface for a navigation handler class.
 *
 * Handlers should be very lightweight, but since they will often have
 * references to some fairly substantial app components, they implement
 * IDisposable. Handlers are created and destroyed when the user navigates to a
 * path handled by a different Handler class.  Dispose is called after the
 * callback from handler.exit() is called.
 *
 * @interface
 * @extends {goog.disposable.IDisposable}
 */
relief.nav.Handler = function() {};


/**
 * The handle method is called when a navigation event is mapped to a handler
 * class that is not already active.  When handle is called, the handler can
 * be sure that the root element is clear and ready for use.
 *
 * @param {relief.nav.Path} path An object with request-specific parameters.
 */
relief.nav.Handler.prototype.handle = goog.abstractMethod;


/**
 * When an instance of this handler class is already handling a request,
 * transition will be called if the new navigation event is mapped to this
 * same class.  The handler can then query the user if they want to navigate to
 * the new page or not.  onTransition should be called after handling the event,
 * passing true if navigation succeeded, or false if the user opted not to leave
 * the current page.  If onTransition is called with false, the navigation will
 * be rolled back.
 *
 * @param {relief.nav.Path} path An object with request-specific parameters.
 * @param {function(boolean)} onTransition Callback to be invoked either after
 *    the handler has completed (called with "true"), or if the user decides
 *    not to navigate away (called with "false").
 */
relief.nav.Handler.prototype.transition = goog.abstractMethod;


/**
 * Save state and clear the user-interface so the next handler can use the
 * screen.
 * @param {function(boolean)} onExit Callback once exit is either
 *    complete or cancelled by the user.  Passing true to the callback means
 *    that the handler has relinquished control of the page; false means
 *    the user opted not to navigate away.
 * @param {boolean=} opt_force If for some reason the navigation is
 *    unconditional (eg., the page is unloading or the user is no longer
 *    authorized to execute this handler), force will be true and the handler
 *    must exit immediately.
 */
relief.nav.Handler.prototype.exit = goog.abstractMethod;
