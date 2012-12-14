goog.provide('__bootstrap');
goog.provide('closure_boilerplate.Application');
goog.provide('closure_boilerplate.start');

goog.require('closure_boilerplate.templates');

goog.require('goog.dom');
goog.require('goog.net.XhrIo');
goog.require('soy');



/**
 * Main class for the application
 *
 * @constructor
 */
closure_boilerplate.Application = function() {

  this.xhr_ = new goog.net.XhrIo();

  goog.events.listen(this.xhr_, goog.net.EventType.COMPLETE,
      this.onAjaxComplete_, null, this);

  this.xhr_.send('/_/hello');
};


/**
 * Callback for AJAX
 *
 * @param {goog.events.Event} e The event object.
 * @private
 */
closure_boilerplate.Application.prototype.onAjaxComplete_ = function(e) {
  var xhr = e.target;

  var resp = xhr.getResponseJson();

  var msg = resp['result'];

  document.body.appendChild(soy.renderAsFragment(
      closure_boilerplate.templates.greeting, { message: msg }));
};


/**
 * Entry point for the application
 */
closure_boilerplate.start = function() {
  new closure_boilerplate.Application();
};

// Export the __bootstrap symbol so we have a way of starting the application.
goog.exportSymbol('__bootstrap', closure_boilerplate.start);
