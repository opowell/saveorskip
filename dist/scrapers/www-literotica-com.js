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
    r((r.s = 155));
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
  155: function(t, n, r) {
    'use strict';
    r.r(n);
    r(46), r(36), r(37), r(77);
    var e = {
      SUGGESTIONS_PER_SAVE: 2,
      getLinks: function(t) {
        for (var n = [], r = [], o = document.querySelectorAll('table'), i = 0; i < o.length; i++) {
          var u = o[i];
          u.innerText.trim().startsWith('FAVORITE STORIES') && (r = u.querySelectorAll(':scope a.bb'));
        }
        console.log('found ' + r.length + ' links');
        for (var c = 0; c < r.length; c++) {
          var s = r[c].getAttribute('href');
          (s = e.buildUrl(s)), n.push({ url: s, title: r[c].innerText });
        }
        t(n), window.close();
      },
      getUrlSources: function(t, n) {
        for (var r = [], o = document.querySelectorAll('a'), i = 0; i < o.length; i++) {
          var u = o[i].getAttribute('href');
          if (t === (u = e.buildUrl(u))) {
            r.push(e.trimmedUrl(location.href));
            break;
          }
        }
        n(r);
      },
      getSources: function(t) {
        if (null != document.querySelector('select')) {
          console.log('not last page');
          var n = document.querySelectorAll('.b-pager-pages a'),
            r = n[n.length - 1].href;
          chrome.runtime.sendMessage({ action: 'openAndScrape', url: r }), t({});
        }
        var o = [],
          i = document.querySelector('span.b-story-user-y > a');
        null != i && o.push({ url: e.buildUrl(i.getAttribute('href')), points: 5 });
        for (var u = document.querySelectorAll('p.b-favorites-users > a.user-name'), c = 0; c < u.length; c++) {
          var s = u[c].getAttribute('href') + '&page=favorites';
          (s = e.trimmedUrl(s)), o.push({ url: s, points: 3 });
        }
        var f = document.querySelector('.b-breadcrumbs > a');
        if (null != f) {
          var l = f.getAttribute('href');
          (l = e.trimmedUrl(l)), o.push({ url: l, points: 1 });
        }
        for (var a = document.querySelectorAll('.b-s-story-tag-list a'), p = 0; p < a.length; p++) {
          var d = a[p].getAttribute('href');
          (d = e.trimmedUrl(d)), o.push({ url: d, points: 1 });
        }
        t({ sources: o }), console.log('sent sources: ' + o.join('\n'));
      },
      buildUrl: function(t) {
        return (t = t.includes('://') ? e.trimmedUrl(t) : e.trimmedUrl(location.origin) + '/' + e.trimmedUrl(t));
      },
      trimmedUrl: function(t) {
        return t.includes('://') && (t = t.substring(t.indexOf('://') + '://'.length)), t.endsWith('/') && (t = t.substring(0, t.length - 1)), t;
      },
    };
    chrome.runtime.onMessage.addListener(function(t, n, r) {
      console.log('sos received message: ' + t.action),
        'getSources' === t.action
          ? e.getSources(r)
          : 'getUrlSources' == t.action
          ? e.getUrlSources(t.url, r)
          : 'getLinks' == t.action
          ? e.getLinks(r)
          : (console.log('sos unknown message: ' + t.action), r({}));
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
          l = i(u, f);
        if (t && r != r) {
          for (; f > l; ) if ((c = s[l++]) != c) return !0;
        } else for (; f > l; l++) if ((t || l in s) && s[l] === r) return t || l || 0;
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
          l,
          a,
          p,
          d = t & s.F,
          v = t & s.G,
          h = t & s.S,
          g = t & s.P,
          y = t & s.B,
          m = v ? e : h ? e[n] || (e[n] = {}) : (e[n] || {}).prototype,
          b = v ? o : o[n] || (o[n] = {}),
          S = b.prototype || (b.prototype = {});
        for (f in (v && (r = n), r))
          (a = ((l = !d && m && void 0 !== m[f]) ? m : r)[f]),
            (p = y && l ? c(a, e) : g && 'function' == typeof a ? c(Function.call, a) : a),
            m && u(m, f, a, t & s.U),
            b[f] != a && i(b, f, p),
            g && S[f] != a && (S[f] = a);
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
//# sourceMappingURL=www-literotica-com.js.map
