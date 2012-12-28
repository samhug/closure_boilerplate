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
 * The RPCService class provides a Command Pattern RPC system designed to use
 * customized command and response objects to encapsulate the request and
 * response data.
 */

goog.provide('relief.rpc.RPCService');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.json');
goog.require('goog.net.XhrManager');
goog.require('goog.structs.Map');

goog.require('relief.rpc.Command');



/**
 * The RPC Service.
 *
 * @param {!relief.cache.Cache} cache A cache to use for cached requests.
 *    Must not have been returned from a .useNamesapce() call.
 * @param {goog.structs.Map=} opt_headers A list of headers set for every
 *    request.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
relief.rpc.RPCService = function(cache, opt_headers) {
  var xhrMgr;
  /**
   * @type {goog.net.XhrManager}
   * @private
   */
  this.xhrMgr_ = xhrMgr = new goog.net.XhrManager(undefined, opt_headers);

  /**
   * @type {relief.cache.Cache}
   * @private
   */
  this.cache_ = cache.useNamespace(relief.rpc.RPCService.cacheNS_);

  /**
   * A hash of all currently outstanding requests.  Keys are commandIDs, values
   * are the command objects themselves.
   *
   * @type {Object.<string, relief.rpc.Command>}
   * @private
   */
  this.runningCommands_ = {};

  /**
   * Listener ID to un-register on disposal.
   * @type {number}
   * @private
   */
  this.xhrReadyListener_ = /** @type {number} */
      (goog.events.listen(xhrMgr, goog.net.EventType.READY,
                         this.handleXhrIoReady_, false, this));
};
goog.inherits(relief.rpc.RPCService, goog.Disposable);


/**
 * The namespace to use in the cache.
 *
 * @const
 * @private
 */
relief.rpc.RPCService.cacheNS_ = 'relief.rpc.RPCService';


/**
 * A simple method that creates a one-off request.  RPCService hooks the given
 * callback right into the request and provides no further processing on the
 * client's behalf.
 *
 * xhrMgr.send(id, url, opt_method, opt_content, opt_headers, opt_priority,
 * opt_callback, opt_maxRetries);
 *
 * @param {string} id The id of the request.
 * @param {string} url Uri to make the request to.
 * @param {string=} opt_method Send method, default GET.
 * @param {string=} opt_content Post data.
 * @param {Object|goog.structs.Map=} opt_headers Map of headers to add to the
 *    request.
 * @param {*=} opt_priority The priority of the request.
 * @param {Function=} opt_callback Callback function for when request is
 *    complete.  The only param is the event object from the COMPLETE event.
 * @param {number=} opt_maxRetries The maximum number of times the request
 *    should be retried.
 *
 * @return {goog.net.XhrManager.Request} The queued request object.
 */
relief.rpc.RPCService.prototype.send =
    function(id, url, opt_method, opt_content, opt_headers, opt_priority,
             opt_callback, opt_maxRetries) {

  return this.xhrMgr_.send(id, url, opt_method, opt_content, opt_headers,
                           opt_priority, opt_callback, opt_maxRetries);
};


/**
 * Asynchronously execute the request encapsulated in the given Command Object.
 * @param {relief.rpc.Command} command The Command Object to execute.
 */
relief.rpc.RPCService.prototype.execute = function(command) {
  if (command.readFromCache) {
    var cache = this.cache_,
        keys = command.getCacheKeys(),
        vals = [];

    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];

      // Have to do an explicit containsKey because get(key) might return a
      // value that was explicitly saved as "undefined" and there's no way to
      // tell the difference.
      if (cache.containsKey(key)) {
        vals.push({
          key: key,
          value: cache.get(key)
        });
      }
    }

    if (keys.length === vals.length && vals.length > 0) {
      // Maintain the asynchronous relationship between calls to execute and
      // execution of the various callbacks.
      setTimeout(goog.bind(this.handleCacheHit_, this, command, vals), 0);
      return;
    }
    else if (vals.length > 0) {
      // If we found some but not all, tell the command object what we found.
      command.onPartialCacheHit(vals);
    }
  }

  var commandID = command.getCommandID(),
      isPost = command.method === 'POST';
  this.runningCommands_[commandID] = command;

  // Make the call.
  this.xhrMgr_.send(
      commandID,
      command.url,
      command.method,
      command.getData(),
      undefined,
      undefined,
      goog.bind(this.handleResponse_, this, commandID),
      command.maxRetries
  );
};


/**
 * The callback executed when an XhrIo instance is ready.  This is our
 * opportunity to expose the XhrIo to the client before executing the request.
 *
 * @param {goog.net.XhrManager.Event} e The READY event.
 */
relief.rpc.RPCService.prototype.handleXhrIoReady_ = function(e) {
  var cmd = this.runningCommands_[e.id];

  if (cmd) {
    cmd.requestXhrIo(e.xhrIo);
  }
};


/**
 * The callback executed when a response comes in:
 *   - Determine which command this is a response for
 *   - Determine success or failure
 *   - Pass the event to the appropriate callback.  It is the command object's
 *     job to process the server's response.
 *
 * @param {string} commandID The ID of the command object.
 * @param {goog.events.Event} event the XHR Complete event.
 * @private
 */
relief.rpc.RPCService.prototype.handleResponse_ = function(commandID, event) {
  var xhr = event.target,
      command = this.runningCommands_[commandID];

  if (command) {
    if (xhr.isSuccess()) {
      command.onSuccess(event);

      if (command.writeToCache) {
        var cache = this.cache_,
            toCache = command.getCacheValues();
        for (var i = 0, len = toCache.length; i < len; ++i) {
          var cacheRecord = toCache[i];
          cache.setByValue(cacheRecord.key, cacheRecord.value);
        }
      }
    }
    else {
      command.onFailure(event);
    }

    goog.dispose(command);
    delete this.runningCommands_[commandID];
  }
};


/**
 * Calls the command object's onCacheHit method with the cached value.  Called
 * in a setTimeout to preserve asynchronous behavior.
 *
 * @param {relief.rpc.Command} cmd The command object.
 * @param {Array.<{key: string,
 *         value: (relief.cache.Cloneable|relief.cache.SimpleValue)}>} vals
 *            The cached values.
 * @private
 */
relief.rpc.RPCService.prototype.handleCacheHit_ = function(cmd, vals) {
  cmd.onCacheHit(vals);
  goog.dispose(cmd);
};


/**
 * @override
 */
relief.rpc.RPCService.prototype.disposeInternal = function() {
  var commands = this.runningCommands_;

  for (var cmd in commands) {
    if (commands.hasOwnProperty(cmd)) {
      var command = commands[cmd];
      goog.dispose(command);
      delete commands[cmd];
    }
  }

  goog.events.unlistenByKey(this.xhrReadyListener_);

  this.cache_ = null;

  this.xhrMgr_.dispose();
  this.xhrMgr_ = null;
};
