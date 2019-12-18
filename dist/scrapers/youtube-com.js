!(function(t) {
  var n = {};
  function r(e) {
    if (n[e]) return n[e].exports;
    var o = (n[e] = { i: e, l: !1, exports: {} });
    return t[e].call(o.exports, o, o.exports, r), (o.l = !0), o.exports;
  }
  (r.m = t),
    (r.c = n),
    (r.d = function(t, n, e) {
      r.o(t, n) || Object.defineProperty(t, n, { enumerable: !0, get: e });
    }),
    (r.r = function(t) {
      'undefined' != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, { value: 'Module' }),
        Object.defineProperty(t, '__esModule', { value: !0 });
    }),
    (r.t = function(t, n) {
      if ((1 & n && (t = r(t)), 8 & n)) return t;
      if (4 & n && 'object' == typeof t && t && t.__esModule) return t;
      var e = Object.create(null);
      if ((r.r(e), Object.defineProperty(e, 'default', { enumerable: !0, value: t }), 2 & n && 'string' != typeof t))
        for (var o in t)
          r.d(
            e,
            o,
            function(n) {
              return t[n];
            }.bind(null, o)
          );
      return e;
    }),
    (r.n = function(t) {
      var n =
        t && t.__esModule
          ? function() {
              return t.default;
            }
          : function() {
              return t;
            };
      return r.d(n, 'a', n), n;
    }),
    (r.o = function(t, n) {
      return Object.prototype.hasOwnProperty.call(t, n);
    }),
    (r.p = ''),
    r((r.s = 153));
})({
  10: function(t, n) {
    var r = (t.exports = { version: '2.6.11' });
    'number' == typeof __e && (__e = r);
  },
  11: function(t, n, r) {
    t.exports = !r(14)(function() {
      return (
        7 !=
        Object.defineProperty({}, 'a', {
          get: function() {
            return 7;
          },
        }).a
      );
    });
  },
  14: function(t, n) {
    t.exports = function(t) {
      try {
        return !!t();
      } catch (t) {
        return !0;
      }
    };
  },
  15: function(t, n, r) {
    var e = r(7);
    t.exports = function(t) {
      if (!e(t)) throw TypeError(t + ' is not an object!');
      return t;
    };
  },
  153: function(t, n, r) {
    'use strict';
    r.r(n);
    r(46), r(77), r(36), r(37);
    var e = {
      save: { SUGGESTIONS_SUBREDDIT: 3, SUGGESTIONS_POSTER: 3, SUGGESTIONS_COMMENTER: 1, SUGGESTIONS_DOMAIN: 1, URL_SOURCE: 1 },
      skip: { SUGGESTIONS_SUBREDDIT: -2, SUGGESTIONS_POSTER: -2, SUGGESTIONS_COMMENTER: -1, SUGGESTIONS_DOMAIN: 1, URL_SOURCE: -1 },
      MAX_COMMENTERS: 3,
      highlightLinks: !0,
      closeAfterScrape: !0,
      getLinks: function(t) {
        console.log('get saved items');
        for (var n = document.querySelectorAll('a#video-title'), r = [], o = 0; o < n.length; o++) {
          var i = n[o];
          r.push(e.buildUrl(i.getAttribute('href')));
        }
        console.log('returning saved links: ' + r.join('\n')), t(r), r.length > 0 && e.closeAfterScrape && window.close();
      },
      getSources: function(t) {
        console.log('scraping own sources (' + t + ')');
        var n = [{ url: 'www.youtube.com', points: e[t].SUGGESTIONS_DOMAIN }],
          r = document.querySelector('yt-formatted-string#owner-name > a'),
          o = null;
        null != r && ((o = e.buildUrl(r.getAttribute('href'))), n.push({ url: o, points: e[t].SUGGESTIONS_POSTER }));
        for (var i = document.querySelectorAll('a#author-text'), u = 0; u < i.length; u++) {
          var c = e.buildUrl(i[u].getAttribute('href'));
          if (o != c && (n.push({ url: c, points: e[t].SUGGESTIONS_COMMENTER }), u >= e.MAX_COMMENTERS - 1)) break;
        }
        return console.log('returning own sources: ' + e.objJoin(n, '\n')), n;
      },
      objJoin: function(t, n) {
        var r = [];
        for (var e in t) t.hasOwnProperty(e) && r.push(JSON.stringify(t[e]));
        return r.join(n || '\n');
      },
      getUrlSources: function(t, n, r) {
        console.log('scraping sources (' + r + ') of url: ' + t);
        for (var o = [], i = document.querySelectorAll('a#video-title'), u = 0; u < i; u++) {
          var c = i[u].getAttribute('href');
          if (t === (c = c.includes('://') ? e.trimmedUrl(c) : location.host + '/' + e.trimmedUrl(c))) {
            o.push({ url: e.trimmedUrl(location.href), points: e[r].URL_SOURCE });
            break;
          }
        }
        console.log('returning sources (' + r + ') of url ' + t + ':\n' + e.objJoin(o, '\n')), n(o);
      },
      buildUrl: function(t) {
        return t.startsWith('/') && (t = t.substring(1)), t.endsWith('/') && (t = t.substring(0, t.length - 1)), 'www.youtube.com/' + t;
      },
    };
    chrome.runtime.onMessage.addListener(function(t, n, r) {
      (console.log('sos received message: ' + t.action), 'getSources' === t.action)
        ? r({ sources: e.getSources(t.saveOrSkip) })
        : 'getUrlSources' === t.action
        ? e.getUrlSources(t.url, r, t.saveOrSkip)
        : 'getLinks' === t.action
        ? e.getLinks(r)
        : (console.log('sos unknown message: ' + JSON.stringify(t)), r({}));
    }),
      chrome.runtime.sendMessage('pageLoaded');
  },
  16: function(t, n) {
    var r = {}.toString;
    t.exports = function(t) {
      return r.call(t).slice(8, -1);
    };
  },
  17: function(t, n) {
    t.exports = function(t) {
      if (null == t) throw TypeError("Can't call method on  " + t);
      return t;
    };
  },
  18: function(t, n) {
    var r = 0,
      e = Math.random();
    t.exports = function(t) {
      return 'Symbol('.concat(void 0 === t ? '' : t, ')_', (++r + e).toString(36));
    };
  },
  19: function(t, n, r) {
    var e = r(15),
      o = r(38),
      i = r(31),
      u = Object.defineProperty;
    n.f = r(11)
      ? Object.defineProperty
      : function(t, n, r) {
          if ((e(t), (n = i(n, !0)), e(r), o))
            try {
              return u(t, n, r);
            } catch (t) {}
          if ('get' in r || 'set' in r) throw TypeError('Accessors not supported!');
          return 'value' in r && (t[n] = r.value), t;
        };
  },
  20: function(t, n) {
    var r = {}.hasOwnProperty;
    t.exports = function(t, n) {
      return r.call(t, n);
    };
  },
  21: function(t, n, r) {
    var e = r(25),
      o = Math.min;
    t.exports = function(t) {
      return t > 0 ? o(e(t), 9007199254740991) : 0;
    };
  },
  22: function(t, n, r) {
    var e = r(10),
      o = r(3),
      i = o['__core-js_shared__'] || (o['__core-js_shared__'] = {});
    (t.exports = function(t, n) {
      return i[t] || (i[t] = void 0 !== n ? n : {});
    })('versions', []).push({ version: e.version, mode: r(28) ? 'pure' : 'global', copyright: '© 2019 Denis Pushkarev (zloirock.ru)' });
  },
  23: function(t, n, r) {
    var e = r(3),
      o = r(9),
      i = r(20),
      u = r(18)('src'),
      c = r(42),
      s = ('' + c).split('toString');
    (r(10).inspectSource = function(t) {
      return c.call(t);
    }),
      (t.exports = function(t, n, r, c) {
        var f = 'function' == typeof r;
        f && (i(r, 'name') || o(r, 'name', n)),
          t[n] !== r && (f && (i(r, u) || o(r, u, t[n] ? '' + t[n] : s.join(String(n)))), t === e ? (t[n] = r) : c ? (t[n] ? (t[n] = r) : o(t, n, r)) : (delete t[n], o(t, n, r)));
      })(Function.prototype, 'toString', function() {
        return ('function' == typeof this && this[u]) || c.call(this);
      });
  },
  24: function(t, n, r) {
    var e = r(43),
      o = r(17);
    t.exports = function(t) {
      return e(o(t));
    };
  },
  25: function(t, n) {
    var r = Math.ceil,
      e = Math.floor;
    t.exports = function(t) {
      return isNaN((t = +t)) ? 0 : (t > 0 ? e : r)(t);
    };
  },
  26: function(t, n, r) {
    var e = r(47),
      o = r(17);
    t.exports = function(t, n, r) {
      if (e(n)) throw TypeError('String#' + r + " doesn't accept regex!");
      return String(o(t));
    };
  },
  27: function(t, n, r) {
    var e = r(4)('match');
    t.exports = function(t) {
      var n = /./;
      try {
        '/./'[t](n);
      } catch (r) {
        try {
          return (n[e] = !1), !'/./'[t](n);
        } catch (t) {}
      }
      return !0;
    };
  },
  28: function(t, n) {
    t.exports = !1;
  },
  3: function(t, n) {
    var r = (t.exports = 'undefined' != typeof window && window.Math == Math ? window : 'undefined' != typeof self && self.Math == Math ? self : Function('return this')());
    'number' == typeof __g && (__g = r);
  },
  31: function(t, n, r) {
    var e = r(7);
    t.exports = function(t, n) {
      if (!e(t)) return t;
      var r, o;
      if (n && 'function' == typeof (r = t.toString) && !e((o = r.call(t)))) return o;
      if ('function' == typeof (r = t.valueOf) && !e((o = r.call(t)))) return o;
      if (!n && 'function' == typeof (r = t.toString) && !e((o = r.call(t)))) return o;
      throw TypeError("Can't convert object to primitive value");
    };
  },
  32: function(t, n) {
    t.exports = function(t, n) {
      return { enumerable: !(1 & t), configurable: !(2 & t), writable: !(4 & t), value: n };
    };
  },
  33: function(t, n, r) {
    var e = r(34);
    t.exports = function(t, n, r) {
      if ((e(t), void 0 === n)) return t;
      switch (r) {
        case 1:
          return function(r) {
            return t.call(n, r);
          };
        case 2:
          return function(r, e) {
            return t.call(n, r, e);
          };
        case 3:
          return function(r, e, o) {
            return t.call(n, r, e, o);
          };
      }
      return function() {
        return t.apply(n, arguments);
      };
    };
  },
  34: function(t, n) {
    t.exports = function(t) {
      if ('function' != typeof t) throw TypeError(t + ' is not a function!');
      return t;
    };
  },
  35: function(t, n, r) {
    var e = r(7),
      o = r(3).document,
      i = e(o) && e(o.createElement);
    t.exports = function(t) {
      return i ? o.createElement(t) : {};
    };
  },
  36: function(t, n, r) {
    'use strict';
    var e = r(6),
      o = r(39)(!0);
    e(e.P, 'Array', {
      includes: function(t) {
        return o(this, t, arguments.length > 1 ? arguments[1] : void 0);
      },
    }),
      r(40)('includes');
  },
  37: function(t, n, r) {
    'use strict';
    var e = r(6),
      o = r(26);
    e(e.P + e.F * r(27)('includes'), 'String', {
      includes: function(t) {
        return !!~o(this, t, 'includes').indexOf(t, arguments.length > 1 ? arguments[1] : void 0);
      },
    });
  },
  38: function(t, n, r) {
    t.exports =
      !r(11) &&
      !r(14)(function() {
        return (
          7 !=
          Object.defineProperty(r(35)('div'), 'a', {
            get: function() {
              return 7;
            },
          }).a
        );
      });
  },
  39: function(t, n, r) {
    var e = r(24),
      o = r(21),
      i = r(44);
    t.exports = function(t) {
      return function(n, r, u) {
        var c,
          s = e(n),
          f = o(s.length),
          a = i(u, f);
        if (t && r != r) {
          for (; f > a; ) if ((c = s[a++]) != c) return !0;
        } else for (; f > a; a++) if ((t || a in s) && s[a] === r) return t || a || 0;
        return !t && -1;
      };
    };
  },
  4: function(t, n, r) {
    var e = r(22)('wks'),
      o = r(18),
      i = r(3).Symbol,
      u = 'function' == typeof i;
    (t.exports = function(t) {
      return e[t] || (e[t] = (u && i[t]) || (u ? i : o)('Symbol.' + t));
    }).store = e;
  },
  40: function(t, n, r) {
    var e = r(4)('unscopables'),
      o = Array.prototype;
    null == o[e] && r(9)(o, e, {}),
      (t.exports = function(t) {
        o[e][t] = !0;
      });
  },
  42: function(t, n, r) {
    t.exports = r(22)('native-function-to-string', Function.toString);
  },
  43: function(t, n, r) {
    var e = r(16);
    t.exports = Object('z').propertyIsEnumerable(0)
      ? Object
      : function(t) {
          return 'String' == e(t) ? t.split('') : Object(t);
        };
  },
  44: function(t, n, r) {
    var e = r(25),
      o = Math.max,
      i = Math.min;
    t.exports = function(t, n) {
      return (t = e(t)) < 0 ? o(t + n, 0) : i(t, n);
    };
  },
  46: function(t, n, r) {
    'use strict';
    var e = r(6),
      o = r(21),
      i = r(26),
      u = ''.endsWith;
    e(e.P + e.F * r(27)('endsWith'), 'String', {
      endsWith: function(t) {
        var n = i(this, t, 'endsWith'),
          r = arguments.length > 1 ? arguments[1] : void 0,
          e = o(n.length),
          c = void 0 === r ? e : Math.min(o(r), e),
          s = String(t);
        return u ? u.call(n, s, c) : n.slice(c - s.length, c) === s;
      },
    });
  },
  47: function(t, n, r) {
    var e = r(7),
      o = r(16),
      i = r(4)('match');
    t.exports = function(t) {
      var n;
      return e(t) && (void 0 !== (n = t[i]) ? !!n : 'RegExp' == o(t));
    };
  },
  6: function(t, n, r) {
    var e = r(3),
      o = r(10),
      i = r(9),
      u = r(23),
      c = r(33),
      s = function(t, n, r) {
        var f,
          a,
          l,
          p,
          v = t & s.F,
          S = t & s.G,
          g = t & s.S,
          d = t & s.P,
          h = t & s.B,
          y = S ? e : g ? e[n] || (e[n] = {}) : (e[n] || {}).prototype,
          b = S ? o : o[n] || (o[n] = {}),
          m = b.prototype || (b.prototype = {});
        for (f in (S && (r = n), r))
          (l = ((a = !v && y && void 0 !== y[f]) ? y : r)[f]),
            (p = h && a ? c(l, e) : d && 'function' == typeof l ? c(Function.call, l) : l),
            y && u(y, f, l, t & s.U),
            b[f] != l && i(b, f, p),
            d && m[f] != l && (m[f] = l);
      };
    (e.core = o), (s.F = 1), (s.G = 2), (s.S = 4), (s.P = 8), (s.B = 16), (s.W = 32), (s.U = 64), (s.R = 128), (t.exports = s);
  },
  7: function(t, n) {
    t.exports = function(t) {
      return 'object' == typeof t ? null !== t : 'function' == typeof t;
    };
  },
  77: function(t, n, r) {
    'use strict';
    var e = r(6),
      o = r(21),
      i = r(26),
      u = ''.startsWith;
    e(e.P + e.F * r(27)('startsWith'), 'String', {
      startsWith: function(t) {
        var n = i(this, t, 'startsWith'),
          r = o(Math.min(arguments.length > 1 ? arguments[1] : void 0, n.length)),
          e = String(t);
        return u ? u.call(n, e, r) : n.slice(r, r + e.length) === e;
      },
    });
  },
  9: function(t, n, r) {
    var e = r(19),
      o = r(32);
    t.exports = r(11)
      ? function(t, n, r) {
          return e.f(t, n, o(1, r));
        }
      : function(t, n, r) {
          return (t[n] = r), t;
        };
  },
});
//# sourceMappingURL=youtube-com.js.map
