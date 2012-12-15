/**
 * This file has been adapted from prior work released with the following
 * license:
 *
 *     Original script by Josh Fraser (http://www.onlineaspect.com)
 *     Continued by Jon Nylander, (jon at pageloom dot com)
 *     According to both of us, you are absolutely free to do whatever
 *     you want with this code.
 *
 *     This code is  maintained at bitbucket.org as jsTimezoneDetect.
 *
 * Alterations to this file are Copyright Jay Young 2011 and are licensed under
 * the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License.  You may obtain a copy of the License
 * at:
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview
 *
 * Provides functionality to determine what timezone the user is in.
 *
 * Note about accuracy and precision:
 * https://bitbucket.org/pellepim/jstimezonedetect/issue/7/hit-stockholm-instead-of-istanbul#comment-345473
 * I think we should try to find timezones which are readily available to set
 * as a timezone on the operating system. That should be the focus, rather than
 * trying to solve edge cases. ... The aim of this script is to find a "good
 * enough" timezone. Either you can trust the script or you can choose to
 * actually ask the user ("We have auto-detected your timezone to Africa/Gaza,
 * click here to modify if you feel it is wrong").
 *
 * Note about testing:
 * Without a large set of geographically diverse clients, testing this code
 * would be very difficult.  According to one of thethe original authors, this
 * script has been used in production for a while now and has not, to his
 * knowledge been wrong yet[1].  However, this does not mean that it is
 * infallible.  Consider the consequences of possible errors in the context
 * of your application before using this functionality.
 *
 * [1]:
 * https://bitbucket.org/pellepim/jstimezonedetect/issue/8/pacific-fiji-dst-end-date-change#comment-390576
 */

goog.provide('relief.dates.tz');
goog.provide('relief.dates.tz.olson');


/**
 * @const
 * @type {string}
 */
relief.dates.tz.HEMISPHERE_SOUTH = 'SOUTH';


/**
 * @const
 * @type {string}
 */
relief.dates.tz.HEMISPHERE_NORTH = 'NORTH';


/**
 * @const
 * @type {string}
 */
relief.dates.tz.HEMISPHERE_UNKNOWN = 'N/A';



/**
 * A simple object containing information of utcOffset, which olson timezone
 * key to use, and if the timezone cares about daylight savings or not.
 *
 * @param {string} offset For example '-11:00'.
 * @param {string} olsonTZ The Olson identifier, such as "America/Denver".
 * @param {boolean} usesDST Flag for whether the time zone somehow cares about
 *    daylight savings.
 *
 * @constructor
 */
relief.dates.tz.TimeZone = function(offset, olsonTZ, usesDST) {
  /**
   * For example, '-11:00'
   * @type {string}
   */
  this.utcOffset = offset;

  /**
   * The Olson identifier, such as "America/Denver".
   * @type {string}
   */
  this.olsonTZ = olsonTZ;

  /**
   * Flag for whether the time zone somehow cares about daylight savings.
   * @type {boolean}
   */
  this.usesDST = usesDST;
};


/**
 * Prints out the result.  But before it does that, it calls
 * this.ambiguityCheck.
 *
 * @return {string} A simple HTML-formatted string displaying this TimeZone's
 *    details.
 */
relief.dates.tz.TimeZone.prototype.display = function() {
  this.ambiguityCheck();
  return [
    '<b>UTC Offset</b>: ', this.utcOffset, '<br/>',
    '<b>Zone Info key</b>: ', this.olsonTZ, '<br/>',
    '<b>Zone Uses DST</b>: ', this.usesDST ? 'yes' : 'no'
  ].join('');
};


/**
 * Checks if a timezone has possible ambiguities. I.e timezones that are
 * similar.
 *
 * If the preliminary scan determines that we're in America/Denver, we double
 * check here that we're really there and not in America/Mazatlan.
 *
 * This is done by checking known dates for when daylight savings start for
 * different timezones.
 */
