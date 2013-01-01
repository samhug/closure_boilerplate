goog.provide('_gaq');


/**
 * @const
 * @type {string}
 */
var GOOGLE_ANALYTICS_ID = 'UA-37051344-1';


/**
 * Google Analytics Queue
 *
 * @expose
 */
var _gaq = _gaq || [];

_gaq.push(['_setAccount', GOOGLE_ANALYTICS_ID]);
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
