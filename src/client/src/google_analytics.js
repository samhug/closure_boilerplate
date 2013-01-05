goog.provide('closure_boilerplate.analytics.initialize');
goog.provide('closure_boilerplate.analytics.queue');

goog.require('closure_boilerplate.config');


/**
 * Google Analytics queue
 * @type {Array}
 */
closure_boilerplate.analytics.queue = [
  ['_setAccount', closure_boilerplate.config.GOOGLE_ANALYTICS_ID],
  ['_trackPageview']
];
goog.exportSymbol('_gaq', closure_boilerplate.analytics.queue);


/**
 * Initialize Google Analytics tracking.
 */
closure_boilerplate.analytics.initialize = function() {
  var ga = document.createElement('script');
  ga.async = true;
  ga.src = ('https:' == document.location.protocol ? '//ssl' : '//www') +
          '.google-analytics.com/ga.js';

  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
};
