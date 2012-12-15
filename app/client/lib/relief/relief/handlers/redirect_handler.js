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
 * The RedirectHandler class immediately redirects the browser to a provided
 * URL, which can either be an actual browser navigation or a hash change.
 */

goog.provide('relief.handlers.RedirectHandler');

goog.require('relief.nav.Handler');
goog.require('relief.utils');



/**
 * RedirectHandler redirects the user to an arbitrary URL via location.href.
 * This URL must be provided via a RedirectHandler.PageConfig object in the URL
 * map.
 *
 * @param {relief.handlers.CommonServiceProvider} sp The ServiceProvider for
 *    the app.
 *
 * @constructor
 * @implements {relief.nav.Handler}
 */
relief.handlers.RedirectHandler = function(sp) {
  /**
   * @type {relief.nav.NavManager}
   * @private
   */
  this.navManager_ = sp.getNavManager();
};


/**
 * The RedirectHandler expects a Pageconfig object with a required "scope"
 * property and either a "fromReferer" or "url" property.
 *
 * The "scope" property must be one of the enumerated values in
 * RedirectHandler.Scope.  If the value is "PAGE", the redirect will happen at
 * the full page (meaning the redirect will use location.href); if the value is
 * "HASH", only the URL fragment will be changed (location.hash).
 *
 * If provided, the "fromReferer" property must be a function with the
 * following signature:
 *
 *    function(path: relief.nav.Path, referer: relief.nav.Path): string
 *
 * The path parameter is the Path object for the current navigation; and the
 * referer parameter is the Path object for the previous navigation.  Either
 * location.href or location.hash will be set to the resultin string, depending
 * on the PageConfig's "scope" property, as described above.  If "fromReferer"
 * is provided, "url" should not be.
 *
 * If "fromReferer" is not defined, the either location.href or location.hash
 * will be set to the "url" property, depending on the scope.
 *
 * @typedef {{
 *    handler: function(new: relief.handlers.RedirectHandler,
 *        relief.handlers.CommonServiceProvider),
 *    fromReferer: (function(relief.nav.Path, relief.nav.Path):string|
 *        undefined),
 *    scope: relief.handlers.RedirectHandler.Scope,
 *    url: (string|undefined)}}
 */
relief.handlers.RedirectHandler.PageConfig;


/**
 * Whether to redirect at the whole page level, or just to a new hash location.
 * @enum {number}
 */
relief.handlers.RedirectHandler.Scope = {
  /**
   * Redirect at the whole page level.  If chosen, redirect will be performed
   * via location.href.
   */
  PAGE: 1,

  /**
   * Redirect to a new URL fragment.  If chosen, redirect will be performed
   * via location.hash.
   */
  HASH: 2
};


/**
 * @override
 */
relief.handlers.RedirectHandler.prototype.handle = function(path) {
  var pageConfig = /** @type {relief.handlers.RedirectHandler.PageConfig} */
      (path.pageConfig);

  if (pageConfig) {
    var scope = pageConfig.scope,
        redirect,
        referer;

    if (pageConfig.fromReferer) {
      referer = this.navManager_.getReferer();
      redirect = pageConfig.fromReferer(path, referer);
    }
    else {
      redirect = /** @type {string} */ (pageConfig.url);
    }

    if (scope === relief.handlers.RedirectHandler.Scope.PAGE) {
      relief.utils.setLocationHref(redirect);
    }
    else {
      relief.utils.setLocationHash(redirect);
    }
  }
  else {
    throw Error('No PageConfig provided for path: ' + path.path);
  }
};


/**
 * @override
 */
relief.handlers.RedirectHandler.prototype.transition =
    function(path, onTransition) {

  this.handle(path);
  onTransition(true);
};


/**
 * @override
 */
relief.handlers.RedirectHandler.prototype.exit = function(onExit, opt_force) {
  onExit(true);
};


/**
 * @override
 */
relief.handlers.RedirectHandler.prototype.dispose = function() {
  this.navManager_ = null;
  /**
   * @type {boolean}
   * @private
   */
  this.disposed_ = true;
};


/**
 * @override
 */
relief.handlers.RedirectHandler.prototype.isDisposed = function() {
  return !!this.disposed_;
};
