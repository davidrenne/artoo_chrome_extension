;(function(undefined) {
  'use strict';

  /**
   * artoo core
   * ===========
   *
   * The main artoo namespace and its vital properties.
   */

  // Checking whether a body exists
  var body;
  if ('document' in this) {
    body = document.getElementsByTagName('body')[0];
    if (!body) {
      body = document.createElement('body');
      document.documentElement.appendChild(body);
    }
  }

  // Main object
  var artoo = {

    // Standard properties
    $: {},
    jquery: {
      applyPlugins: function() {
        artoo.jquery.plugins.map(function(p) {
          p(artoo.$);
        });
      },
      plugins: []
    },
    mountNode: body,
    stylesheets: {},
    templates: {},

    // Emitter shim properties
    _enabled: true,
    _children: [],
    _handlers: {},
    _handlersAll: []
  };

  // Non-writable version
  Object.defineProperty(artoo, 'version', {
    value: '0.3.2'
  });

  // Exporting to global scope
  this.artoo = artoo;
}).call(this);

/**
 * artoo node.js shim
 * ===================
 *
 * Make it possible to require artoo through node.
 */
var artoo = this.artoo;

(function() {
  'use strict';

  /**
   * Here is the list of every allowed parameter when using Emitter#on:
   * @type {Object}
   */
  var __allowedOptions = {
    once: 'boolean',
    scope: 'object'
  };


  /**
   * The emitter's constructor. It initializes the handlers-per-events store and
   * the global handlers store.
   *
   * Emitters are useful for non-DOM events communication. Read its methods
   * documentation for more information about how it works.
   *
   * @return {Emitter}         The fresh new instance.
   */
  var Emitter = function() {
    this._enabled = true;
    this._children = [];
    this._handlers = {};
    this._handlersAll = [];
  };


  /**
   * This method binds one or more functions to the emitter, handled to one or a
   * suite of events. So, these functions will be executed anytime one related
   * event is emitted.
   *
   * It is also possible to bind a function to any emitted event by not
   * specifying any event to bind the function to.
   *
   * Recognized options:
   * *******************
   *  - {?boolean} once   If true, the handlers will be unbound after the first
   *                      execution. Default value: false.
   *  - {?object}  scope  If a scope is given, then the listeners will be called
   *                      with this scope as "this".
   *
   * Variant 1:
   * **********
   * > myEmitter.on('myEvent', function(e) { console.log(e); });
   * > // Or:
   * > myEmitter.on('myEvent', function(e) { console.log(e); }, { once: true });
   *
   * @param  {string}   event   The event to listen to.
   * @param  {function} handler The function to bind.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 2:
   * **********
   * > myEmitter.on(
   * >   ['myEvent1', 'myEvent2'],
   * >   function(e) { console.log(e); }
   * >);
   * > // Or:
   * > myEmitter.on(
   * >   ['myEvent1', 'myEvent2'],
   * >   function(e) { console.log(e); }
   * >   { once: true }}
   * >);
   *
   * @param  {array}    events  The events to listen to.
   * @param  {function} handler The function to bind.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 3:
   * **********
   * > myEmitter.on({
   * >   myEvent1: function(e) { console.log(e); },
   * >   myEvent2: function(e) { console.log(e); }
   * > });
   * > // Or:
   * > myEmitter.on({
   * >   myEvent1: function(e) { console.log(e); },
   * >   myEvent2: function(e) { console.log(e); }
   * > }, { once: true });
   *
   * @param  {object}  bindings An object containing pairs event / function.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 4:
   * **********
   * > myEmitter.on(function(e) { console.log(e); });
   * > // Or:
   * > myEmitter.on(function(e) { console.log(e); }, { once: true});
   *
   * @param  {function} handler The function to bind to every events.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   */
  Emitter.prototype.on = function(a, b, c) {
    var i,
        l,
        k,
        event,
        eArray,
        bindingObject;

    // Variant 1 and 2:
    if (typeof b === 'function') {
      eArray = typeof a === 'string' ?
        [a] :
        a;

      for (i = 0, l = eArray.length; i !== l; i += 1) {
        event = eArray[i];

        // Check that event is not '':
        if (!event)
          continue;

        if (!this._handlers[event])
          this._handlers[event] = [];

        bindingObject = {
          handler: b
        };

        for (k in c || {})
          if (__allowedOptions[k])
            bindingObject[k] = c[k];
          else
            throw new Error(
              'The option "' + k + '" is not recognized by Emmett.'
            );

        this._handlers[event].push(bindingObject);
      }

    // Variant 3:
    } else if (a && typeof a === 'object' && !Array.isArray(a))
      for (event in a)
        Emitter.prototype.on.call(this, event, a[event], b);

    // Variant 4:
    else if (typeof a === 'function') {
      bindingObject = {
        handler: a
      };

      for (k in c || {})
        if (__allowedOptions[k])
          bindingObject[k] = c[k];
        else
          throw new Error(
            'The option "' + k + '" is not recognized by Emmett.'
          );

      this._handlersAll.push(bindingObject);
    }

    // No matching variant:
    else
      throw new Error('Wrong arguments.');

    return this;
  };


  /**
   * This method works exactly as the previous #on, but will add an options
   * object if none is given, and set the option "once" to true.
   *
   * The polymorphism works exactly as with the #on method.
   */
  Emitter.prototype.once = function(a, b, c) {
    // Variant 1 and 2:
    if (typeof b === 'function') {
      c = c || {};
      c.once = true;
      this.on(a, b, c);

    // Variants 3 and 4:
    } else if (
      // Variant 3:
      (a && typeof a === 'object' && !Array.isArray(a)) ||
      // Variant 4:
      (typeof a === 'function')
    ) {
      b = b || {};
      b.once = true;
      this.on(a, b);

    // No matching variant:
    } else
      throw new Error('Wrong arguments.');

    return this;
  };


  /**
   * This method unbinds one or more functions from events of the emitter. So,
   * these functions will no more be executed when the related events are
   * emitted. If the functions were not bound to the events, nothing will
   * happen, and no error will be thrown.
   *
   * Variant 1:
   * **********
   * > myEmitter.off('myEvent', myHandler);
   *
   * @param  {string}   event   The event to unbind the handler from.
   * @param  {function} handler The function to unbind.
   * @return {Emitter}          Returns this.
   *
   * Variant 2:
   * **********
   * > myEmitter.off(['myEvent1', 'myEvent2'], myHandler);
   *
   * @param  {array}    events  The events to unbind the handler from.
   * @param  {function} handler The function to unbind.
   * @return {Emitter}          Returns this.
   *
   * Variant 3:
   * **********
   * > myEmitter.off({
   * >   myEvent1: myHandler1,
   * >   myEvent2: myHandler2
   * > });
   *
   * @param  {object} bindings An object containing pairs event / function.
   * @return {Emitter}         Returns this.
   *
   * Variant 4:
   * **********
   * > myEmitter.off(myHandler);
   *
   * @param  {function} handler The function to unbind from every events.
   * @return {Emitter}          Returns this.
   */
  Emitter.prototype.off = function(events, handler) {
    var i,
        n,
        j,
        m,
        k,
        a,
        event,
        eArray = typeof events === 'string' ?
          [events] :
          events;

    if (arguments.length === 1 && typeof eArray === 'function') {
      handler = arguments[0];

      // Handlers bound to events:
      for (k in this._handlers) {
        a = [];
        for (i = 0, n = this._handlers[k].length; i !== n; i += 1)
          if (this._handlers[k][i].handler !== handler)
            a.push(this._handlers[k][i]);
        this._handlers[k] = a;
      }

      a = [];
      for (i = 0, n = this._handlersAll.length; i !== n; i += 1)
        if (this._handlersAll[i].handler !== handler)
          a.push(this._handlersAll[i]);
      this._handlersAll = a;
    }

    else if (arguments.length === 2) {
      for (i = 0, n = eArray.length; i !== n; i += 1) {
        event = eArray[i];
        if (this._handlers[event]) {
          a = [];
          for (j = 0, m = this._handlers[event].length; j !== m; j += 1)
            if (this._handlers[event][j].handler !== handler)
              a.push(this._handlers[event][j]);

          this._handlers[event] = a;
        }

        if (this._handlers[event] && this._handlers[event].length === 0)
          delete this._handlers[event];
      }
    }

    return this;
  };


  /**
   * This method unbinds every handlers attached to every or any events. So,
   * these functions will no more be executed when the related events are
   * emitted. If the functions were not bound to the events, nothing will
   * happen, and no error will be thrown.
   *
   * Usage:
   * ******
   * > myEmitter.unbindAll();
   *
   * @return {Emitter}      Returns this.
   */
  Emitter.prototype.unbindAll = function() {
    var k;

    this._handlersAll = [];
    for (k in this._handlers)
      delete this._handlers[k];

    return this;
  };


  /**
   * This method emits the specified event(s), and executes every handlers bound
   * to the event(s).
   *
   * Use cases:
   * **********
   * > myEmitter.emit('myEvent');
   * > myEmitter.emit('myEvent', myData);
   * > myEmitter.emit(['myEvent1', 'myEvent2']);
   * > myEmitter.emit(['myEvent1', 'myEvent2'], myData);
   *
   * @param  {string|array} events The event(s) to emit.
   * @param  {object?}      data   The data.
   * @return {Emitter}             Returns this.
   */
  Emitter.prototype.emit = function(events, data) {
    var i,
        n,
        j,
        m,
        z,
        a,
        event,
        child,
        handlers,
        eventName,
        self = this,
        eArray = typeof events === 'string' ?
          [events] :
          events;

    // Check that the emitter is enabled:
    if (!this._enabled)
      return this;

    data = data === undefined ? {} : data;

    for (i = 0, n = eArray.length; i !== n; i += 1) {
      eventName = eArray[i];
      handlers = (this._handlers[eventName] || []).concat(this._handlersAll);

      if (handlers.length) {
        event = {
          type: eventName,
          data: data || {},
          target: this
        };
        a = [];

        for (j = 0, m = handlers.length; j !== m; j += 1) {

          // We have to verify that the handler still exists in the array,
          // as it might have been mutated already
          if (
            (
              this._handlers[eventName] &&
              this._handlers[eventName].indexOf(handlers[j]) >= 0
            ) ||
            this._handlersAll.indexOf(handlers[j]) >= 0
          ) {
            handlers[j].handler.call(
              'scope' in handlers[j] ? handlers[j].scope : this,
              event
            );

            // Since the listener callback can mutate the _handlers,
            // we register the handlers we want to remove, not the ones
            // we want to keep
            if (handlers[j].once)
              a.push(handlers[j]);
          }
        }

        // Go through handlers to remove
        for (z = 0; z < a.length; z++) {
          this._handlers[eventName].splice(a.indexOf(a[z]), 1);
        }
      }
    }

    // Events propagation:
    for (i = 0, n = this._children.length; i !== n; i += 1) {
      child = this._children[i];
      child.emit.apply(child, arguments);
    }

    return this;
  };


  /**
   * This method creates a new instance of Emitter and binds it as a child. Here
   * is what children do:
   *  - When the parent emits an event, the children will emit the same later
   *  - When a child is killed, it is automatically unreferenced from the parent
   *  - When the parent is killed, all children will be killed as well
   *
   * @return {Emitter} Returns the fresh new child.
   */
  Emitter.prototype.child = function() {
    var self = this,
        child = new Emitter();

    child.on('emmett:kill', function() {
      if (self._children)
        for (var i = 0, l = self._children.length; i < l; i++)
          if (self._children[i] === child) {
            self._children.splice(i, 1);
            break;
          }
    });
    this._children.push(child);

    return child;
  };

  /**
   * This returns an array of handler functions corresponding to the given
   * event or every handler functions if an event were not to be given.
   *
   * @param  {?string} event Name of the event.
   * @return {Emitter} Returns this.
   */
  function mapHandlers(a) {
    var i, l, h = [];

    for (i = 0, l = a.length; i < l; i++)
      h.push(a[i].handler);

    return h;
  }

  Emitter.prototype.listeners = function(event) {
    var handlers = [],
        k,
        i,
        l;

    // If no event is passed, we return every handlers
    if (!event) {
      handlers = mapHandlers(this._handlersAll);

      for (k in this._handlers)
        handlers = handlers.concat(mapHandlers(this._handlers[k]));

      // Retrieving handlers per children
      for (i = 0, l = this._children.length; i < l; i++)
        handlers = handlers.concat(this._children[i].listeners());
    }

    // Else we only retrieve the needed handlers
    else {
      handlers = mapHandlers(this._handlers[event]);

      // Retrieving handlers per children
      for (i = 0, l = this._children.length; i < l; i++)
        handlers = handlers.concat(this._children[i].listeners(event));
    }

    return handlers;
  };


  /**
   * This method will first dispatch a "emmett:kill" event, and then unbinds all
   * listeners and make it impossible to ever rebind any listener to any event.
   */
  Emitter.prototype.kill = function() {
    this.emit('emmett:kill');

    this.unbindAll();
    this._handlers = null;
    this._handlersAll = null;
    this._enabled = false;

    if (this._children)
      for (var i = 0, l = this._children.length; i < l; i++)
        this._children[i].kill();

    this._children = null;
  };


  /**
   * This method disabled the emitter, which means its emit method will do
   * nothing.
   *
   * @return {Emitter} Returns this.
   */
  Emitter.prototype.disable = function() {
    this._enabled = false;

    return this;
  };


  /**
   * This method enables the emitter.
   *
   * @return {Emitter} Returns this.
   */
  Emitter.prototype.enable = function() {
    this._enabled = true;

    return this;
  };


  /**
   * Version:
   */
  Emitter.version = '2.1.2';


  // Export:
  artoo.emitter = Emitter;
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo Node.js utilities
   * ========================
   *
   * Some useful utilities when using artoo.js within node.
   */
  var cheerio = require('cheerio'),
      path = require('path');

  // Setting initial context
  artoo.$ = cheerio.load('');

  // Methods
  artoo.bootstrap = function(cheerioInstance) {
    ['scrape', 'scrapeOne', 'scrapeTable'].forEach(function(m) {
      cheerioInstance.prototype[m] = function() {
        return artoo[m].apply(
          artoo, [artoo.$(this)].concat(Array.prototype.slice.call(arguments)));
      };
    });
  };

  artoo.bootstrap(cheerio);

  artoo.setContext = function($) {

    // Fixing context
    artoo.$ = $;
  };

  // Giving paths to alternative lib versions so they can be used afterwards
  artoo.paths = {
    browser: path.join(__dirname, 'artoo.concat.js'),
    chrome: path.join(__dirname, 'artoo.chrome.js'),
    phantom: path.join(__dirname, 'artoo.phantom.js')
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo helpers
   * ==============
   *
   * Some useful helpers.
   */
  var _root = this;

  // Extending Emmett
  Object.setPrototypeOf = Object.setPrototypeOf || function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
  };
  var ee = new artoo.emitter();
  Object.setPrototypeOf(artoo, Object.getPrototypeOf(ee));


  // Legacy support
  // TODO: drop this asap
  artoo.hooks = {
    trigger: function(name) {
      artoo.emit(name);
    }
  };


  /**
   * Generic Helpers
   * ----------------
   *
   * Some basic helpers from collection handling to type checking.
   */

  // Useless function
  function noop() {}

  // Recursively extend objects
  function extend() {
    var i,
        k,
        res = {},
        l = arguments.length;

    for (i = l - 1; i >= 0; i--)
      for (k in arguments[i])
        if (res[k] && isPlainObject(arguments[i][k]))
          res[k] = extend(arguments[i][k], res[k]);
        else
          res[k] = arguments[i][k];

    return res;
  }

  // Is the var an array?
  function isArray(v) {
    return v instanceof Array;
  }

  // Is the var an object?
  function isObject(v) {
    return v instanceof Object;
  }

  // Is the var a real NaN
  function isRealNaN(v) {
    return isNaN(v) && (typeof v === 'number');
  }

  // Is the var a plain object?
  function isPlainObject(v) {
    return v instanceof Object &&
           !(v instanceof Array) &&
           !(v instanceof Function);
  }

  // Is a var non primitive?
  function isNonPrimitive(v) {
    return isPlainObject(v) || isArray(v);
  }

  // Is a var primitive?
  function isPrimitive(v) {
    return !isNonScalar(v);
  }

  // Get first item of array returning true to given function
  function first(a, fn, scope) {
    for (var i = 0, l = a.length; i < l; i++) {
      if (fn.call(scope || null, a[i]))
        return a[i];
    }
    return;
  }

  // Get the index of an element in an array by function
  function indexOf(a, fn, scope) {
    for (var i = 0, l = a.length; i < l; i++) {
      if (fn.call(scope || null, a[i]))
        return i;
    }
    return -1;
  }


  /**
   * Document Helpers
   * -----------------
   *
   * Functions to deal with DOM selection and the current document.
   */

  // Checking whether a variable is a jQuery selector
  function isSelector(v) {
    return (artoo.$ && v instanceof artoo.$) ||
           (jQuery && v instanceof jQuery) ||
           ($ && v instanceof $);
  }

  // Checking whether a variable is a DOM document
  function isDocument(v) {
    return v instanceof HTMLDocument ||
           v instanceof XMLDocument;
  }

  // Get either string or document and return valid jQuery selection
  function jquerify(v) {
    var $ = artoo.$;

    if (isDocument(v))
      return $(v);
    return $('<div />').append(v);
  }

  // Creating an HTML or XML document
  function createDocument(root, namespace) {
    if (!root)
      return document.implementation.createHTMLDocument();
    else
      return document.implementation.createDocument(
        namespace || null,
        root,
        null
      );
  }

  // Loading an external file the same way the browser would load it from page
  function getScript(url, async, cb) {
    if (typeof async === 'function') {
      cb = async;
      async = false;
    }

    var el = document.createElement('script');

    // Script attributes
    el.type = 'text/javascript';
    el.src = url;

    // Should the script be loaded asynchronously?
    if (async)
      el.async = true;

    // Defining callbacks
    el.onload = el.onreadystatechange = function() {
      if ((!this.readyState ||
            this.readyState == 'loaded' ||
            this.readyState == 'complete')) {
        el.onload = el.onreadystatechange = null;

        // Removing element from head
        artoo.mountNode.removeChild(el);

        if (typeof cb === 'function')
          cb();
      }
    };

    // Appending the script to head
    artoo.mountNode.appendChild(el);
  }

  // Loading an external stylesheet
  function getStylesheet(data, isUrl, cb) {
    var el = document.createElement(isUrl ? 'link' : 'style'),
        head = document.getElementsByTagName('head')[0];

    el.type = 'text/css';

    if (isUrl) {
      el.href = data;
      el.rel = 'stylesheet';

      // Waiting for script to load
      el.onload = el.onreadystatechange = function() {
        if ((!this.readyState ||
              this.readyState == 'loaded' ||
              this.readyState == 'complete')) {
          el.onload = el.onreadystatechange = null;

          if (typeof cb === 'function')
            cb();
        }
      };
    }
    else {
      el.innerHTML = data;
    }

    // Appending the stylesheet to head
    head.appendChild(el);
  }

  var globalsBlackList = [
    '__commandLineAPI',
    'applicationCache',
    'chrome',
    'closed',
    'console',
    'crypto',
    'CSS',
    'defaultstatus',
    'defaultStatus',
    'devicePixelRatio',
    'document',
    'external',
    'frameElement',
    'history',
    'indexedDB',
    'innerHeight',
    'innerWidth',
    'length',
    'localStorage',
    'location',
    'name',
    'offscreenBuffering',
    'opener',
    'outerHeight',
    'outerWidth',
    'pageXOffset',
    'pageYOffset',
    'performance',
    'screen',
    'screenLeft',
    'screenTop',
    'screenX',
    'screenY',
    'scrollX',
    'scrollY',
    'sessionStorage',
    'speechSynthesis',
    'status',
    'styleMedia'
  ];

  function getGlobalVariables() {
    var p = Object.getPrototypeOf(_root),
        o = {},
        i;

    for (i in _root)
      if (!~i.indexOf('webkit') &&
          !(i in p) &&
          _root[i] !== _root &&
          !(_root[i] instanceof BarProp) &&
          !(_root[i] instanceof Navigator) &&
          !~globalsBlackList.indexOf(i))
        o[i] = _root[i];

    return o;
  }


  /**
   * Async Helpers
   * --------------
   *
   * Some helpful functions to deal with asynchronous matters.
   */

  // Waiting for something to happen
  function waitFor(check, cb, params) {
    params = params || {};
    if (typeof cb === 'object') {
      params = cb;
      cb = params.done;
    }

    var milliseconds = params.interval || 30,
        j = 0;

    var i = setInterval(function() {
      if (check()) {
        clearInterval(i);
        cb(null);
      }

      if (params.timeout && params.timeout - (j * milliseconds) <= 0) {
        clearInterval(i);
        cb(new Error('timeout'));
      }

      j++;
    }, milliseconds);
  }

  // Dispatch asynchronous function
  function async() {
    var args = Array.prototype.slice.call(arguments);
    return setTimeout.apply(null, [args[0], 0].concat(args.slice(1)));
  }

  // Launching tasks in parallel with an optional limit
  function parallel(tasks, params, last) {
    var onEnd = (typeof params === 'function') ? params : params.done || last,
        running = [],
        results = [],
        d = 0,
        t,
        l,
        i;

    if (typeof onEnd !== 'function')
      onEnd = noop;

    function cleanup() {
      running.forEach(function(r) {
        clearTimeout(r);
      });
    }

    function onTaskEnd(err, result) {
      // Adding results to accumulator
      results.push(result);

      if (err) {
        cleanup();
        return onEnd(err, results);
      }

      if (++d >= tasks.length) {

        // Parallel action is finished, returning
        return onEnd(null, results);
      }

      // Adding on stack
      t = tasks[i++];
      running.push(async(t, onTaskEnd));
    }

    for (i = 0, l = params.limit || tasks.length; i < l; i++) {
      t = tasks[i];

      // Dispatching the function asynchronously
      running.push(async(t, onTaskEnd));
    }
  }


  /**
   * Monkey Patching
   * ----------------
   *
   * Some monkey patching shortcuts. Useful for sniffers and overriding
   * native functions.
   */

  function before(targetFunction, beforeFunction) {

    // Replacing the target function
    return function() {

      // Applying our function
      beforeFunction.apply(this, Array.prototype.slice.call(arguments));

      // Applying the original function
      return targetFunction.apply(this, Array.prototype.slice.call(arguments));
    };
  }


  /**
   * Exportation
   * ------------
   */

  // Exporting to artoo root
  artoo.injectScript = function(url, cb) {
    getScript(url, cb);
  };
  artoo.injectStyle = function(url, cb) {
    getStylesheet(url, true, cb);
  };
  artoo.injectInlineStyle = function(text) {
    getStylesheet(text, false);
  };
  artoo.waitFor = waitFor;
  artoo.getGlobalVariables = getGlobalVariables;

  // Exporting to artoo helpers
  artoo.helpers = {
    before: before,
    createDocument: createDocument,
    extend: extend,
    first: first,
    indexOf: indexOf,
    isArray: isArray,
    isDocument: isDocument,
    isObject: isObject,
    isPlainObject: isPlainObject,
    isRealNaN: isRealNaN,
    isSelector: isSelector,
    isNonPrimitive: isNonPrimitive,
    isPrimitive: isPrimitive,
    jquerify: jquerify,
    noop: noop,
    parallel: parallel
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo parsers
   * ==============
   *
   * Compilation of small parsers aim at understanding some popular web
   * string formats such as querystrings, headers etc.
   */

  function parseQueryString(s) {
    var data = {};

    s.split('&').forEach(function(item) {
      var pair = item.split('=');
      data[decodeURIComponent(pair[0])] =
        pair[1] ? decodeURIComponent(pair[1]) : true;
    });

    return data;
  }

  function parseUrl(url) {
    var data = {href: url};

    // Searching for a protocol
    var ps = url.split('://');

    if (ps.length > 1)
      data.protocol = ps[0];

    url = ps[ps.length > 1 ? 1 : 0];

    // Searching for an authentification
    var a = url.split('@');
    if (a.length > 1) {
      var as = a[0].split(':');
      if (as.length > 1) {
        data.auth = {
          user: as[0],
          password: as[1]
        };
      }
      else {
        data.auth = {
          user: as[0]
        };
      }

      url = a[1];
    }

    // Searching for origin
    var m = url.match(/([^\/:]+)(.*)/);
    data.host = m[1];
    data.hostname = m[1];

    if (m[2]) {
      var f = m[2].trim();

      // Port
      if (f.charAt(0) === ':') {
        data.port = +f.match(/\d+/)[0];
        data.host += ':' + data.port;
      }

      // Path
      data.path = '/' + f.split('/').slice(1).join('/');

      data.pathname = data.path.split('?')[0].split('#')[0];
    }

    // Tld
    if (~data.hostname.search('.')) {
      var ds = data.hostname.split('.');

      // Check for IP
      if (!(ds.length === 4 &&
          ds.every(function(i) { return !isNaN(+i); }))) {

        // Checking TLD-less urls
        if (ds.length > 1) {

          // TLD
          data.tld = ds[ds.length - 1];

          // Domain
          data.domain = ds[ds.length - 2];

          // Subdomains
          if (ds.length > 2) {
            data.subdomains = [];
            for (var i = 0, l = ds.length - 2; i < l; i++)
              data.subdomains.unshift(ds[i]);
          }
        }
        else {

          // TLD-less url
          data.domain = ds[0];
        }
      }
      else {

        // This is an IP
        data.domain = data.hostname;
      }
    }

    // Hash
    var hs = url.split('#');

    if (hs.length > 1) {
      data.hash = '#' + hs[1];
    }

    // Querystring
    var qs = url.split('?');

    if (qs.length > 1) {
      data.search = '?' + qs[1];
      data.query = parseQueryString(qs[1]);
    }

    // Extension
    var ss = data.pathname.split('/'),
        es = ss[ss.length - 1].split('.');

    if (es.length > 1)
      data.extension = es[es.length - 1];

    return data;
  }

  function parseHeaders(headers) {
    var data = {};

    headers.split('\n').filter(function(item) {
      return item.trim();
    }).forEach(function(item) {
      if (item) {
        var pair = item.split(': ');
        data[pair[0]] = pair[1];
      }
    });

    return data;
  }

  function parseCookie(s) {
    var cookie = {
      httpOnly: false,
      secure: false
    };

    if (!s.trim())
      return;

    s.split('; ').forEach(function(item) {

      // Path
      if (~item.search(/path=/i)) {
        cookie.path = item.split('=')[1];
      }
      else if (~item.search(/expires=/i)) {
        cookie.expires = item.split('=')[1];
      }
      else if (~item.search(/httponly/i) && !~item.search('=')) {
        cookie.httpOnly = true;
      }
      else if (~item.search(/secure/i) && !~item.search('=')) {
        cookie.secure = true;
      }
      else {
        var is = item.split('=');
        cookie.key = is[0];
        cookie.value = decodeURIComponent(is[1]);
      }
    });

    return cookie;
  }

  function parseCookies(s) {
    var cookies = {};

    if (!s.trim())
      return cookies;

    s.split('; ').forEach(function(item) {
      var pair = item.split('=');
      cookies[pair[0]] = decodeURIComponent(pair[1]);
    });

    return cookies;
  }

  /**
   * Exporting
   */
  artoo.parsers = {
    cookie: parseCookie,
    cookies: parseCookies,
    headers: parseHeaders,
    queryString: parseQueryString,
    url: parseUrl
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo writers
   * ==============
   *
   * Compilation of writers for popular formats such as CSV or YAML.
   */

  // Dependencies
  var isPlainObject = artoo.helpers.isPlainObject,
      isArray = artoo.helpers.isArray,
      isPrimitive = artoo.helpers.isPrimitive,
      isNonPrimitive = artoo.helpers.isNonPrimitive,
      isRealNaN = artoo.helpers.isRealNaN;


  /**
   * CSV
   * ---
   *
   * Converts an array of array or array of objects into a correct
   * CSV string for exports purposes.
   *
   * Exposes some handful options such as choice of delimiters or order
   * of keys to handle.
   */

  // Convert an object into an array of its properties
  function objectToArray(o, order) {
    order = order || Object.keys(o);

    return order.map(function(k) {
      return o[k];
    });
  }

  // Retrieve an index of keys present in an array of objects
  function keysIndex(a) {
    var keys = [],
        l,
        k,
        i;

    for (i = 0, l = a.length; i < l; i++)
      for (k in a[i])
        if (!~keys.indexOf(k))
          keys.push(k);

    return keys;
  }

  // Escape a string for a RegEx
  function rescape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  // Converting an array of arrays into a CSV string
  function toCSVString(data, params) {
    params = params || {};

    var header = params.headers || [],
        plainObject = isPlainObject(data[0]),
        keys = plainObject && (params.order || keysIndex(data)),
        oData,
        i;

    // Defaults
    var escape = params.escape || '"',
        delimiter = params.delimiter || ',';

    // Dealing with headers polymorphism
    if (!header.length)
      if (plainObject && params.headers !== false)
        header = keys;

    // Should we append headers
    oData = (header.length ? [header] : []).concat(
      plainObject ?
        data.map(function(e) { return objectToArray(e, keys); }) :
        data
    );

    // Converting to string
    return oData.map(function(row) {
      return row.map(function(item) {

        // Wrapping escaping characters
        var i = ('' + (typeof item === 'undefined' ? '' : item)).replace(
          new RegExp(rescape(escape), 'g'),
          escape + escape
        );

        // Escaping if needed
        return ~i.indexOf(delimiter) || ~i.indexOf(escape) || ~i.indexOf('\n') ?
          escape + i + escape :
          i;
      }).join(delimiter);
    }).join('\n');
  }



  /**
   * YAML
   * ----
   *
   * Converts JavaScript data into a YAML string for export purposes.
   */

  // Characters to escape in YAML
  var ymlEscape = /[:#,\-\[\]\{\}&%]|!{1,2}/;

  // Creating repeating sequences
  function repeatString(string, nb) {
    var s = string,
        l,
        i;

    if (nb <= 0)
      return '';

    for (i = 1, l = nb | 0; i < l; i++)
      s += string;
    return s;
  }

  // YAML conversion
  var yml = {
    string: function(string) {
      return (~string.search(ymlEscape)) ?
        '\'' + string.replace(/'/g, '\'\'') + '\'' :
        string;
    },
    number: function(nb) {
      return '' + nb;
    },
    array: function(a, lvl) {
      lvl = lvl || 0;

      if (!a.length)
        return '[]';

      var string = '',
          l,
          i;

      for (i = 0, l = a.length; i < l; i++) {
        string += repeatString('  ', lvl);

        if (isPrimitive(a[i])) {
          string += '- ' + processYAMLVariable(a[i]) + '\n';
        }
        else {
          if (isPlainObject(a[i]))
            string += '-' + processYAMLVariable(a[i], lvl + 1, true);
          else
            string += processYAMLVariable(a[i], lvl + 1);
        }
      }

      return string;
    },
    object: function(o, lvl, indent) {
      lvl = lvl || 0;

      if (!Object.keys(o).length)
        return (lvl ? '- ' : '') + '{}';

      var string = '',
          key,
          c = 0,
          i;

      for (i in o) {
        key = yml.string(i);
        string += repeatString('  ', lvl);
        if (indent && !c)
          string = string.slice(0, -1);
        string += key + ': ' + (isNonPrimitive(o[i]) ? '\n' : '') +
          processYAMLVariable(o[i], lvl + 1) + '\n';

        c++;
      }

      return string;
    },
    fn: function(fn) {
      return yml.string(fn.toString());
    },
    boolean: function(v) {
      return '' + v;
    },
    nullValue: function(v) {
      return '~';
    }
  };

  // Get the correct handler corresponding to variable type
  function processYAMLVariable(v, lvl, indent) {

    // Scalars
    if (typeof v === 'string')
      return yml.string(v);
    else if (typeof v === 'number')
      return yml.number(v);
    else if (typeof v === 'boolean')
      return yml.boolean(v);
    else if (typeof v === 'undefined' || v === null || isRealNaN(v))
      return yml.nullValue(v);

    // Nonscalars
    else if (isPlainObject(v))
      return yml.object(v, lvl, indent);
    else if (isArray(v))
      return yml.array(v, lvl);
    else if (typeof v === 'function')
      return yml.fn(v);

    // Error
    else
      throw TypeError('artoo.writers.processYAMLVariable: wrong type.');
  }

  // Converting JavaScript variables to a YAML string
  function toYAMLString(data) {
    return '---\n' + processYAMLVariable(data);
  }


  /**
   * Web Formats
   * ------------
   *
   * Converts JavaScript data into standard web formats such as querystrings.
   */

  function toQueryString(o, fn) {
    if (!isPlainObject(o))
      throw Error('artoo.writers.queryString: wrong arguments.');

    var s = '',
        k;

    for (k in o) {
      s +=
        (s ? '&' : '') +
        k + '=' +
        encodeURIComponent(typeof fn === 'function' ? fn(o[k]) : o[k]);
    }

    return s;
  }

  function toCookie(key, value, params) {
    params = params || {};

    var cookie = key + '=' + encodeURIComponent(value);

    if (params.days) {
      var date = new Date();
      date.setTime(date.getTime() + (params.days * 24 * 60 * 60 * 1000));
      cookie += '; expires=' + date.toGMTString();
    }

    if (params.path)
      cookie += '; path=' + params.path;

    if (params.domain)
      cookie += '; domain=' + params.domain;

    if (params.httpOnly)
      cookie += '; HttpOnly';

    if (params.secure)
      cookie += '; Secure';

    return cookie;
  }


  /**
   * Exporting
   */
  artoo.writers = {
    cookie: toCookie,
    csv: toCSVString,
    queryString: toQueryString,
    yaml: toYAMLString
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo helpers
   * ==============
   *
   * Replacing some helpers by their node.js counterparts.
   */
  var _root = this;

  // False function
  artoo.helpers.isDocument = function(v) {
    return false;
  };

  // Is this a cheerio selector?
  artoo.helpers.isSelector = function(v) {
    return !!(v && v.prototype && v.prototype.cheerio &&
              v.prototype.cheerio === '[cheerio object]') ||
           !!(v._root && v.options && 'normalizeWhitespace' in v.options);
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo scrape methods
   * =====================
   *
   * Some scraping helpers.
   */
  var _root = this,
      extend = artoo.helpers.extend;

  /**
   * Helpers
   */
  function step(o, scope) {
    var $ = artoo.$,
        $sel = o.sel ? $(scope).find(o.sel) : $(scope),
        val;

    // Polymorphism
    if (typeof o === 'function') {
      val = o.call(scope, $);
    }
    else if (typeof o.method === 'function')
      val = o.method.call($sel.get(), $);
    else if (typeof o === 'string') {
      if (typeof $sel[o] === 'function')
        val = $sel[o]();
      else
        val = $sel.attr(o);
    }
    else {
      val = (o.attr !== undefined) ?
        $sel.attr(o.attr) :
        $sel[o.method || 'text']();
    }

    // Default value?
    if (o.defaultValue && !val)
      val = o.defaultValue;

    return val;
  }

  // Scraping function after polymorphism has been taken care of
  function scrape(iterator, data, params, cb) {
    var $ = artoo.$,
        scraped = [],
        loneSelector = !!data.attr || !!data.method || data.scrape ||
                       typeof data === 'string' ||
                       typeof data === 'function';

    params = params || {};

    // Transforming to selector
    var $iterator;
    if (typeof iterator === 'function')
      $iterator = $(iterator($));
    else
      $iterator = $(iterator);

    // Iteration
    $iterator.each(function(i) {
      var item = {},
          p;

      // TODO: figure iteration scope elsewhere for scrape recursivity
      if (loneSelector)
        item = (typeof data === 'object' && 'scrape' in data) ?
          scrape(
            (data.sel ? $(this).find(data.sel) : $(this))
              .find(data.scrape.iterator),
            data.scrape.data,
            data.scrape.params
          ) :
          step(data, this);
      else
        for (p in data) {
          item[p] = (typeof data[p] === 'object' && 'scrape' in data[p]) ?
            scrape(
              (data[p].sel ? $(this).find(data[p].sel) : $(this))
                .find(data[p].scrape.iterator),
              data[p].scrape.data,
              data[p].scrape.params
            ) :
            step(data[p], this);
        }

      scraped.push(item);

      // Breaking if limit i attained
      return !params.limit || i < params.limit - 1;
    });

    scraped = params.one ? scraped[0] : scraped;

    // Triggering callback
    if (typeof cb === 'function')
      cb(scraped);

    // Returning data
    return scraped;
  }

  // Function taking care of harsh polymorphism
  function polymorphism(iterator, data, params, cb) {
    var h = artoo.helpers,
        i, d, p, c;

    if (h.isPlainObject(iterator) &&
        !h.isSelector(iterator) &&
        !h.isDocument(iterator) &&
        (iterator.iterator || iterator.data || iterator.params)) {
      d = iterator.data;
      p = h.isPlainObject(iterator.params) ? iterator.params : {};
      i = iterator.iterator;
    }
    else {
      d = data;
      p = h.isPlainObject(params) ? params : {};
      i = iterator;
    }

    // Default values
    d = d || 'text';

    c = typeof cb === 'function' ? cb :
          typeof params === 'function' ? params :
            p.done;

    return [i, d, p, c];
  }

  /**
   * Public interface
   */
  artoo.scrape = function(iterator, data, params, cb) {
    var args = polymorphism(iterator, data, params, cb);

    // Warn if no iterator or no data
    if (!args[0] || !args[1])
      throw TypeError('artoo.scrape: wrong arguments.');

    return scrape.apply(this, args);
  };

  // Scrape only the first corresponding item
  artoo.scrapeOne = function(iterator, data, params, cb) {
    var args = polymorphism(iterator, data, params, cb);

    // Extending parameters
    args[2] = artoo.helpers.extend(args[2], {limit: 1, one: true});

    return scrape.apply(this, args);
  };

  // Scrape a table
  // TODO: handle different contexts
  // TODO: better header handle
  artoo.scrapeTable = function(root, params, cb) {
    params = params || {};

    var sel = typeof root !== 'string' ? root.selector : root,
        headers;

    if (!params.headers) {
      return artoo.scrape(sel + ' tr:has(td)', {
        scrape: {
          iterator: 'td',
          data: params.data || 'text'
        }
      }, params, cb);
    }
    else {
      var headerType = params.headers.type ||
                       params.headers.method && 'first' ||
                       params.headers,
          headerFn = params.headers.method;

      if (headerType === 'th') {
        headers = artoo.scrape(
          sel + ' th', headerFn || 'text'
        );
      }
      else if (headerType === 'first') {
        headers = artoo.scrape(
          sel + ' tr:has(td):first td',
          headerFn || 'text'
        );
      }
      else if (artoo.helpers.isArray(headerType)) {
        headers = headerType;
      }
      else {
        throw TypeError('artoo.scrapeTable: wrong headers type.');
      }

      // Scraping
      return artoo.scrape(
        sel + ' tr:has(td)' +
        (headerType === 'first' ? ':not(:first)' : ''), function() {
          var o = {};

          headers.forEach(function(h, i) {
            o[h] = step(
              params.data || 'text',
              $(this).find('td:eq(' + i + ')')
            );
          }, this);

          return o;
        }, params, cb);
    }
  };

  /**
   * jQuery plugin
   */
  function _scrape($) {
    var methods = ['scrape', 'scrapeOne', 'scrapeTable'];

    methods.forEach(function(method) {

      $.fn[method] = function() {
        return artoo[method].apply(
          artoo, [$(this)].concat(Array.prototype.slice.call(arguments)));
      };
    });
  }

  // Exporting
  artoo.jquery.plugins.push(_scrape);

}).call(this);

/**
 * artoo node.js require
 * ======================
 *
 * Simply exporting artoo through a node module.
 */
module.exports = artoo;



artoo.$(document).ready(function(){
   alert(0);
});