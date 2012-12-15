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
 * The NavManager class provides the client-side equivalent of request routing
 * based on URL Hash parameters.  It is integrated with whatever instance of
 * the AuthManager class it's given in order to ensure the client is allowed
 * to view what they are trying to view.
 *
 * TODO: As it is currently implemented, every interesting extension point is
 * @private, making subclassing of NavManager fundamentally impossible.  At some
 * point, this should be remedied.
 */


goog.provide('relief.nav.NavManager');

goog.require('goog.History');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.history.EventType');

goog.require('relief.auth.EventType');
goog.require('relief.nav.NavEvent');
goog.require('relief.nav.NavServiceProvider');
goog.require('relief.nav.Path');
goog.require('relief.nav.URLMap');
goog.require('relief.utils');



/**
 * The Nav class is responsible for routing location changes to the appropriate
 * Handler class.  For the purposes of using a goog.History object, this class
 * requires there be an iframe with the id "history_frame" and a hidden input
 * element with the id "history_input".
 *
 * NavManager fires relief.nav.NavEvent events on successful navigations.
 *
 * @param {!relief.nav.NavServiceProvider} sp The ServiceProvider to be passed
 *    to the app's Handler constructors.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
relief.nav.NavManager = function(sp) {
  goog.base(this);

  sp.setNavManager(this);

  var url = relief.utils.getLocationHref(),
      hashIndex = url.lastIndexOf('#'),
      containsHash = (hashIndex === -1) ? false : true;

  // URL may end in '', '/', '#', '/#', or '/#/some/path'.
  // this.baseURL_ needs to handle all of these.
  // baseURL should NOT end in a trailing slash.
  var base = '';
  if (! containsHash) {
    base = url.charAt(url.length - 1) === '/' ? url.match(/(.*)\/$/)[1] : url;
  }
  else {
    base = url.charAt(hashIndex - 1) === '/' ?
        url.match(/(.*)\/#/)[1] : url.match(/(.*)#/)[1];
  }

  /**
   * @type {relief.nav.URLMap}
   * @private
   */
  this.urlMap_ = sp.getURLMap();

  /**
   * @type {string}
   * @private
   */
  this.baseURL_ = base;

  var defaultPath = this.disectPath_('');
  /**
   * The current page.  Gets set in handleNavigation_.
   *
   * @type {(relief.nav.Path|null)}
   * @private
   */
  this.page_ = defaultPath;

  /**
   * The previous page.  Gets set in handleNavigation_.
   *
   * @type {(relief.nav.Path|null)}
   * @private
   */
  this.referer_ = defaultPath;

  /**
   * Keep track of the page before referer in case we need to roll back
   * the navigation state on a cancelled dispose or transition.
   *
   * @type {(relief.nav.Path|null)}
   * @private
   */
  this.backtrackingReferer_ = defaultPath;

  /**
   * Set to true only when the user declines to leave the current page.
   * @type {boolean}
   * @private
   */
  this.backtracking_ = false;

  /**
   * @type {relief.nav.NavServiceProvider}
   * @private
   */
  this.sp_ = sp;

  var handler;
  /**
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = handler = new goog.events.EventHandler(this);

  var auth;
  /**
   * @type {relief.auth.AuthManager}
   * @private
   */
  this.auth_ = auth = sp.getAuthManager();
  handler.listen(auth, relief.auth.EventType.AUTH_CHANGE, this.onAuthEvent_);

  /**
   * @type {relief.auth.User}
   * @private
   */
  this.user_ = null;

  /**
   * @type {relief.nav.Handler}
   * @private
   */
  this.activeHandler_ = null;

  var h = new goog.History(false, '/scripts/blank.html',
                           sp.getHistoryInput(), sp.getHistoryIFrame());
  handler.listen(h, goog.history.EventType.NAVIGATE, this.route_);
  h.setEnabled(true);

  /**
   * @type {goog.History}
   * @private
   */
  this.history_ = h;
};
goog.inherits(relief.nav.NavManager, goog.events.EventTarget);


/**
 * Helper method to determine the handler, token, and path params of a
 * hash token.
 * @param {string} hash The event.token from a navigation event.
 * @return {relief.nav.Path} Object containing the token, params, and handler
 *    for the given url hash location.  If the given hash could not be mapped
 *    to a handler, the resulting Path object's path and params properties
 *    will be empty strings.
 * @private
 */
relief.nav.NavManager.prototype.disectPath_ = function(hash) {
  var path = hash, // token will be modified.  Keep full hash untouched.
      params = '',
      pathIndex = path.length - 1,
      urls = this.urlMap_;

  // Remember:  Null handlers are valid matches, so we must distinguish between
  // null (not yet implemented) and undefined (not found).
  var mapping = urls[hash];
  while (mapping === undefined && pathIndex > 0) {
    // Check if the whole of path is a path handled in urlMap
    mapping = urls[path];
    if (mapping === undefined) {
      // If no handler was found at the full path, start chopping off pieces
      // at each '/'.
      pathIndex = path.lastIndexOf('/');
      if (pathIndex > -1) {
        // Anything that's not part of the path is a parameter to be passed
        // to the handler.
        params = params === '' ?
            path.substring(pathIndex + 1) :
            [path.substring(pathIndex + 1), params].join('/');
        path = path.substring(0, pathIndex);
      }
    }
  }

  return this.buildPath_(hash, path, params, mapping);
};


