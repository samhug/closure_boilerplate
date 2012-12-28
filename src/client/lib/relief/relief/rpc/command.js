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
 * Command is an abstract class that defines the underlying functionality of a
 * command object.  It deals with all of the required data used to execute
 * the command while letting subclasses deal with the interesting parts.
 *
 * Command objects should be simple in order to prevent memory leaks.  Their
 * lifecycle is fairly complicated as they are passed around between their
 * client and the RPC service.  When they fall out of scope, they should be
 * able to be garbage collected without any need for explicit disposal.
 * As such, they should not include references to disposable items and care
 * should be taken to avoid circular references.
 */

goog.provide('relief.rpc.Command');

goog.require('goog.Disposable');



/**
 * The abstract base class for all RPC Command objects.  Commands extend
 * goog.Disposable because the retention of the client's onSuccess and
 * onFailure callbacks may create a memory leak.  The RPC service will dispose
 * the command object after its `onSuccess`, `onCacheHit`, or `onFailure` method
 * returns.
 *
 * @param {Function} onSuccess Called on a successful response.
 * @param {Function} onFailure Called if the request fails.
 * @param {string} commandID The ID for this command.
 * @param {string} url The URL to request.
 * @param {string=} opt_method GET or POST (defaults to GET).
 * @param {number=} opt_maxRetries The number of retries.
 * @constructor
 * @extends {goog.Disposable}
 */
relief.rpc.Command = function(onSuccess, onFailure, commandID,
                              url, opt_method, opt_maxRetries) {
  /**
   * HTTP method verb.  Default to Get.
   * @type {string}
   */
  this.method = opt_method || 'GET';

  /**
   * The callback to the originating code for a successful request.
   * @type {?Function}
   * @protected
   */
  this.callersOnSuccess = onSuccess;

  /**
   * The callback to the originating code for a failed request.  The event is
   * simply passed back to the caller to pick out specific details needed to
   * diagnose the problem.
   * @type {?Function}
   * @protected
   */
  this.callersOnFailure = onFailure;

  /**
   * The identifier for this Command.  May or may not be unique, depending on
   * the subclass.
   * @type {string}
   * @protected
   */
  this.commandID = commandID;

  /**
   * The URL to request.
   * @type {string}
   */
  this.url = url;

  /**
   * The number of retries before admitting failure.
   * 'undefined' will cause XhrManager to use default.
   * @type {number|undefined}
   */
  this.maxRetries = opt_maxRetries;
};
goog.inherits(relief.rpc.Command, goog.Disposable);


/**
 * Get the CommandID for this command object.
 * @return {string} The commandID value for this command.
 */
relief.rpc.Command.prototype.getCommandID = function() {
  return this.commandID;
};

/*
 * The following flags are public so that they can be read by the RPC service.
 * Subclasses can shadow them as needed, but clients should not do so
 * themselves.  If it is a common case for the client to need to flip this flag
 * for a given subclass, then a setter should be included on that subclass.
 */


/**
 * Indicates whether the RPC service should check the cache prior to making the
 * request to the server.  If set to true, the service will try to match the
 * key(s) returned by getCacheKeys() to a previously stored value.  A cache hit
 * avoids the trip to the server.
 *
 * This flag may be set false while writeToCache is set to true.  This is
 * frequently the case when performing create, update, or query operations.
 *
 * @type {boolean}
 */
relief.rpc.Command.prototype.readFromCache = false;


/**
 * Indicates whether the RPC service should store a value (or values) in the
 * cache after processing the server's response.  If true, the RPC service
 * will, upon receiving a successful XHR response, call the command object's
 * getCacheValues() method to determine what to store in the cache.
 *
 * @type {boolean}
 */
relief.rpc.Command.prototype.writeToCache = false;


/**
 * This method is called by the RPCService when formulating the call to the
 * server.  getData serializes the data for use as an XHR POST payload.  If no
 * data is to be sent to the server, the method must return undefined.
 *
 * All subclasses that should have POST content must define a getData method.
 *
 * @return {string|undefined} The serialized data to be sent to the server or
 *    undefined if no data should be sent.
 */
relief.rpc.Command.prototype.getData = function() {
  return undefined;
};


/**
 * Abstract method to be overridden by Command subclasses that need access
 * to the XhrIo instance before the request is executed.
 *
 * The XhrIo is not available when RPCService#execute is called but clients
 * can request a reference prior to the request being made.  If a
 * Command object needs to tweak the XhrIo before the request is sent to
 * the server, it can implement this method.
 *
 * Any processing to be done on the XhrIo MUST be completed, synchronously,
 * before the function returns because the very next thing to happen is that
 * the XhrManager executes the request to the server.
 *
 * @param {goog.net.XhrIo} xhrIo The XhrIo instance prior to the request going
 *    to the server.
 *
*/
relief.rpc.Command.prototype.requestXhrIo = goog.nullFunction;


