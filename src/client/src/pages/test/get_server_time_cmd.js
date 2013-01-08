goog.provide('closure_boilerplate.pages.test.GetServerTimeCommand');

goog.require('goog.date.Date');

goog.require('relief.rpc.Command');



/**
 * A Command object that encapsulates a request to the server for the user's
 * auth/auth details.
 *
 * @param {function(goog.date.DateTime)} onResponse Called with a date object
 *    when the request returns. If the request fails, null is returned.
 *
 * @constructor
 * @extends {relief.rpc.Command}
 */
closure_boilerplate.pages.test.GetServerTimeCommand = function(onResponse) {
  goog.base(this, onResponse, onResponse, 'GetServerTimeCommand:' + goog.now(),
            '/_/time');
};
goog.inherits(closure_boilerplate.pages.test.GetServerTimeCommand,
    relief.rpc.Command);


/**
 * Expects a server response with the following structure, based on the details
 * provided by App Engine's UserService.
 *
 * @typedef {{result: String, error: Object}}
 * @private
 */
closure_boilerplate.pages.test.GetServerTimeCommand.Response_;


/**
 * Method to be called by the RPC service on a successful request.
 *
 * @param {goog.net.XhrManager.Event} event The COMPLETE event for the XHR Req.
 * @override
 */
closure_boilerplate.pages.test.GetServerTimeCommand.prototype.onSuccess =
    function(event) {
  var xhr = event.target,
      response = /** @type {closure_boilerplate.pages.test.GetServerTimeCommand.Response_} */
      (xhr.getResponseJson());

  var error = response['error'];

  var time = goog.date.DateTime.fromRfc822String(response['result']);

  this.callersOnSuccess(time);
};


/**
 * Method to be called by the RPC service on a failed request.  Simply returns
 * null to the client.
 *
 * @param {goog.net.XhrManager.Event} event The COMPLETE event for the XHR Req.
 * @override
 */
closure_boilerplate.pages.test.GetServerTimeCommand.prototype.onFailure =
    function(event) {
  this.callersOnSuccess(null);
};