/**
 * Build a relief.nav.Path object based on the given params.
 *
 * @param {string} hash The URL hash.
 * @param {string} path The path matched for this hash.
 * @param {string} params The rest of the hash after the path.
 * @param {(function(new: relief.nav.Handler,
 *     !relief.nav.NavServiceProvider)|relief.nav.PageConfig|null)=} opt_mapping
 *     Either the handler function or the PathConfig object.
 * @return {relief.nav.Path} The path object describing this navigation.
 * @private
 */
relief.nav.NavManager.prototype.buildPath_ =
    function(hash, path, params, opt_mapping) {

  // mapping is one of four things:
  // - undefined: No match for this url hash
  // - null: This is a valid path but the handler has not yet been implemented
  // - function: A relief.nav.Handler constructor
  // - object: A relief.nav.PathConfig object

  var mapping = opt_mapping,
      pathDescriptor = {
        hash: hash,
        path: mapping === undefined ? '' : path,
        params: mapping === undefined ? '' : params,
        handler: undefined,
        pageConfig: undefined
      };

  if (mapping === null) {
    pathDescriptor.handler = null;
  }
  else if (goog.isFunction(mapping)) {
    // mapping is a relief.nav.Handler constructor
    pathDescriptor.handler =
        /** @type {function(new: relief.nav.Handler,
                            !relief.nav.NavServiceProvider)} */ (mapping);
  }
  else if (mapping !== undefined) {
    // mapping is a relief.nav.PageConfig object.
    var pageConfig = /** @type {relief.nav.PageConfig} */ (mapping);
    pathDescriptor.handler = pageConfig.handler;
    pathDescriptor.pageConfig = pageConfig;
  }

  return pathDescriptor;
};


/**
 * Determines the appropriate handler based on the path, either creates a new
 * one or gets an existing one, figures out dependencies and params, then
 * activates.
 *
 * @private
 * @param {goog.history.Event} event The navigation event.
 */
relief.nav.NavManager.prototype.route_ = function(event) {
  // If the user cancels a navigation, we need to roll back the URL but not
  // handle the navigation event (because they're already looking at whatever
  // it is they want to be looking at).
  if (this.backtracking_) {
    this.page_ = this.referer_;
    this.referer_ = this.backtrackingReferer_;
    this.backtrackingReferer_ = null;

    this.backtracking_ = false;
    return;
  }

  var token = event.token,
      path = this.disectPath_(token);

  this.backtrackingReferer_ = this.referer_;
  this.referer_ = this.page_;
  this.page_ = path;

  if (path.handler === undefined) {
    // An undefined handler means that this token was not declared in the
    // URL map, so should show a 404 (Not Found) error.

    var notFound = this.urlMap_[':404'];
    path = this.buildPath_(path.hash, path.path, path.params, notFound);
    if (path.handler === undefined) {
      throw Error('No 404 handler defined to cover unmatched URL hashes.');
    }
  }
  else if (path.handler === null) {
    // A token mapped to a null handler indicates that the developer intends
    // to implement this path's handler, but has not yet done so.  Show a
    // 501 (Not Implemented) error.
    var nyi = this.urlMap_[':501'];
    path = this.buildPath_(path.hash, path.path, path.params, nyi);
    if (path.handler === undefined) {
      throw Error('No 501 handler defined to cover NYI hashes.');
    }
  }

  if (! this.user_) {
    // If we don't know the user's auth details, get them from the auth manager.
    var authCallback = goog.bind(this.verifyAuth_, this, path);
    this.auth_.getCurrentUser(authCallback);
  }
  else {
    // If we do, just pass them to verifyAuth directly.
    this.verifyAuth_(path, this.user_);
  }
};


/**
 * The nav manager listens to the auth manager for auth/auth events.  When
 * an event occurs, the nav manager fetches a new User object and needs to
 * verify that the user is still allowed to view whatever he was already
 * viewing.  This is done by calling verifyAuth_ with the current path and the
 * new User object.
 *
 * @param {relief.auth.AuthChangeEvent} event The auth change event.
 * @private
 */
relief.nav.NavManager.prototype.onAuthEvent_ = function(event) {
  // Since the NavManager also listens to auth change events, the following
  // frequently happens:
  //
  // 1) NavManager requests user.
  // 2) AuthManager gets user from server.
  // 3) AuthManager calls NavManager's callback (verifyAuth_).
  // 4) NavManager executes verifyAuth_ and navigates accordingly.
  // 5) AuthManager throws event.
  // 6) NavManager handles event.
  //
  // We need to make sure we don't double-navigate when this happens.

  var currentUser = this.user_,
      newUser = event.user;
  if ((! currentUser) || (!currentUser.equals(newUser))) {
    var page = this.page_;
    if (goog.isNull(page)) {
      // this.page_ will only ever be null after disposal.
      throw Error('Using a disposed NavManager instance.');
    }

    // If there is no current user, or if the new user is not equivalent to the
    // second, re-verify.
    this.verifyAuth_(page, newUser);
  }
};