/**
 * This method is called by the RPCService on a successful response.
 * Each one will need to know how to process the specific XHR returned data into
 * the appropriate CommandResponse object.
 *
 * All subclasses must define an onSuccess method.
 *
 * @param {goog.events.Event} event The COMPLETE event for the XHR Req.
 */
relief.rpc.Command.prototype.onSuccess = goog.abstractMethod;


/**
 * This method is called by the RPCService on a failed response.
 *
 * For simpler implementations, onFailure can simply be a pointer to the
 * onSuccess method, but this is discouraged for more complex logic.
 *
 * All subclasses must define an onFailure method.
 *
 * @param {goog.events.Event} event The COMPLETE event for the XHR Req.
 */
relief.rpc.Command.prototype.onFailure = goog.abstractMethod;


/*
 * These methods are part of the RPC caching functionality and only need to be
 * overridden by Command subclasses that set shouldCache to true.
 *
 * See:
 * http://code.google.com/p/relief/wiki/RPCService#Understanding_Command_Objects
 */


/**
 * When command.readFromCache is true, the RPC service calls this method to
 * get the cache key(s) for which to query the cache.  If no
 * value was stored for the given keys, the server request is executed.
 *
 * Subclasses that set readFromCache to true must define a getCacheKeys method.
 *
 * @return {Array.<string>} The key the server should check in the cache to
 * determine if a server request is necessary.
 */
relief.rpc.Command.prototype.getCacheKeys = goog.abstractMethod;


/**
 * When a response comes back from the server for a cacheable request, the
 * RPC service will call onSuccess so that the command object can perform
 * whatever processing it needs (including execution of the client's callback).
 * Once onSuccess returns, the RPC service calls this method to obtain the
 * cache keys and values that should be stored.
 *
 * This method will only ever be called after the command's onSuccess method
 * was called.
 *
 * If, on a future request, the RPC service finds a value for the cache keys,
 * the values returned by this method will be what is passed to the command
 * object's onCacheHit method.
 *
 * This method must return an array of record objects with a "key" attribute
 * (this should be the same string as returned by getCacheKeys); and a "value"
 * attribute, which is the value to be stored in the cache.
 *
 * The RPC service always stores items in the cache by value, meaning that
 * the value attribute of this method's returned object must either implement
 * relief.cache.Cloneable (ie., it has a clone() method) or it must be cast
 * to a relief.cache.SimpleValue.  See documentation for rpc.cache.Cache
 * for details on using these interfaces.
 *
 * Subclasses that set writeToCache to true must define a getCacheValues method.
 *
 * @return {Array.<{key: string,
 *            value: (relief.cache.Cloneable|relief.cache.SimpleValue)}>}
 *                The keys and values to be stored in the cache.
 */
relief.rpc.Command.prototype.getCacheValues = goog.abstractMethod;


/**
 * When a command's getCacheKeys() method returns an array with more than one
 * key, the RPC service iterates over the keys and fills an array with
 * record objects with the same structure as those returned by getCacheValues.
 * If only some of the keys returned by getCacheKeys are found, this method is
 * called to allow the command object to tailor its request parameters (url and
 * content data) to only request the missing information.  After this method is
 * called, the RPC service will check the command object's url property and call
 * getData, then execute the server trip.
 *
 * If a command class' getCacheKeys() method will never return more than one
 * key, this method does not have to be defined.  If, however, getCacheKeys()
 * could potentially return more than one key, this method should be
 * implemented.
 *
 * If all of the keys returned by getCacheKeys() were found in the cache, this
 * method will not be called.  The RPC service will, instead, route directly to
 * onCacheHit.
 *
 * @param {Array.<{key: string,
 *            value: (relief.cache.Cloneable|relief.cache.SimpleValue)}>} vals
 *                The keys and values that were in the cache.
 */
relief.rpc.Command.prototype.onPartialCacheHit = goog.abstractMethod;


/**
 * When the RPC service gets a cache hit for a command, it calls onCacheHit
 * instead of onSuccess.  This allows getCacheValue to pre-process the response
 * and store the value back in the cache in such a way that future cache hits
 * can avoid any expensive re-processing.
 *
 * onCacheHit will receive a copy of whatever the previous getCacheValue
 * returned.  This method should be able to return a response to the command's
 * client from the cached value.
 *
 * @param {Array.<{key: string,
 *         value: (relief.cache.Cloneable|relief.cache.SimpleValue)}>}
 *            cacheVals The value that was previously stored in the cache.
 *
 * Subclasses that set readFromCache to true must define an onCacheHit method.
 */
relief.rpc.Command.prototype.onCacheHit = goog.abstractMethod;


/**
 * @override
 */
relief.rpc.Command.prototype.disposeInternal = function() {
  this.callersOnSuccess = this.callersOnFailure = null;
};