relief.dates.tz.TimeZone.prototype.ambiguityCheck = function() {
  var localAmbiguityList = relief.dates.tz.olson.ambiguityList[this.olsonTZ];

  if (goog.isDef(localAmbiguityList)) {
    var length = localAmbiguityList.length;

    for (var i = 0; i < length; i++) {
      var tz = localAmbiguityList[i];

      if (relief.dates.tz.dateIsDst(relief.dates.tz.olson.dstStartDates[tz])) {
        this.olsonTZ = tz;
        return;
      }
    }
  }
};


/**
 * Checks whether a given date is in daylight savings time.  If the date
 * supplied is after June, we assume that we're checking for southern hemisphere
 * DST.
 *
 * @param {Date} date The date to check.
 * @return {boolean} Whether the date is in daylight savings time.
 */
relief.dates.tz.dateIsDst = function(date) {
  var baseOffset = (date.getMonth() > 5 ? relief.dates.tz.getJuneOffset() :
                                          relief.dates.tz.getJanuaryOffset()),
      dateOffset = relief.dates.tz.getDateOffset(date);

  return (baseOffset - dateOffset) !== 0;
};


/**
 * Gets the offset in minutes from UTC for a certain date.
 *
 * @param {Date} date The date for which we need the offset.
 * @return {number} The offset in minutes from UTC.
 */
relief.dates.tz.getDateOffset = function(date) {
  return -date.getTimezoneOffset();
};


/**
 * A record object containing various details about a timezone, including:
 *   - utcOffset: the offset, in minutes, from UTC
 *   - dst: whether the region observes daylight savings time
 *   - hemisphere: the hemisphere in which the region resides
 *
 * @typedef {{utcOffset: number, dst: boolean, hemisphere: string}}
 */
relief.dates.tz.TimezoneInfo;


/**
 * This function does some basic calculations to create information about the
 * user's timezone.
 *
 * @return {relief.dates.tz.TimezoneInfo} An object containing various details
 *    about a timezone.
 */
relief.dates.tz.getTimezoneInfo = function() {
  var januaryOffset = relief.dates.tz.getJanuaryOffset(),
      juneOffset = relief.dates.tz.getJuneOffset(),
      diff = januaryOffset - juneOffset;

  if (diff < 0) {
    return {
      utcOffset: januaryOffset,
      dst: true,
      hemisphere: relief.dates.tz.HEMISPHERE_NORTH
    };
  }
  else if (diff > 0) {
    return {
      utcOffset: juneOffset,
      dst: true,
      hemisphere: relief.dates.tz.HEMISPHERE_SOUTH
    };
  }

  return {
    utcOffset: januaryOffset,
    dst: false,
    hemisphere: relief.dates.tz.HEMISPHERE_UNKNOWN
  };
};


/**
 * @return {number} The offset from UTC in minutes in January.
 */
relief.dates.tz.getJanuaryOffset = function() {
  return relief.dates.tz.getDateOffset(new Date(2011, 0, 1, 0, 0, 0, 0));
};


/**
 * @return {number} The offset from UTC in minutes in June.
 */
relief.dates.tz.getJuneOffset = function() {
  return relief.dates.tz.getDateOffset(new Date(2011, 5, 1, 0, 0, 0, 0));
};


/**
 * Uses getTimezoneInfo() to formulate a key to use in the olson.timezones
 * dictionary.
 *
 * @return {{timezone: relief.dates.tz.TimeZone, key: string}} A key/value pair
 *    with the key being a key into the olson.timezones map and the value being
 *    the associated TimeZone object.
 */
relief.dates.tz.determineTimezone = function() {
  var timezoneKeyInfo = relief.dates.tz.getTimezoneInfo(),
      hemisphereSuffix = '';

  if (timezoneKeyInfo.hemisphere == relief.dates.tz.HEMISPHERE_SOUTH) {
    hemisphereSuffix = ',s';
  }

  var tzKey = timezoneKeyInfo.utcOffset + ',' +
              (timezoneKeyInfo.dst ? 1 : 0) +
              hemisphereSuffix;

  return {
    timezone: relief.dates.tz.olson.timezones[tzKey],
    key: tzKey
  };
};


/**
 * The keys in this dictionary are comma separated as such:
 *    - First the offset compared to UTC time in minutes
 *    - Then a flag which is 0 if the timezone does not take daylight savings
 *      into account and 1 if it does
 *    - Thirdly an optional 's' signifies that the timezone is in the southern
 *      hemisphere, only interesting for timezones with DST.
 *
 * The values of the dictionary are TimeZone objects.
 *
 * @type {Object.<string, relief.dates.tz.TimeZone>}
 */
