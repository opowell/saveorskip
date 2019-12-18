!(function(t) {
  var e = {};
  function n(r) {
    if (e[r]) return e[r].exports;
    var o = (e[r] = { i: r, l: !1, exports: {} });
    return t[r].call(o.exports, o, o.exports, n), (o.l = !0), o.exports;
  }
  (n.m = t),
    (n.c = e),
    (n.d = function(t, e, r) {
      n.o(t, e) || Object.defineProperty(t, e, { enumerable: !0, get: r });
    }),
    (n.r = function(t) {
      'undefined' != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, { value: 'Module' }),
        Object.defineProperty(t, '__esModule', { value: !0 });
    }),
    (n.t = function(t, e) {
      if ((1 & e && (t = n(t)), 8 & e)) return t;
      if (4 & e && 'object' == typeof t && t && t.__esModule) return t;
      var r = Object.create(null);
      if ((n.r(r), Object.defineProperty(r, 'default', { enumerable: !0, value: t }), 2 & e && 'string' != typeof t))
        for (var o in t)
          n.d(
            r,
            o,
            function(e) {
              return t[e];
            }.bind(null, o)
          );
      return r;
    }),
    (n.n = function(t) {
      var e =
        t && t.__esModule
          ? function() {
              return t.default;
            }
          : function() {
              return t;
            };
      return n.d(e, 'a', e), e;
    }),
    (n.o = function(t, e) {
      return Object.prototype.hasOwnProperty.call(t, e);
    }),
    (n.p = ''),
    n((n.s = 146));
})([
  ,
  ,
  ,
  function(t, e) {
    var n = (t.exports = 'undefined' != typeof window && window.Math == Math ? window : 'undefined' != typeof self && self.Math == Math ? self : Function('return this')());
    'number' == typeof __g && (__g = n);
  },
  function(t, e, n) {
    var r = n(22)('wks'),
      o = n(18),
      i = n(3).Symbol,
      u = 'function' == typeof i;
    (t.exports = function(t) {
      return r[t] || (r[t] = (u && i[t]) || (u ? i : o)('Symbol.' + t));
    }).store = r;
  },
  ,
  function(t, e, n) {
    var r = n(3),
      o = n(10),
      i = n(9),
      u = n(23),
      c = n(33),
      a = function(t, e, n) {
        var s,
          l,
          f,
          p,
          d = t & a.F,
          g = t & a.G,
          v = t & a.S,
          h = t & a.P,
          S = t & a.B,
          y = g ? r : v ? r[e] || (r[e] = {}) : (r[e] || {}).prototype,
          x = g ? o : o[e] || (o[e] = {}),
          m = x.prototype || (x.prototype = {});
        for (s in (g && (n = e), n))
          (f = ((l = !d && y && void 0 !== y[s]) ? y : n)[s]),
            (p = S && l ? c(f, r) : h && 'function' == typeof f ? c(Function.call, f) : f),
            y && u(y, s, f, t & a.U),
            x[s] != f && i(x, s, p),
            h && m[s] != f && (m[s] = f);
      };
    (r.core = o), (a.F = 1), (a.G = 2), (a.S = 4), (a.P = 8), (a.B = 16), (a.W = 32), (a.U = 64), (a.R = 128), (t.exports = a);
  },
  function(t, e) {
    t.exports = function(t) {
      return 'object' == typeof t ? null !== t : 'function' == typeof t;
    };
  },
  ,
  function(t, e, n) {
    var r = n(19),
      o = n(32);
    t.exports = n(11)
      ? function(t, e, n) {
          return r.f(t, e, o(1, n));
        }
      : function(t, e, n) {
          return (t[e] = n), t;
        };
  },
  function(t, e) {
    var n = (t.exports = { version: '2.6.11' });
    'number' == typeof __e && (__e = n);
  },
  function(t, e, n) {
    t.exports = !n(14)(function() {
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
  ,
  ,
  function(t, e) {
    t.exports = function(t) {
      try {
        return !!t();
      } catch (t) {
        return !0;
      }
    };
  },
  function(t, e, n) {
    var r = n(7);
    t.exports = function(t) {
      if (!r(t)) throw TypeError(t + ' is not an object!');
      return t;
    };
  },
  function(t, e) {
    var n = {}.toString;
    t.exports = function(t) {
      return n.call(t).slice(8, -1);
    };
  },
  function(t, e) {
    t.exports = function(t) {
      if (null == t) throw TypeError("Can't call method on  " + t);
      return t;
    };
  },
  function(t, e) {
    var n = 0,
      r = Math.random();
    t.exports = function(t) {
      return 'Symbol('.concat(void 0 === t ? '' : t, ')_', (++n + r).toString(36));
    };
  },
  function(t, e, n) {
    var r = n(15),
      o = n(38),
      i = n(31),
      u = Object.defineProperty;
    e.f = n(11)
      ? Object.defineProperty
      : function(t, e, n) {
          if ((r(t), (e = i(e, !0)), r(n), o))
            try {
              return u(t, e, n);
            } catch (t) {}
          if ('get' in n || 'set' in n) throw TypeError('Accessors not supported!');
          return 'value' in n && (t[e] = n.value), t;
        };
  },
  function(t, e) {
    var n = {}.hasOwnProperty;
    t.exports = function(t, e) {
      return n.call(t, e);
    };
  },
  function(t, e, n) {
    var r = n(25),
      o = Math.min;
    t.exports = function(t) {
      return t > 0 ? o(r(t), 9007199254740991) : 0;
    };
  },
  function(t, e, n) {
    var r = n(10),
      o = n(3),
      i = o['__core-js_shared__'] || (o['__core-js_shared__'] = {});
    (t.exports = function(t, e) {
      return i[t] || (i[t] = void 0 !== e ? e : {});
    })('versions', []).push({ version: r.version, mode: n(28) ? 'pure' : 'global', copyright: '© 2019 Denis Pushkarev (zloirock.ru)' });
  },
  function(t, e, n) {
    var r = n(3),
      o = n(9),
      i = n(20),
      u = n(18)('src'),
      c = n(42),
      a = ('' + c).split('toString');
    (n(10).inspectSource = function(t) {
      return c.call(t);
    }),
      (t.exports = function(t, e, n, c) {
        var s = 'function' == typeof n;
        s && (i(n, 'name') || o(n, 'name', e)),
          t[e] !== n && (s && (i(n, u) || o(n, u, t[e] ? '' + t[e] : a.join(String(e)))), t === r ? (t[e] = n) : c ? (t[e] ? (t[e] = n) : o(t, e, n)) : (delete t[e], o(t, e, n)));
      })(Function.prototype, 'toString', function() {
        return ('function' == typeof this && this[u]) || c.call(this);
      });
  },
  function(t, e, n) {
    var r = n(43),
      o = n(17);
    t.exports = function(t) {
      return r(o(t));
    };
  },
  function(t, e) {
    var n = Math.ceil,
      r = Math.floor;
    t.exports = function(t) {
      return isNaN((t = +t)) ? 0 : (t > 0 ? r : n)(t);
    };
  },
  function(t, e, n) {
    var r = n(47),
      o = n(17);
    t.exports = function(t, e, n) {
      if (r(e)) throw TypeError('String#' + n + " doesn't accept regex!");
      return String(o(t));
    };
  },
  function(t, e, n) {
    var r = n(4)('match');
    t.exports = function(t) {
      var e = /./;
      try {
        '/./'[t](e);
      } catch (n) {
        try {
          return (e[r] = !1), !'/./'[t](e);
        } catch (t) {}
      }
      return !0;
    };
  },
  function(t, e) {
    t.exports = !1;
  },
  ,
  ,
  function(t, e, n) {
    var r = n(7);
    t.exports = function(t, e) {
      if (!r(t)) return t;
      var n, o;
      if (e && 'function' == typeof (n = t.toString) && !r((o = n.call(t)))) return o;
      if ('function' == typeof (n = t.valueOf) && !r((o = n.call(t)))) return o;
      if (!e && 'function' == typeof (n = t.toString) && !r((o = n.call(t)))) return o;
      throw TypeError("Can't convert object to primitive value");
    };
  },
  function(t, e) {
    t.exports = function(t, e) {
      return { enumerable: !(1 & t), configurable: !(2 & t), writable: !(4 & t), value: e };
    };
  },
  function(t, e, n) {
    var r = n(34);
    t.exports = function(t, e, n) {
      if ((r(t), void 0 === e)) return t;
      switch (n) {
        case 1:
          return function(n) {
            return t.call(e, n);
          };
        case 2:
          return function(n, r) {
            return t.call(e, n, r);
          };
        case 3:
          return function(n, r, o) {
            return t.call(e, n, r, o);
          };
      }
      return function() {
        return t.apply(e, arguments);
      };
    };
  },
  function(t, e) {
    t.exports = function(t) {
      if ('function' != typeof t) throw TypeError(t + ' is not a function!');
      return t;
    };
  },
  function(t, e, n) {
    var r = n(7),
      o = n(3).document,
      i = r(o) && r(o.createElement);
    t.exports = function(t) {
      return i ? o.createElement(t) : {};
    };
  },
  function(t, e, n) {
    'use strict';
    var r = n(6),
      o = n(39)(!0);
    r(r.P, 'Array', {
      includes: function(t) {
        return o(this, t, arguments.length > 1 ? arguments[1] : void 0);
      },
    }),
      n(40)('includes');
  },
  function(t, e, n) {
    'use strict';
    var r = n(6),
      o = n(26);
    r(r.P + r.F * n(27)('includes'), 'String', {
      includes: function(t) {
        return !!~o(this, t, 'includes').indexOf(t, arguments.length > 1 ? arguments[1] : void 0);
      },
    });
  },
  function(t, e, n) {
    t.exports =
      !n(11) &&
      !n(14)(function() {
        return (
          7 !=
          Object.defineProperty(n(35)('div'), 'a', {
            get: function() {
              return 7;
            },
          }).a
        );
      });
  },
  function(t, e, n) {
    var r = n(24),
      o = n(21),
      i = n(44);
    t.exports = function(t) {
      return function(e, n, u) {
        var c,
          a = r(e),
          s = o(a.length),
          l = i(u, s);
        if (t && n != n) {
          for (; s > l; ) if ((c = a[l++]) != c) return !0;
        } else for (; s > l; l++) if ((t || l in a) && a[l] === n) return t || l || 0;
        return !t && -1;
      };
    };
  },
  function(t, e, n) {
    var r = n(4)('unscopables'),
      o = Array.prototype;
    null == o[r] && n(9)(o, r, {}),
      (t.exports = function(t) {
        o[r][t] = !0;
      });
  },
  ,
  function(t, e, n) {
    t.exports = n(22)('native-function-to-string', Function.toString);
  },
  function(t, e, n) {
    var r = n(16);
    t.exports = Object('z').propertyIsEnumerable(0)
      ? Object
      : function(t) {
          return 'String' == r(t) ? t.split('') : Object(t);
        };
  },
  function(t, e, n) {
    var r = n(25),
      o = Math.max,
      i = Math.min;
    t.exports = function(t, e) {
      return (t = r(t)) < 0 ? o(t + e, 0) : i(t, e);
    };
  },
  ,
  function(t, e, n) {
    'use strict';
    var r = n(6),
      o = n(21),
      i = n(26),
      u = ''.endsWith;
    r(r.P + r.F * n(27)('endsWith'), 'String', {
      endsWith: function(t) {
        var e = i(this, t, 'endsWith'),
          n = arguments.length > 1 ? arguments[1] : void 0,
          r = o(e.length),
          c = void 0 === n ? r : Math.min(o(n), r),
          a = String(t);
        return u ? u.call(e, a, c) : e.slice(c - a.length, c) === a;
      },
    });
  },
  function(t, e, n) {
    var r = n(7),
      o = n(16),
      i = n(4)('match');
    t.exports = function(t) {
      var e;
      return r(t) && (void 0 !== (e = t[i]) ? !!e : 'RegExp' == o(t));
    };
  },
  ,
  ,
  function(t, e, n) {
    var r = n(17);
    t.exports = function(t) {
      return Object(r(t));
    };
  },
  ,
  ,
  ,
  ,
  ,
  ,
  function(t, e, n) {
    var r = n(16),
      o = n(4)('toStringTag'),
      i =
        'Arguments' ==
        r(
          (function() {
            return arguments;
          })()
        );
    t.exports = function(t) {
      var e, n, u;
      return void 0 === t
        ? 'Undefined'
        : null === t
        ? 'Null'
        : 'string' ==
          typeof (n = (function(t, e) {
            try {
              return t[e];
            } catch (t) {}
          })((e = Object(t)), o))
        ? n
        : i
        ? r(e)
        : 'Object' == (u = r(e)) && 'function' == typeof e.callee
        ? 'Arguments'
        : u;
    };
  },
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  function(t, e, n) {
    var r = n(25),
      o = n(17);
    t.exports = function(t) {
      return function(e, n) {
        var i,
          u,
          c = String(o(e)),
          a = r(n),
          s = c.length;
        return a < 0 || a >= s
          ? t
            ? ''
            : void 0
          : (i = c.charCodeAt(a)) < 55296 || i > 56319 || a + 1 === s || (u = c.charCodeAt(a + 1)) < 56320 || u > 57343
          ? t
            ? c.charAt(a)
            : i
          : t
          ? c.slice(a, a + 2)
          : u - 56320 + ((i - 55296) << 10) + 65536;
      };
    };
  },
  function(t, e, n) {
    'use strict';
    var r = n(6),
      o = n(21),
      i = n(26),
      u = ''.startsWith;
    r(r.P + r.F * n(27)('startsWith'), 'String', {
      startsWith: function(t) {
        var e = i(this, t, 'startsWith'),
          n = o(Math.min(arguments.length > 1 ? arguments[1] : void 0, e.length)),
          r = String(t);
        return u ? u.call(e, r, n) : e.slice(n, n + r.length) === r;
      },
    });
  },
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  function(t, e, n) {
    'use strict';
    var r,
      o,
      i = n(152),
      u = RegExp.prototype.exec,
      c = String.prototype.replace,
      a = u,
      s = ((r = /a/), (o = /b*/g), u.call(r, 'a'), u.call(o, 'a'), 0 !== r.lastIndex || 0 !== o.lastIndex),
      l = void 0 !== /()??/.exec('')[1];
    (s || l) &&
      (a = function(t) {
        var e,
          n,
          r,
          o,
          a = this;
        return (
          l && (n = new RegExp('^' + a.source + '$(?!\\s)', i.call(a))),
          s && (e = a.lastIndex),
          (r = u.call(a, t)),
          s && r && (a.lastIndex = a.global ? r.index + r[0].length : e),
          l &&
            r &&
            r.length > 1 &&
            c.call(r[0], n, function() {
              for (o = 1; o < arguments.length - 2; o++) void 0 === arguments[o] && (r[o] = void 0);
            }),
          r
        );
      }),
      (t.exports = a);
  },
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  function(t, e, n) {
    'use strict';
    n.r(e);
    n(46), n(77), n(147), n(36), n(37);
    var r,
      o = {
        save: { SUGGESTIONS_SUBREDDIT: 3, SUGGESTIONS_POSTER: 3, SUGGESTIONS_COMMENTER: 1, SUGGESTIONS_DOMAIN: 1, URL_SOURCE: 1 },
        skip: { SUGGESTIONS_SUBREDDIT: -2, SUGGESTIONS_POSTER: -2, SUGGESTIONS_COMMENTER: -1, SUGGESTIONS_DOMAIN: 1, URL_SOURCE: -1 },
        MAX_COMMENTERS: 3,
        highlightLinks: !1,
        closeAfterScrape: !0,
        getLinks: function(t) {
          console.log('get links');
          for (var e = document.getElementsByClassName('SQnoC3ObvgnGjWt90zD9Z'), n = [], r = 0; r < e.length; r++) {
            var i = e[r];
            i.parentElement.parentElement.parentElement.querySelector('.icon-sticky') ||
              (o.highlightLinks && ((i.style.color = 'white'), (i.style['background-color'] = '#1A73E8'), (i.style.padding = '3px'), (i.style.margin = '2px')),
              n.push({ url: 'http://www.reddit.com' + i.getAttribute('href'), title: i.text }));
          }
          console.log('returning links: ' + n.join('\n')), t(n), n.length > 0 && o.closeAfterScrape && window.close();
        },
        getSources: function(t) {
          console.log('get sources (' + t + ')');
          var e = [{ url: 'www.reddit.com', points: o[t].SUGGESTIONS_DOMAIN }],
            n = null;
          if (document.getElementsByClassName('s1wtsv0-8').length > 0) {
            var r = document.getElementsByClassName('s1wtsv0-8');
            n = o.buildUrl(r[0].getAttribute('href'));
          } else {
            var i = document.querySelectorAll("[data-test-id='post-content'] [data-click-id='subreddit']");
            i.length > 0 && (n = o.buildUrl(i[0].getAttribute('href')));
          }
          e.push({ url: n, points: o[t].SUGGESTIONS_SUBREDDIT });
          var u = document.querySelector('[data-test-id="post-content"] .s1461iz-1'),
            c = null;
          null != u && ((c = o.buildUrl(u.innerText)), e.push({ url: c, points: o[t].SUGGESTIONS_POSTER }));
          for (var a = document.querySelectorAll('.wx076j-0 > .s1461iz-1'), s = 0; s < a.length; s++) {
            var l = o.buildUrl(a[s].getAttribute('href'));
            if (c != l && (e.push({ url: l, points: o[t].SUGGESTIONS_COMMENTER }), s >= o.MAX_COMMENTERS - 1)) break;
          }
          return console.log('returning sources: ' + o.objJoin(e, '\n')), e;
        },
        objJoin: function(t, e) {
          var n = [];
          for (var r in t) t.hasOwnProperty(r) && n.push(JSON.stringify(t[r]));
          return n.join(e || '\n');
        },
        getUrlSources: function(t, e, n) {
          console.log('get sources (' + n + ') of url: ' + t);
          for (var r = [], i = document.getElementsByClassName('SQnoC3ObvgnGjWt90zD9Z'), u = 0; u < i; u++) {
            var c = i[u].getAttribute('href');
            if (t === (c = c.includes('://') ? o.trimmedUrl(c) : location.host + '/' + o.trimmedUrl(c))) {
              r.push({ url: o.trimmedUrl(location.href), points: o[n].URL_SOURCE });
              break;
            }
          }
          console.log('returning sources (' + n + ') of url ' + t + ':\n' + o.objJoin(r, '\n')), e(r);
        },
      },
      i =
        ((r = window.MutationObserver || window.WebKitMutationObserver),
        function(t, e) {
          t &&
            1 !== !t.nodeType &&
            (r
              ? new r(function(t, n) {
                  (t[0].addedNodes.length || t[0].removedNodes.length) && e(t[0]);
                }).observe(t, { childList: !0, subtree: !0 })
              : window.addEventListener && (t.addEventListener('DOMNodeInserted', e, !1), t.addEventListener('DOMNodeRemoved', e, !1)));
        });
    (o.buildUrl = function(t) {
      return (
        (t = (t = t.replace('\n', '')).replace('u/', 'user/')).startsWith('/') && (t = t.substring(1)), t.endsWith('/') && (t = t.substring(0, t.length - 1)), 'www.reddit.com/' + t
      );
    }),
      chrome.runtime.onMessage.addListener(function(t, e, n) {
        (console.log('sos received message: ' + JSON.stringify(t)), 'getSources' === t.action)
          ? n({ sources: o.getSources(t.saveOrSkip) })
          : 'getUrlSources' === t.action
          ? o.getUrlSources(t.url, n, t.saveOrSkip)
          : 'getLinks' === t.action
          ? o.getLinks(n)
          : (console.log('sos unknown message: ' + JSON.stringify(t)), n({}));
      }),
      (o.pageLoaded = !1);
    var u = document.querySelectorAll('.sogqxs-0.dpKXTN')[1];
    try {
      null == u
        ? (console.log('SOS: page loaded, no content found'), chrome.runtime.sendMessage('pageLoaded'), (o.pageLoaded = !0))
        : u.innerText.length > 0
        ? (console.log('SOS: page loaded immediately'), chrome.runtime.sendMessage('pageLoaded'), (o.pageLoaded = !0))
        : i(u, function(t) {
            o.pageLoaded ||
              ((o.pageLoaded = !0),
              console.log('SOS: page loaded after observe'),
              setTimeout(function() {
                chrome.runtime.sendMessage('pageLoaded');
              }, 200));
          });
    } catch (t) {
      setTimeout(function() {
        console.log('SOS: page loaded after error'), console.log(t), chrome.runtime.sendMessage('pageLoaded');
      }, 200);
    }
  },
  function(t, e, n) {
    'use strict';
    var r = n(15),
      o = n(50),
      i = n(21),
      u = n(25),
      c = n(148),
      a = n(149),
      s = Math.max,
      l = Math.min,
      f = Math.floor,
      p = /\$([$&`']|\d\d?|<[^>]*>)/g,
      d = /\$([$&`']|\d\d?)/g;
    n(150)('replace', 2, function(t, e, n, g) {
      return [
        function(r, o) {
          var i = t(this),
            u = null == r ? void 0 : r[e];
          return void 0 !== u ? u.call(r, i, o) : n.call(String(i), r, o);
        },
        function(t, e) {
          var o = g(n, t, this, e);
          if (o.done) return o.value;
          var f = r(t),
            p = String(this),
            d = 'function' == typeof e;
          d || (e = String(e));
          var h = f.global;
          if (h) {
            var S = f.unicode;
            f.lastIndex = 0;
          }
          for (var y = []; ; ) {
            var x = a(f, p);
            if (null === x) break;
            if ((y.push(x), !h)) break;
            '' === String(x[0]) && (f.lastIndex = c(p, i(f.lastIndex), S));
          }
          for (var m, b = '', O = 0, E = 0; E < y.length; E++) {
            x = y[E];
            for (var w = String(x[0]), M = s(l(u(x.index), p.length), 0), _ = [], T = 1; T < x.length; T++) _.push(void 0 === (m = x[T]) ? m : String(m));
            var N = x.groups;
            if (d) {
              var U = [w].concat(_, M, p);
              void 0 !== N && U.push(N);
              var j = String(e.apply(void 0, U));
            } else j = v(w, p, M, _, N, e);
            M >= O && ((b += p.slice(O, M) + j), (O = M + w.length));
          }
          return b + p.slice(O);
        },
      ];
      function v(t, e, r, i, u, c) {
        var a = r + t.length,
          s = i.length,
          l = d;
        return (
          void 0 !== u && ((u = o(u)), (l = p)),
          n.call(c, l, function(n, o) {
            var c;
            switch (o.charAt(0)) {
              case '$':
                return '$';
              case '&':
                return t;
              case '`':
                return e.slice(0, r);
              case "'":
                return e.slice(a);
              case '<':
                c = u[o.slice(1, -1)];
                break;
              default:
                var l = +o;
                if (0 === l) return n;
                if (l > s) {
                  var p = f(l / 10);
                  return 0 === p ? n : p <= s ? (void 0 === i[p - 1] ? o.charAt(1) : i[p - 1] + o.charAt(1)) : n;
                }
                c = i[l - 1];
            }
            return void 0 === c ? '' : c;
          })
        );
      }
    });
  },
  function(t, e, n) {
    'use strict';
    var r = n(76)(!0);
    t.exports = function(t, e, n) {
      return e + (n ? r(t, e).length : 1);
    };
  },
  function(t, e, n) {
    'use strict';
    var r = n(57),
      o = RegExp.prototype.exec;
    t.exports = function(t, e) {
      var n = t.exec;
      if ('function' == typeof n) {
        var i = n.call(t, e);
        if ('object' != typeof i) throw new TypeError('RegExp exec method returned something other than an Object or null');
        return i;
      }
      if ('RegExp' !== r(t)) throw new TypeError('RegExp#exec called on incompatible receiver');
      return o.call(t, e);
    };
  },
  function(t, e, n) {
    'use strict';
    n(151);
    var r = n(23),
      o = n(9),
      i = n(14),
      u = n(17),
      c = n(4),
      a = n(124),
      s = c('species'),
      l = !i(function() {
        var t = /./;
        return (
          (t.exec = function() {
            var t = [];
            return (t.groups = { a: '7' }), t;
          }),
          '7' !== ''.replace(t, '$<a>')
        );
      }),
      f = (function() {
        var t = /(?:)/,
          e = t.exec;
        t.exec = function() {
          return e.apply(this, arguments);
        };
        var n = 'ab'.split(t);
        return 2 === n.length && 'a' === n[0] && 'b' === n[1];
      })();
    t.exports = function(t, e, n) {
      var p = c(t),
        d = !i(function() {
          var e = {};
          return (
            (e[p] = function() {
              return 7;
            }),
            7 != ''[t](e)
          );
        }),
        g = d
          ? !i(function() {
              var e = !1,
                n = /a/;
              return (
                (n.exec = function() {
                  return (e = !0), null;
                }),
                'split' === t &&
                  ((n.constructor = {}),
                  (n.constructor[s] = function() {
                    return n;
                  })),
                n[p](''),
                !e
              );
            })
          : void 0;
      if (!d || !g || ('replace' === t && !l) || ('split' === t && !f)) {
        var v = /./[p],
          h = n(u, p, ''[t], function(t, e, n, r, o) {
            return e.exec === a ? (d && !o ? { done: !0, value: v.call(e, n, r) } : { done: !0, value: t.call(n, e, r) }) : { done: !1 };
          }),
          S = h[0],
          y = h[1];
        r(String.prototype, t, S),
          o(
            RegExp.prototype,
            p,
            2 == e
              ? function(t, e) {
                  return y.call(t, this, e);
                }
              : function(t) {
                  return y.call(t, this);
                }
          );
      }
    };
  },
  function(t, e, n) {
    'use strict';
    var r = n(124);
    n(6)({ target: 'RegExp', proto: !0, forced: r !== /./.exec }, { exec: r });
  },
  function(t, e, n) {
    'use strict';
    var r = n(15);
    t.exports = function() {
      var t = r(this),
        e = '';
      return t.global && (e += 'g'), t.ignoreCase && (e += 'i'), t.multiline && (e += 'm'), t.unicode && (e += 'u'), t.sticky && (e += 'y'), e;
    };
  },
]);
//# sourceMappingURL=reddit.js.map
