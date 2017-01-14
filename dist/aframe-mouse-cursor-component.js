/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _lodash = __webpack_require__(1);

	var _lodash2 = _interopRequireDefault(_lodash);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// import checkHeadsetConnected from 'aframe/src/utils/checkHeadsetConnected'

	if (typeof AFRAME === 'undefined') {
	  throw 'Component attempted to register before AFRAME was available.';
	}

	// const IS_VR_AVAILABLE = window.hasNativeWebVRImplementation && checkHeadsetConnected()
	var IS_VR_AVAILABLE = AFRAME.utils.device.isMobile() || window.hasNonPolyfillWebVRSupport;

	/**
	 * Mouse Cursor Component for A-Frame.
	 */
	AFRAME.registerComponent('mouse-cursor', {
	  schema: {},

	  /**
	   * Called once when component is attached. Generally for initial setup.
	   * @protected
	   */
	  init: function init() {
	    this.__raycaster = new THREE.Raycaster();
	    this.__mouse = new THREE.Vector2();
	    this.__isMobile = this.el.sceneEl.isMobile;
	    this.__isStereo = false;
	    this.__active = false;
	    this.__isDown = false;
	    this.__intersectedEl = null;
	    this.__attachEventListeners();
	  },


	  /**
	   * Called when component is attached and when component data changes.
	   * Generally modifies the entity based on the data.
	   * @protected
	   */
	  update: function update(oldData) {},


	  /**
	   * Called when a component is removed (e.g., via removeAttribute).
	   * Generally undoes all modifications to the entity.
	   * @protected
	   */
	  remove: function remove() {
	    this.__removeEventListeners();
	    this.__raycaster = null;
	  },


	  /**
	   * Called on each scene tick.
	   * @protected
	   */
	  // tick (t) { },

	  /**
	   * Called when entity pauses.
	   * Use to stop or remove any dynamic or background behavior such as events.
	   * @protected
	   */
	  pause: function pause() {
	    this.__active = false;
	  },


	  /**
	   * Called when entity resumes.
	   * Use to continue or add any dynamic or background behavior such as events.
	   * @protected
	   */
	  play: function play() {
	    this.__active = true;
	  },


	  /*==============================
	  =            events            =
	  ==============================*/

	  /**
	   * @private
	   */
	  __attachEventListeners: function __attachEventListeners() {
	    var el = this.el;
	    var sceneEl = el.sceneEl;
	    var canvas = sceneEl.canvas;
	    /* if canvas doesn't exist, listen for canvas to load. */

	    if (!canvas) {
	      el.sceneEl.addEventListener('render-target-loaded', this.__attachEventListeners.bind(this));
	      return;
	    }

	    /* scene */
	    sceneEl.addEventListener('enter-vr', this.__onEnterVR.bind(this));
	    sceneEl.addEventListener('exit-vr', this.__onExitVR.bind(this));

	    /* Mouse Events */
	    canvas.addEventListener('mousedown', this.__onDown.bind(this));
	    canvas.addEventListener('mousemove', this.__onMouseMove.bind(this));
	    canvas.addEventListener('mouseup', this.__onRelease.bind(this));
	    canvas.addEventListener('mouseout', this.__onRelease.bind(this));

	    /* Touch events */
	    canvas.addEventListener('touchstart', this.__onDown.bind(this));
	    canvas.addEventListener('touchmove', this.__onTouchMove.bind(this));
	    canvas.addEventListener('touchend', this.__onRelease.bind(this));

	    /* Element component change */
	    el.addEventListener('componentchanged', this.__onComponentChanged.bind(this));
	  },


	  /**
	   * @private
	   */
	  __removeEventListeners: function __removeEventListeners() {
	    var el = this.el;
	    var sceneEl = el.sceneEl;
	    var canvas = sceneEl.canvas;

	    if (!canvas) {
	      return;
	    }

	    /* scene */
	    sceneEl.removeEventListener('enter-vr', this.__onEnterVR.bind(this));
	    sceneEl.removeEventListener('exit-vr', this.__onExitVR.bind(this));

	    /* Mouse Events */
	    canvas.removeEventListener('mousedown', this.__onDown.bind(this));
	    canvas.removeEventListener('mousemove', this.__onMouseMove.bind(this));
	    canvas.removeEventListener('mouseup', this.__onRelease.bind(this));
	    canvas.removeEventListener('mouseout', this.__onRelease.bind(this));

	    /* Touch events */
	    canvas.removeEventListener('touchstart', this.__onDown.bind(this));
	    canvas.removeEventListener('touchmove', this.__onTouchMove.bind(this));
	    canvas.removeEventListener('touchend', this.__onRelease.bind(this));

	    /* Element component change */
	    el.removeEventListener('componentchanged', this.__onComponentChanged.bind(this));
	  },


	  /**
	   * Check if the mouse cursor is active
	   * @private
	   */
	  __isActive: function __isActive() {
	    return !!(this.__active || this.__raycaster);
	  },


	  /**
	   * @private
	   */
	  __onDown: function __onDown(evt) {
	    if (!this.__isActive()) {
	      return;
	    }

	    this.__isDown = true;

	    this.__updateMouse(evt);
	    this.__updateIntersectObject();

	    if (!this.__isMobile) {
	      this.__setInitMousePosition(evt);
	    }
	  },


	  /**
	   * @private
	   */
	  __onRelease: function __onRelease() {
	    if (!this.__isActive()) {
	      return;
	    }

	    /* check if mouse position has updated */
	    if (this.__defMousePosition) {
	      var defX = Math.abs(this.__initMousePosition.x - this.__defMousePosition.x);
	      var defY = Math.abs(this.__initMousePosition.y - this.__defMousePosition.y);
	      var def = Math.max(defX, defY);
	      if (def > 0.04) {
	        /* mouse has moved too much to recognize as click. */
	        this.__isDown = false;
	      }
	    }

	    if (this.__isDown && this.__intersectedEl) {
	      this.__emit('click');
	    }
	    this.__isDown = false;
	    this.__resetMousePosition();
	  },


	  /**
	   * @private
	   */
	  __onMouseMove: function __onMouseMove(evt) {
	    if (!this.__isActive()) {
	      return;
	    }

	    this.__updateMouse(evt);
	    this.__updateIntersectObject();

	    if (this.__isDown) {
	      this.__setMousePosition(evt);
	    }
	  },


	  /**
	   * @private
	   */
	  __onTouchMove: function __onTouchMove(evt) {
	    if (!this.__isActive()) {
	      return;
	    }

	    this.__isDown = false;
	  },


	  /**
	   * @private
	   */
	  __onEnterVR: function __onEnterVR() {
	    if (IS_VR_AVAILABLE) {
	      this.__isStereo = true;
	    }
	  },


	  /**
	   * @private
	   */
	  __onExitVR: function __onExitVR() {
	    this.__isStereo = false;
	  },


	  /**
	   * @private
	   */
	  __onComponentChanged: function __onComponentChanged(evt) {
	    if (evt.detail.name === 'position') {
	      this.__updateIntersectObject();
	    }
	  },


	  /*=============================
	  =            mouse            =
	  =============================*/

	  /**
	   * Get mouse position
	   * @private
	   */
	  __getPosition: function __getPosition(evt) {
	    var _window = window;
	    var w = _window.innerWidth;
	    var h = _window.innerHeight;


	    var cx = void 0,
	        cy = void 0;
	    if (this.__isMobile) {
	      var touches = evt.touches;

	      if (!touches || touches.length !== 1) {
	        return;
	      }
	      var touch = touches[0];
	      cx = touch.pageX;
	      cy = touch.pageY;
	    } else {
	      cx = evt.clientX;
	      cy = evt.clientY;
	    }

	    if (this.__isStereo) {
	      cx = cx % (w / 2) * 2;
	    }

	    var x = cx / w * 2 - 1;
	    var y = -(cy / h) * 2 + 1;

	    return { x: x, y: y };
	  },


	  /**
	   * Update mouse
	   * @private
	   */
	  __updateMouse: function __updateMouse(evt) {
	    var pos = this.__getPosition(evt);
	    if (pos === null) {
	      return;
	    }
	    this.__mouse.x = pos.x;
	    this.__mouse.y = pos.y;
	  },


	  /**
	   * Update mouse position
	   * @private
	   */
	  __setMousePosition: function __setMousePosition(evt) {
	    this.__defMousePosition = this.__getPosition(evt);
	  },


	  /**
	   * Update initial mouse position
	   * @private
	   */
	  __setInitMousePosition: function __setInitMousePosition(evt) {
	    this.__initMousePosition = this.__getPosition(evt);
	  },
	  __resetMousePosition: function __resetMousePosition() {
	    this.__initMousePosition = this.__defMousePosition = null;
	  },


	  /*======================================
	  =            scene children            =
	  ======================================*/

	  /**
	   * Get non group object3D
	   * @private
	   */
	  __getChildren: function __getChildren(object3D) {
	    var _this = this;

	    return object3D.children.map(function (obj) {
	      return obj.type === 'Group' ? _this.__getChildren(obj) : obj;
	    });
	  },


	  /**
	   * Get all non group object3D
	   * @private
	   */
	  __getAllChildren: function __getAllChildren() {
	    var children = this.__getChildren(this.el.sceneEl.object3D);
	    return (0, _lodash2.default)(children);
	  },


	  /*====================================
	  =            intersection            =
	  ====================================*/

	  /**
	   * Update intersect element with cursor
	   * @private
	   */
	  __updateIntersectObject: function __updateIntersectObject() {
	    var __raycaster = this.__raycaster;
	    var el = this.el;
	    var __mouse = this.__mouse;
	    var scene = el.sceneEl.object3D;

	    var camera = this.el.getObject3D('camera');
	    this.__getAllChildren();
	    /* find intersections */
	    // __raycaster.setFromCamera(__mouse, camera) /* this somehow gets error so did the below */
	    __raycaster.ray.origin.setFromMatrixPosition(camera.matrixWorld);
	    __raycaster.ray.direction.set(__mouse.x, __mouse.y, 0.5).unproject(camera).sub(__raycaster.ray.origin).normalize();

	    /* get objects intersected between mouse and camera */
	    var children = this.__getAllChildren();
	    var intersects = __raycaster.intersectObjects(children);

	    if (intersects.length > 0) {
	      /* get the closest three obj */
	      var obj = void 0;
	      intersects.every(function (item) {
	        if (item.object.parent.visible === true) {
	          obj = item.object;
	          return false;
	        } else {
	          return true;
	        }
	      });
	      if (!obj) {
	        this.__clearIntersectObject();
	        return;
	      }
	      /* get the entity */
	      var _el = obj.parent.el;
	      /* only updates if the object is not the activated object */

	      if (this.__intersectedEl === _el) {
	        return;
	      }
	      this.__clearIntersectObject();
	      /* apply new object as intersected */
	      this.__setIntersectObject(_el);
	    } else {
	      this.__clearIntersectObject();
	    }
	  },


	  /**
	   * Set intersect element
	   * @private
	   * @param {AEntity} el `a-entity` element
	   */
	  __setIntersectObject: function __setIntersectObject(el) {

	    this.__intersectedEl = el;
	    if (this.__isMobile) {
	      return;
	    }
	    el.addState('hovered');
	    el.emit('mouseenter');
	    this.el.addState('hovering');
	  },


	  /**
	   * Clear intersect element
	   * @private
	   */
	  __clearIntersectObject: function __clearIntersectObject() {
	    var el = this.__intersectedEl;

	    if (el && !this.__isMobile) {
	      el.removeState('hovered');
	      el.emit('mouseleave');
	      this.el.removeState('hovering');
	    }

	    this.__intersectedEl = null;
	  },


	  /*===============================
	  =            emitter            =
	  ===============================*/

	  /**
	   * @private
	   */
	  __emit: function __emit(evt) {
	    var __intersectedEl = this.__intersectedEl;

	    this.el.emit(evt, { target: __intersectedEl });
	    if (__intersectedEl) {
	      __intersectedEl.emit(evt);
	    }
	  }
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */

	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0,
	    MAX_SAFE_INTEGER = 9007199254740991;

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]';

	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();

	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;

	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;

	/** Built-in value references. */
	var Symbol = root.Symbol,
	    propertyIsEnumerable = objectProto.propertyIsEnumerable,
	    spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : undefined;

	/**
	 * The base implementation of `_.flatten` with support for restricting flattening.
	 *
	 * @private
	 * @param {Array} array The array to flatten.
	 * @param {number} depth The maximum recursion depth.
	 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
	 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
	 * @param {Array} [result=[]] The initial result value.
	 * @returns {Array} Returns the new flattened array.
	 */
	function baseFlatten(array, depth, predicate, isStrict, result) {
	  var index = -1,
	      length = array.length;

	  predicate || (predicate = isFlattenable);
	  result || (result = []);

	  while (++index < length) {
	    var value = array[index];
	    if (depth > 0 && predicate(value)) {
	      if (depth > 1) {
	        // Recursively flatten arrays (susceptible to call stack limits).
	        baseFlatten(value, depth - 1, predicate, isStrict, result);
	      } else {
	        arrayPush(result, value);
	      }
	    } else if (!isStrict) {
	      result[result.length] = value;
	    }
	  }
	  return result;
	}

	/**
	 * Checks if `value` is a flattenable `arguments` object or array.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
	 */
	function isFlattenable(value) {
	  return isArray(value) || isArguments(value) ||
	    !!(spreadableSymbol && value && value[spreadableSymbol]);
	}

	/**
	 * Recursively flattens `array`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Array
	 * @param {Array} array The array to flatten.
	 * @returns {Array} Returns the new flattened array.
	 * @example
	 *
	 * _.flattenDeep([1, [2, [3, [4]], 5]]);
	 * // => [1, 2, 3, 4, 5]
	 */
	function flattenDeep(array) {
	  var length = array ? array.length : 0;
	  return length ? baseFlatten(array, INFINITY) : [];
	}

	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	function isArguments(value) {
	  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
	  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
	    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
	}

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;

	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null && isLength(value.length) && !isFunction(value);
	}

	/**
	 * This method is like `_.isArrayLike` except that it also checks if `value`
	 * is an object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array-like object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArrayLikeObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLikeObject(document.body.children);
	 * // => true
	 *
	 * _.isArrayLikeObject('abc');
	 * // => false
	 *
	 * _.isArrayLikeObject(_.noop);
	 * // => false
	 */
	function isArrayLikeObject(value) {
	  return isObjectLike(value) && isArrayLike(value);
	}

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8-9 which returns 'object' for typed array and other constructors.
	  var tag = isObject(value) ? objectToString.call(value) : '';
	  return tag == funcTag || tag == genTag;
	}

	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' &&
	    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}

	module.exports = flattenDeep;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }
/******/ ]);