relief.dates.tz.olson.timezones = {
  '-720,0': new relief.dates.tz.TimeZone('-12:00', 'Etc/GMT+12', false),
  '-660,0': new relief.dates.tz.TimeZone('-11:00', 'Pacific/Pago_Pago', false),
  '-600,1': new relief.dates.tz.TimeZone('-11:00', 'America/Adak', true),
  '-660,1,s': new relief.dates.tz.TimeZone('-11:00', 'Pacific/Apia', true),
  '-600,0': new relief.dates.tz.TimeZone('-10:00', 'Pacific/Honolulu', false),
  '-570,0': new relief.dates.tz.TimeZone('-10:30', 'Pacific/Marquesas', false),
  '-540,0': new relief.dates.tz.TimeZone('-09:00', 'Pacific/Gambier', false),
  '-540,1': new relief.dates.tz.TimeZone('-09:00', 'America/Anchorage', true),
  '-480,1': new relief.dates.tz.TimeZone('-08:00', 'America/Los_Angeles', true),
  '-480,0': new relief.dates.tz.TimeZone('-08:00', 'Pacific/Pitcairn', false),
  '-420,0': new relief.dates.tz.TimeZone('-07:00', 'America/Phoenix', false),
  '-420,1': new relief.dates.tz.TimeZone('-07:00', 'America/Denver', true),
  '-360,0': new relief.dates.tz.TimeZone('-06:00', 'America/Guatemala', false),
  '-360,1': new relief.dates.tz.TimeZone('-06:00', 'America/Chicago', true),
  '-360,1,s': new relief.dates.tz.TimeZone('-06:00', 'Pacific/Easter', true),
  '-300,0': new relief.dates.tz.TimeZone('-05:00', 'America/Bogota', false),
  '-300,1': new relief.dates.tz.TimeZone('-05:00', 'America/New_York', true),
  '-270,0': new relief.dates.tz.TimeZone('-04:30', 'America/Caracas', false),
  '-240,1': new relief.dates.tz.TimeZone('-04:00', 'America/Halifax', true),
  '-240,0':
      new relief.dates.tz.TimeZone('-04:00', 'America/Santo_Domingo', false),
  '-240,1,s': new relief.dates.tz.TimeZone('-04:00', 'America/Asuncion', true),
  '-210,1': new relief.dates.tz.TimeZone('-03:30', 'America/St_Johns', true),
  '-180,1': new relief.dates.tz.TimeZone('-03:00', 'America/Godthab', true),
  '-180,0':
      new relief.dates.tz.TimeZone('-03:00', 'America/Argentina/Buenos_Aires',
                                   false),
  '-180,1,s':
      new relief.dates.tz.TimeZone('-03:00', 'America/Montevideo', true),
  '-120,0': new relief.dates.tz.TimeZone('-02:00', 'America/Noronha', false),
  '-120,1': new relief.dates.tz.TimeZone('-02:00', 'Etc/GMT+2', true),
  '-60,1': new relief.dates.tz.TimeZone('-01:00', 'Atlantic/Azores', true),
  '-60,0': new relief.dates.tz.TimeZone('-01:00', 'Atlantic/Cape_Verde', false),
  '0,0': new relief.dates.tz.TimeZone('00:00', 'Etc/UTC', false),
  '0,1': new relief.dates.tz.TimeZone('00:00', 'Europe/London', true),
  '60,1': new relief.dates.tz.TimeZone('+01:00', 'Europe/Berlin', true),
  '60,0': new relief.dates.tz.TimeZone('+01:00', 'Africa/Lagos', false),
  '60,1,s': new relief.dates.tz.TimeZone('+01:00', 'Africa/Windhoek', true),
  '120,1': new relief.dates.tz.TimeZone('+02:00', 'Asia/Beirut', true),
  '120,0': new relief.dates.tz.TimeZone('+02:00', 'Africa/Johannesburg', false),
  '180,1': new relief.dates.tz.TimeZone('+03:00', 'Europe/Moscow', true),
  '180,0': new relief.dates.tz.TimeZone('+03:00', 'Asia/Baghdad', false),
  '210,1': new relief.dates.tz.TimeZone('+03:30', 'Asia/Tehran', true),
  '240,0': new relief.dates.tz.TimeZone('+04:00', 'Asia/Dubai', false),
  '240,1': new relief.dates.tz.TimeZone('+04:00', 'Asia/Yerevan', true),
  '270,0': new relief.dates.tz.TimeZone('+04:30', 'Asia/Kabul', false),
  '300,1': new relief.dates.tz.TimeZone('+05:00', 'Asia/Yekaterinburg', true),
  '300,0': new relief.dates.tz.TimeZone('+05:00', 'Asia/Karachi', false),
  '330,0': new relief.dates.tz.TimeZone('+05:30', 'Asia/Kolkata', false),
  '345,0': new relief.dates.tz.TimeZone('+05:45', 'Asia/Kathmandu', false),
  '360,0': new relief.dates.tz.TimeZone('+06:00', 'Asia/Dhaka', false),
  '360,1': new relief.dates.tz.TimeZone('+06:00', 'Asia/Omsk', true),
  '390,0': new relief.dates.tz.TimeZone('+06:30', 'Asia/Rangoon', false),
  '420,1': new relief.dates.tz.TimeZone('+07:00', 'Asia/Krasnoyarsk', true),
  '420,0': new relief.dates.tz.TimeZone('+07:00', 'Asia/Jakarta', false),
  '480,0': new relief.dates.tz.TimeZone('+08:00', 'Asia/Shanghai', false),
  '480,1': new relief.dates.tz.TimeZone('+08:00', 'Asia/Irkutsk', true),
  '525,0': new relief.dates.tz.TimeZone('+08:45', 'Australia/Eucla', true),
  '525,1,s': new relief.dates.tz.TimeZone('+08:45', 'Australia/Eucla', true),
  '540,1': new relief.dates.tz.TimeZone('+09:00', 'Asia/Yakutsk', true),
  '540,0': new relief.dates.tz.TimeZone('+09:00', 'Asia/Tokyo', false),
  '570,0': new relief.dates.tz.TimeZone('+09:30', 'Australia/Darwin', false),
  '570,1,s': new relief.dates.tz.TimeZone('+09:30', 'Australia/Adelaide', true),
  '600,0': new relief.dates.tz.TimeZone('+10:00', 'Australia/Brisbane', false),
  '600,1': new relief.dates.tz.TimeZone('+10:00', 'Asia/Vladivostok', true),
  '600,1,s': new relief.dates.tz.TimeZone('+10:00', 'Australia/Sydney', true),
  '630,1,s':
      new relief.dates.tz.TimeZone('+10:30', 'Australia/Lord_Howe', true),
  '660,1': new relief.dates.tz.TimeZone('+11:00', 'Asia/Kamchatka', true),
  '660,0': new relief.dates.tz.TimeZone('+11:00', 'Pacific/Noumea', false),
  '690,0': new relief.dates.tz.TimeZone('+11:30', 'Pacific/Norfolk', false),
  '720,1,s': new relief.dates.tz.TimeZone('+12:00', 'Pacific/Auckland', true),
  '720,0': new relief.dates.tz.TimeZone('+12:00', 'Pacific/Tarawa', false),
  '765,1,s': new relief.dates.tz.TimeZone('+12:45', 'Pacific/Chatham', true),
  '780,0': new relief.dates.tz.TimeZone('+13:00', 'Pacific/Tongatapu', false),
  '840,0': new relief.dates.tz.TimeZone('+14:00', 'Pacific/Kiritimati', false)
};


