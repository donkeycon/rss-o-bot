'use strict';

var _require = require('ava');

var test = _require.test;


var runCLI = require('../../dist/cli.js');
var H = require('../../dist/lib/helpers');
var initStore = require('../../dist/lib/store')(H);
var Config = require('../../dist/lib/config')(H);
var T = require('./lib/helpers')({ runCLI: runCLI, initStore: initStore, Config: Config });

var Poll = require('../../dist/lib/pollFeeds/lib/poll.js')(H);

var isValidEntry = function isValidEntry(t) {
  return function (e) {
    t.true(typeof e.blogTitle === 'string');
    t.true(typeof e.title === 'string');
    /* Link should be a valid URL, this doesn't excactly check for
     * that, but it's close enough IMO.
     */
    t.truthy(e.link.match(/https?:\/\/.*/));
  };
};

var allEntriesValid = function allEntriesValid(t) {
  return function (entries) {
    return entries.forEach(isValidEntry(t));
  };
};

test.cb('poll rss', function (t) {
  return T.testObservable(Poll('https://lucaschmid.net/feed/rss.xml', []).tap(allEntriesValid(t)))(t);
});

test.cb('poll atom', function (t) {
  return T.testObservable(Poll('https://lucaschmid.net/feed/atom.xml', []).tap(allEntriesValid(t)))(t);
});

test.cb('poll positive atom filter', function (t) {
  return T.testObservable(Poll('https://lucaschmid.net/feed/atom.xml', [['definetly not inside the feeds']]).tap(function (entries) {
    return t.is(entries.length, 0);
  }))(t);
});

test.cb('poll negative rss filter', function (t) {
  return T.testObservable(
  /* Testing inverted filters */
  Poll('https://lucaschmid.net/feed/rss.xml', [['a', true], ['e', true]]).tap(function (entries) {
    return t.is(entries.length, 0);
  }))(t);
});

test.cb('poll positive rss filter', function (t) {
  return T.testObservable(
  /* Testing inverted filters */
  Poll('https://lucaschmid.net/feed/rss.xml', [['a'], ['e']]).tap(function (entries) {
    return t.true(entries.length > -1);
  }))(t);
});

test.cb('poll case-sensitive positive rss filter', function (t) {
  return T.testObservable(
  /* Testing inverted filters */
  Poll('https://lucaschmid.net/feed/rss.xml', []).flatMap(function (entries) {
    return(
      /* I'm assuming, that all entries have some upper-case letters in them */
      Poll('https://lucaschmid.net/feed/rss.xml', [entries[0].title])
    );
  }).tap(function (entries) {
    return t.true(entries.length === 1);
  }))(t);
});