/**
 * Once this.route_ gets the handler for the path, execution flows to
 * verifyAuth to ensure the user has the proper authorizations to execute
 * the attached handler.  Handlers assume that the user is allowed to see them.
 *
 * @param {relief.nav.Path} path The path object for this navigation.
 * @param {relief.auth.User} user The current User object.
 * @private
 */
relief.nav.NavManager.prototype.verifyAuth_ = function(path, user) {
  this.user_ = user;

  var handler = /** @type {function(new: relief.nav.Handler,
                           !relief.nav.NavServiceProvider)} */ (path.handler);

  var authorized = true;
  if (! user.checkAuthorized(handler)) {
    authorized = false;
    path = this.buildPath_(path.hash, path.path, path.params,
                           this.urlMap_[':401']);
    handler = path.handler;
    if (path.handler === undefined) {
      throw Error('No 401 handler defined to cover unauthorized navigations.');
    }
  }

  if (this.activeHandler_) {
    if (this.activeHandler_ instanceof handler) {
      this.activateHandler_(path, true);
    }
    else {
      // If the user is not authorized to view the given handler, set
      // forcedExit to true.
      this.activeHandler_.exit(goog.bind(this.onExit_, this, path, !authorized),
                               !authorized);
      if (!authorized) {
        goog.dispose(this.activeHandler_);
      }
    }
  }
  else {
    this.activateHandler_(path, false);
  }
};


/**
 * Callback to handler.dispose
 * @param {relief.nav.Path} path The path object for this navigation flow.
 * @param {boolean} force True if the navigation cannot be cancelled.
 * @param {boolean} exitComplete True if the handler relinquished control.
 *    False otherwise.
 * @private
 */
relief.nav.NavManager.prototype.onExit_ = function(path, force, exitComplete) {
  if (exitComplete || force) {
    goog.dispose(this.activeHandler_);

    this.activeHandler_ = null;
    this.activateHandler_(path, false);
  }
  else {
    this.rollback_();
  }
};


/**
 * If the handler for the new path is the same as the handler for the last path,
 * tell the handler to transition to the new path.  If not, create a new
 * instance of the handler for the new path and tell it to handle this path.
 *
 * @param {relief.nav.Path} path The path object describing the current
 *    request.
 * @param {boolean} isTransition Whether to call handler.transition or
 *    handler.handle.
 * @private
 */
relief.nav.NavManager.prototype.activateHandler_ =
    function(path, isTransition) {

  if (! isTransition) {
    var sp = this.sp_;
    if (goog.isNull(sp)) {
      // this.sp_ will only ever be null after disposal.
      throw Error('Using a disposed NavManager instance.');
    }

    var handler = this.activeHandler_ = new path.handler(sp);
    handler.handle(path);
    this.onNavigation_(path, true);
  }
  else {
    this.activeHandler_.transition(path,
                                   goog.bind(this.onNavigation_, this, path));
  }
};


/**
 * Callback passed to the transition method of handler objects.  We have to
 * know when every handle is complete so we can dispatch navigation events on
 * successful transitions and not dispatch them on cancelled ones.
 *
 * @param {relief.nav.Path} path The path object for this navigation.
 * @param {boolean} complete The handler will pass "true" if the
 *    the transition went through or "false" if the user cancelled the
 *    navigation.
 * @private
 */
relief.nav.NavManager.prototype.onNavigation_ = function(path, complete) {
  if (complete) {
    this.dispatchEvent(new relief.nav.NavEvent(path, this));
  }
  else {
    this.rollback_();
  }
};


/**
 * If the user decides during either the dispose or transition calls not to
 * leave their current page, this method will be called to roll back the
 * navigation state.
 * @private
 */
relief.nav.NavManager.prototype.rollback_ = function() {
  this.backtracking_ = true;

  // Using this.history_.replaceHash results in two identical tokens in the
  // history stack.  This method leaves the unintended page as the only token
  // in the history.forward stack, but it otherwise behaves as expected.
  goog.global.history.back();
};


/**
 * @return {relief.nav.Path} A copy of the current page's Path object.
 */
relief.nav.NavManager.prototype.getCurrentPage = function() {
  var page = this.page_;
  return this.buildPath_(page.hash, page.path, page.params,
                         page.pageConfig || page.handler);
};


/**
 * @return {relief.nav.Path} A copy of the previous page's Path object.
 */
relief.nav.NavManager.prototype.getReferer = function() {
  var referer = this.referer_;
  return this.buildPath_(referer.hash, referer.path, referer.params,
                         referer.pageConfig || referer.handler);
};


/**
 * @override
 */
relief.nav.NavManager.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  this.history_.dispose();
  this.eventHandler_.dispose();

  this.sp_ = this.urlMap_ = this.eventHandler_ = this.history_ =
      this.auth_ = this.user_ = this.activeHandler_ =
      this.page_ = this.referer_ = this.backtrackingReferer_ = null;
};