/**
 * This object contains information on when daylight savings starts for
 * different timezones.
 *
 * The list is short for a reason. Often we do not have to be very specific
 * to single out the correct timezone. But when we do, this list comes in
 * handy.
 *
 * Each value is a date denoting when daylight savings starts for that timezone.
 *
 * @type {Object.<string, Date>}
 */
relief.dates.tz.olson.dstStartDates = {
  'America/Denver': new Date(2011, 2, 13, 3, 0, 0, 0),
  'America/Mazatlan': new Date(2011, 3, 3, 3, 0, 0, 0),
  'America/Chicago': new Date(2011, 2, 13, 3, 0, 0, 0),
  'America/Mexico_City': new Date(2011, 3, 3, 3, 0, 0, 0),
  'Atlantic/Stanley': new Date(2011, 8, 4, 7, 0, 0, 0),
  'America/Asuncion': new Date(2011, 9, 2, 3, 0, 0, 0),
  'America/Santiago': new Date(2011, 9, 9, 3, 0, 0, 0),
  'America/Campo_Grande': new Date(2011, 9, 16, 5, 0, 0, 0),
  'America/Montevideo': new Date(2011, 9, 2, 3, 0, 0, 0),
  'America/Sao_Paulo': new Date(2011, 9, 16, 5, 0, 0, 0),
  'America/Los_Angeles': new Date(2011, 2, 13, 8, 0, 0, 0),
  'America/Santa_Isabel': new Date(2011, 3, 5, 8, 0, 0, 0),
  'America/Havana': new Date(2011, 2, 13, 2, 0, 0, 0),
  'America/New_York': new Date(2011, 2, 13, 7, 0, 0, 0),
  'Asia/Gaza': new Date(2011, 2, 26, 23, 0, 0, 0),
  'Asia/Beirut': new Date(2011, 2, 27, 1, 0, 0, 0),
  'Europe/Minsk': new Date(2011, 2, 27, 2, 0, 0, 0),
  'Europe/Helsinki': new Date(2011, 2, 27, 4, 0, 0, 0),
  'Europe/Istanbul': new Date(2011, 2, 28, 5, 0, 0, 0),
  'Asia/Damascus': new Date(2011, 3, 1, 2, 0, 0, 0),
  'Asia/Jerusalem': new Date(2011, 3, 1, 6, 0, 0, 0),
  'Africa/Cairo': new Date(2010, 3, 30, 4, 0, 0, 0),
  'Asia/Yerevan': new Date(2011, 2, 27, 4, 0, 0, 0),
  'Asia/Baku': new Date(2011, 2, 27, 8, 0, 0, 0),
  'Pacific/Auckland': new Date(2011, 8, 26, 7, 0, 0, 0),
  'Pacific/Fiji': new Date(2010, 11, 29, 23, 0, 0, 0),
  'America/Halifax': new Date(2011, 2, 13, 6, 0, 0, 0),
  'America/Goose_Bay': new Date(2011, 2, 13, 2, 1, 0, 0),
  'America/Miquelon': new Date(2011, 2, 13, 5, 0, 0, 0),
  'America/Godthab': new Date(2011, 2, 27, 1, 0, 0, 0)
};


