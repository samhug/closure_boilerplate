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
 * Provides the relief.handlers.StaticHandler class.  This handler is designed
 * to display static content which is retrieved from the server and cached.
 */

goog.provide('relief.handlers.StaticHandler');

goog.require('goog.json');

goog.require('relief.commands.GetCommand');
goog.require('relief.commands.GetCommand.ResponseType');
goog.require('relief.handlers.templates');
goog.require('relief.nav.Handler');



/**
 * Handler class whose job is to send a request to the server for some static
 * content.  The URL used for the request is the hash path given to the handle
 * method, so the server's resource structure should mirror the client-side
 * resource structure.
 *
 * StaticHandler checks the given service provider instance for an optional
 * resource named "StaticHandlerConfig".  If present, this resource should be
 * a record object with the following optional properties:
 * - pathPrefix: a string to be prepended to path.hash when making requests.
 * - pathSuffix: a string to be appended to path.hash when making requests.
 * - cacheResponse: a boolean indicating whether or not to cache the response
 *
 * @param {relief.handlers.CommonServiceProvider} sp The ServiceProvider for
 *    the app.
 * @constructor
 * @implements {relief.nav.Handler}
 */
relief.handlers.StaticHandler = function(sp) {
  /**
   * @type {relief.handlers.CommonServiceProvider}
   * @private
   */
  this.sp_ = sp;

  /**
   * @type {relief.rpc.RPCService}
   * @private
   */
  this.rpc_ = sp.getRPCService();

  /**
   * @type {Element}
   * @private
   */
  this.content_ = sp.getContentRoot();

  /**
   * If the user navigates away from the page while a request is out to the
   * server, and then the request comes back, we have to know whether or not
   * to display the content (or error messsage).
   *
   * @type {boolean}
   * @private
   */
  this.active_ = false;
};


/**
 * If a PageConfig object is not provided, the StaticHandler uses path.hash
 * for the server URL to hit.  If one is provided, one of the following three
 * methods (prioritized from top to bottom) are used to determine the server
 * URL to hit:
 *
 * - If a config.url property is provided, that will be the URL requested and
 * displayed.
 *
 * - If a config.transform property is provided, it should be a function that
 * takes path.hash as its argument and returns the server URL to request.
 *
 * - Otherwise, the server URL is built using the following formula:
 *     serverURL = (config.prefix || '') +
 *        (config.path || path.path) + (config.params || path.params) +
 *        (config.suffix || '')
 *
 * If a boolean cache property is included and true, the response returned by
 * the server will be cached and re-used for future requests.
 *
 * @typedef {{cache: (boolean|undefined), url: (string|undefined),
 *            transform: (function(string):string|undefined),
 *            prefix: (string|undefined), suffix: (string|undefined),
 *            path: (string|undefined), params: (string|undefined)}}
 */
relief.handlers.StaticHandler.PageConfig;


/**
 * @override
 */
relief.handlers.StaticHandler.prototype.handle = function(path) {
  var content = this.content_,
      rpc = this.rpc_,
      config = path.pageConfig,
      cache = false,
      serverURL;

  if (! config) {
    serverURL = path.hash;
  }
  else {
    cache = config.cache;

    var transform = config.transform;
    if (goog.isFunction(transform)) {
      serverURL = transform(path.hash);
    }
    else {
      var left = config.path || path.path,
          right = config.params || path.params,
          center = left.length > 0 && right.length > 0 ? left + '/' + right :
              left + right;

      serverURL = (config.prefix || '') + center + (config.suffix || '');
    }
  }

  var cmd = new relief.commands.GetCommand(
      goog.bind(this.onSuccess_, this),
      goog.bind(this.onFailure_, this),
      serverURL,
      relief.commands.GetCommand.ResponseType.TEXT, cache);

  this.active_ = true;
  rpc.execute(cmd);
};


/**
 * @override
 */
relief.handlers.StaticHandler.prototype.transition =
    function(path, onTransition) {

  // TODO: Implement aborting requests in the RPC Service so we can cancel the
  // active request on transition.

  this.handle(path);
  onTransition(true);
};


/**
 * @override
 */
relief.handlers.StaticHandler.prototype.exit = function(onExit, opt_force) {
  this.active_ = false;
  this.content_.innerHTML = '';
  this.sp_ = this.rpc_ = null;
  onExit(true);
};


/**
 * Callback for successful server requests.
 * @param {string} domString The data returned by the server.
 * @private
 */
relief.handlers.StaticHandler.prototype.onSuccess_ = function(domString) {
  if (this.active_) {
    this.content_.innerHTML = domString;
  }
};


/**
 * Callback for a failed server request.
 * @param {goog.net.XhrManager.Event} event The XHR Complete event.
 * @private
 */
relief.handlers.StaticHandler.prototype.onFailure_ = function(event) {
  if (this.active_) {
    var xhr = event.target,
        templateData = {
          header: 'Error retrieving the document',
          details: xhr.getStatus() + ': ' + xhr.getStatusText()
        };

    this.content_.innerHTML =
        relief.handlers.templates.genericError(templateData);
  }
};


/**
 * @override
 */
relief.handlers.StaticHandler.prototype.dispose = function() {
  this.active_ = false;
  this.sp_ = this.rpc_ = this.content_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.disposed_ = true;
};


/**
 * @override
 */
relief.handlers.StaticHandler.prototype.isDisposed = function() {
  return !!this.disposed_;
};
