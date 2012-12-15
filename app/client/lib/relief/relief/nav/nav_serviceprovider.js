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
 * The ServiceProvider implementation that relief.nav.NavManager requires be
 * passed to its constructor.
 */

goog.provide('relief.nav.NavServiceProvider');

goog.require('relief.ServiceProvider');
goog.require('relief.nav.URLMap');



/**
 * NavServiceProvider is the service provider required to be passed to the
 * relief.nav.NavManager constructor.  It requires a reference to an
 * AuthManager.  The NavManager requires an instance of NavServiceProvider in
 * order to ensure it can get its hands on an AuthManager.  The NavService-
 * Provider given to the NavManager constructor will be the same one passed to
 * Handler classes, so apps should subclass NavServiceProvider in order to
 * pass along the things their handlers will need.
 *
 * @param {!relief.nav.URLMap} urlMap The mapping from URL hash codes to Handler
 *    constructors.
 * @param {!relief.auth.AuthManager} auth The app's auth manager instance.
 * @param {!HTMLIFrameElement} iframe The iframe to be used by the goog.History
 *    object.
 * @param {!HTMLInputElement} input The hidden input field to be used by the
 *    goog.History object.
 *
 * @constructor
 * @extends {relief.ServiceProvider}
 */
relief.nav.NavServiceProvider = function(urlMap, auth, iframe, input) {
  goog.base(this);

  /**
   * @type {relief.nav.URLMap}
   * @private
   */
  this.urlMap_ = urlMap;

  /**
   * @type {relief.auth.AuthManager}
   * @private
   */
  this.auth_ = auth;

  /**
   * @type {HTMLIFrameElement}
   * @private
   */
  this.iframe_ = iframe;

  /**
   * @type {HTMLInputElement}
   * @private
   */
  this.input_ = input;
};
goog.inherits(relief.nav.NavServiceProvider, relief.ServiceProvider);


/**
 * @return {!relief.nav.URLMap} The mapping from URL hashes to Handler
 *    constructors.
 */
relief.nav.NavServiceProvider.prototype.getURLMap = function() {
  this.assertNotDisposed();
  return /** @type {!relief.nav.URLMap} */ (this.urlMap_);
};


/**
 * @return {!relief.auth.AuthManager} The app's auth manager.
 */
relief.nav.NavServiceProvider.prototype.getAuthManager = function() {
  this.assertNotDisposed();
  return /** @type {!relief.auth.AuthManager} */ (this.auth_);
};


/**
 * @return {!HTMLIFrameElement} The iframe for use by the nav manager.
 */
relief.nav.NavServiceProvider.prototype.getHistoryIFrame = function() {
  this.assertNotDisposed();
  return /** @type {!HTMLIFrameElement} */ (this.iframe_);
};


/**
 * @return {!HTMLInputElement} The hidden input element for use by the nav
 *    manager.
 */
relief.nav.NavServiceProvider.prototype.getHistoryInput = function() {
  this.assertNotDisposed();
  return /** @type {!HTMLInputElement} */ (this.input_);
};


/**
 * Sets the NavManager instance for the app.  This should be called by the
 * relief.nav.NavManager constructor.
 *
 * @param {!relief.nav.NavManager} nav The nav manager for the app.  Some
 *    handlers may need to query it for various pieces of information, such
 *    as the referer.
 */
relief.nav.NavServiceProvider.prototype.setNavManager = function(nav) {
  /**
   * @type {relief.nav.NavManager}
   * @private
   */
  this.navManager_ = nav;
};


/**
 * @return {!relief.nav.NavManager} The NavManager instance for this app.
 */
relief.nav.NavServiceProvider.prototype.getNavManager = function() {
  this.assertNotDisposed();
  return /** @type {!relief.nav.NavManager} */ (this.navManager_);
};


/**
 * @override
 */
relief.nav.NavServiceProvider.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  this.urlMap_ = this.auth_ = this.iframe_ = this.input_ = null;
};