/**
 * The keys in this object are timezones that we know may be ambiguous after
 * a preliminary scan through the olson TZ object.
 *
 * The array of timezones to compare must be in the order that daylight savings
 * starts for the regions.
 *
 * @type {Object.<string, Array.<string>>}
 */
relief.dates.tz.olson.ambiguityList = {
  'America/Denver': ['America/Denver', 'America/Mazatlan'],
  'America/Chicago': ['America/Chicago', 'America/Mexico_City'],
  'America/Asuncion': ['Atlantic/Stanley', 'America/Asuncion',
                       'America/Santiago', 'America/Campo_Grande'],
  'America/Montevideo': ['America/Montevideo', 'America/Sao_Paulo'],
  'Asia/Beirut' : ['Asia/Gaza', 'Asia/Beirut', 'Europe/Minsk',
                   'Europe/Helsinki', 'Europe/Istanbul', 'Asia/Damascus',
                   'Asia/Jerusalem', 'Africa/Cairo'],
  'Asia/Yerevan': ['Asia/Yerevan', 'Asia/Baku'],
  'Pacific/Auckland': ['Pacific/Auckland', 'Pacific/Fiji'],
  'America/Los_Angeles': ['America/Los_Angeles', 'America/Santa_Isabel'],
  'America/New_York': ['America/Havana', 'America/New_York'],
  'America/Halifax': ['America/Goose_Bay', 'America/Halifax'],
  'America/Godthab': ['America/Miquelon', 'America/Godthab']
};
