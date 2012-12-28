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
 * GetCommand is a simple command object which sends a request to the server
 * and simply returns either the getResponseJson(), getResponseText(), or
 * getResponseXml() result to the client, depending on its constructor
 * parameter.
 */

goog.provide('relief.commands.GetCommand');
goog.provide('relief.commands.GetCommand.ResponseType');

goog.require('goog.dom.xml');
goog.require('goog.json');

goog.require('relief.cache.Cloneable');
goog.require('relief.rpc.Command');



/**
 * Stock command used to simply fetch a response from the server.  The command
 * object does no processing on the result.  Depending on the first constructor
 * argument, the response given to the client will be the return value of
 * getResponseJson, getResponseText, or getResponseXML.
 *
 * @param {function(*)} onSuccess Function to call on
 *    a successful request.
 * @param {function(goog.events.Event)} onFailure The function to call
 *    on a failed request.  The event's "target" property is set to the XhrIo
 *    instance used for the request.
 * @param {string} url The URL to fetch.
 * @param {relief.commands.GetCommand.ResponseType} type The response type
 *    to return to the client.
 * @param {boolean} cache Whether or not to cache the response.
 *
 * @constructor
 * @extends {relief.rpc.Command}
 */
relief.commands.GetCommand = function(onSuccess, onFailure, url, type, cache) {
  var cmdID = 'GET:' + url + ':' + goog.now();
  goog.base(this, onSuccess, onFailure, cmdID, url, 'GET', 0);

  if (cache) {
    /** @type {boolean} */
    this.readFromCache = true;

    /** @type {boolean} */
    this.writeToCache = true;
  }

  /**
   * @type {relief.commands.GetCommand.ResponseType}
   * @private
   */
  this.type_ = type;
};
goog.inherits(relief.commands.GetCommand, relief.rpc.Command);


/**
 * The response types supported by the XhrIo, and by extension, the GetCommand.
 *
 * @enum {string}
 */
relief.commands.GetCommand.ResponseType = {
  TEXT: 'text',
  JSON: 'json',
  XML: 'xml'
};


/**
 * @override
 */
relief.commands.GetCommand.prototype.onSuccess = function(e) {
  var response,
      xhr = e.target,
      text = xhr.getResponseText(),
      type = this.type_;

  if (type === relief.commands.GetCommand.ResponseType.TEXT) {
    response = text;
  }
  else if (type === relief.commands.GetCommand.ResponseType.JSON) {
    response = xhr.getResponseJson();
  }
  else if (type === relief.commands.GetCommand.ResponseType.XML) {
    response = xhr.getResponseXml();
  }

  if (this.writeToCache) {
    /**
     * When we're building the object to pass to the cache, text responses
     * will be cloned by simply returning the string, JSON objects will be
     * cloned by parsing the JSON string, and XML documents will be cloned by
     * parsing the XML string.
     *
     * @type {string}
     * @private
     */
    this.text_ = text;
  }

  this.callersOnSuccess(response);
};


/**
 * @override
 */
relief.commands.GetCommand.prototype.onFailure = function(e) {
  this.callersOnFailure(e);
};


/**
 * @override
 */
relief.commands.GetCommand.prototype.onCacheHit = function(values) {
  this.callersOnSuccess(values[0].value.getResponse());
};


/**
 * @override
 */
relief.commands.GetCommand.prototype.getCacheKeys = function() {
  return ['GET:' + this.type_ + ':' + this.url];
};


/**
 * @override
 */
relief.commands.GetCommand.prototype.getCacheValues = function() {
  var key = this.getCacheKeys()[0],
      text = this.text_,
      type = this.type_;

  return [{
    key: key,
    value: new relief.commands.GetCommand.CacheValue_(text, type)
  }];
};



/**
 * A cacheable object that encapsulates a GetCommand's response.
 *
 * @param {string} text The text returned by the XHR request.
 * @param {relief.commands.GetCommand.ResponseType} type The response type.
 *
 * @constructor
 * @implements {relief.cache.Cloneable}
 * @private
 */
relief.commands.GetCommand.CacheValue_ = function(text, type) {
  /**
   * @type {string}
   */
  this.text = text;

  /**
   * @type {relief.commands.GetCommand.ResponseType}
   */
  this.type = type;
};


/**
 * @return {!relief.commands.GetCommand.CacheValue_} A clone of this object.
 */
relief.commands.GetCommand.CacheValue_.prototype.clone = function() {
  return new relief.commands.GetCommand.CacheValue_(this.text, this.type);
};


/**
 * Re-hydrates the response into the appropriate type of object.
 *
 * @return {Object|string|Document} A copy of the response returned by the
 *    server for the original request.
 */
relief.commands.GetCommand.CacheValue_.prototype.getResponse = function() {
  switch (this.type) {
    case relief.commands.GetCommand.ResponseType.TEXT:
      return this.text;
      break;
    case relief.commands.GetCommand.ResponseType.JSON:
      return goog.json.unsafeParse(this.text);
      break;
    case relief.commands.GetCommand.ResponseType.XML:
      return goog.dom.xml.loadXml(this.text);
      break;
  }
  return null;
};
