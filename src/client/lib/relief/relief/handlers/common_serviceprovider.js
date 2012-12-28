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
 * All generic handlers provided by Relief require an instance of the
 * CommonServiceProvider class.  This class expects to be created with:
 * - an RPC Service (relief.rpc.RPCService)
 * - a Cache (relief.cache.Cache)
 * - a "content" element (Element) into which handlers should inject their
 *    content.
 */

goog.provide('relief.handlers.CommonServiceProvider');

goog.require('relief.nav.NavServiceProvider');



/**
 * The handlers provided by Relief all require an instance of
 * CommonServiceProvider (which extends NavServiceProvider).
 *
 * @param {!relief.nav.URLMap} urlMap The mapping from URL hash codes to Handler
 *    constructors.
 * @param {!relief.cache.Cache} cache The app's cache.
 * @param {!relief.rpc.RPCService} rpc The app's RPC Service.
 * @param {!relief.auth.AuthManager} auth The app's auth manager instance.
 * @param {!HTMLIFrameElement} iframe The iframe to be used by the goog.History
 *    object.
 * @param {!HTMLInputElement} input The hidden input field to be used by the
 *    goog.History object.
 * @param {!Element} content The root element into which handlers should inject
 *    content.
 *
 * @constructor
 * @extends {relief.nav.NavServiceProvider}
 */
relief.handlers.CommonServiceProvider = function(urlMap, cache, rpc, auth, 
                                                 iframe, input, content) {

  goog.base(this, urlMap, auth, iframe, input);

  /**
   * @type {relief.cache.Cache}
   * @private
   */
  this.cache_ = cache;

  /**
   * @type {relief.rpc.RPCService}
   * @private
   */
  this.rpc_ = rpc;

  /**
   * @type {Element}
   * @private
   */
  this.content_ = content;
};
goog.inherits(relief.handlers.CommonServiceProvider,
              relief.nav.NavServiceProvider);


/**
 * @return {!relief.cache.Cache} The app's cache instance.
 */
relief.handlers.CommonServiceProvider.prototype.getCache = function() {
  this.assertNotDisposed();
  return /** @type {!relief.cache.Cache} */ (this.cache_);
};


/**
 * @return {!relief.rpc.RPCService} The app's RPC service.
 */
relief.handlers.CommonServiceProvider.prototype.getRPCService = function() {
  this.assertNotDisposed();
  return /** @type {!relief.rpc.RPCService} */ (this.rpc_);
};


/**
 * @return {!Element} The root content element.
 */
relief.handlers.CommonServiceProvider.prototype.getContentRoot = function() {
  this.assertNotDisposed();
  return /** @type {!Element} */ (this.content_);
};


/**
 * @override
 */
relief.handlers.CommonServiceProvider.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.cache_ = this.rpc_ = this.content_ = null;
};
