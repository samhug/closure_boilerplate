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


/**
 * Google Analytics Code
 */
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-37051344-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = true;
  ga.src = ('https:' == document.location.protocol ?
      'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';

  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
})();
goog.exportSymbol('_gaq', _gaq);


// Export the __bootstrap symbol so we have a way of starting the application.
goog.exportSymbol('__bootstrap', closure_boilerplate.start);
