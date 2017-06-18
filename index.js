import flattenDeep from 'lodash.flattendeep'

if (typeof AFRAME === 'undefined') {
	throw 'mouse-cursor Component attempted to register before AFRAME was available.'
}

const IS_VR_AVAILABLE = AFRAME.utils.device.isMobile() || window.hasNonPolyfillWebVRSupport

/**
 * Mouse Cursor Component for A-Frame.
 */
AFRAME.registerComponent('mouse-cursor', {
	schema: { },

	/**
	 * Called once when component is attached. Generally for initial setup.
	 * @protected
	 */
	init () {
		this._raycaster = new THREE.Raycaster()
		this._mouse = new THREE.Vector2()
		this._isMobile = this.el.sceneEl.isMobile
		this._isStereo = false
		this._active = false
		this._isDown = false
		this._intersectedEl = null
		this._attachEventListeners()
		this._canvasSize = false
		/* bind functions */
		this.__getCanvasPos = this._getCanvasPos.bind(this)
		this.__getCanvasPos = this._getCanvasPos.bind(this)
		this.__onEnterVR = this._onEnterVR.bind(this)
		this.__onExitVR = this._onExitVR.bind(this)
		this.__onDown = this._onDown.bind(this)
		this.__onClick = this._onClick.bind(this)
		this.__onMouseMove = this._onMouseMove.bind(this)
		this.__onRelease = this._onRelease.bind(this)
		this.__onTouchMove = this._onTouchMove.bind(this)
		this.__onComponentChanged = this._onComponentChanged.bind(this)
	},

	/**
	 * Called when component is attached and when component data changes.
	 * Generally modifies the entity based on the data.
	 * @protected
	 */
	update (oldData) {
	},

	/**
	 * Called when a component is removed (e.g., via removeAttribute).
	 * Generally undoes all modifications to the entity.
	 * @protected
	 */
	remove () {
		this._removeEventListeners()
		this._raycaster = null
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
	pause () {
		this._active = false
	},

	/**
	 * Called when entity resumes.
	 * Use to continue or add any dynamic or background behavior such as events.
	 * @protected
	 */
	play () {
		this._active = true
	},

	/*==============================
	 =            events            =
	 ==============================*/

	/**
	 * @private
	 */
	_attachEventListeners () {
		const { el } = this
		const { sceneEl } = el
		const { canvas } = sceneEl
		/* if canvas doesn't exist, listen for canvas to load. */
		if (!canvas) {
			el.sceneEl.addEventListener('render-target-loaded', this._attachEventListeners.bind(this))
			return
		}

		window.addEventListener('resize', this.__getCanvasPos)
		document.addEventListener('scroll', this.__getCanvasPos)
		/* update _canvas in case scene is embedded */
		this._getCanvasPos()

		/* scene */
		sceneEl.addEventListener('enter-vr', this.__onEnterVR)
		sceneEl.addEventListener('exit-vr', this.__onExitVR)

		/* Mouse events */
		canvas.addEventListener('mousedown', this.__onDown)
		canvas.addEventListener('mousemove', this.__onMouseMove)
		canvas.addEventListener('mouseup', this.__onRelease)
		canvas.addEventListener('mouseout', this.__onRelease)

		/* Touch events */
		canvas.addEventListener('touchstart', this.__onDown)
		canvas.addEventListener('touchmove', this.__onTouchMove)
		canvas.addEventListener('touchend', this.__onRelease)

		/* Click event */
		canvas.addEventListener('click', this.__onClick)

		/* Element component change */
		el.addEventListener('componentchanged', this.__onComponentChanged)

	},

	/**
	 * @private
	 */
	_removeEventListeners () {
		const { el } = this
		const { sceneEl } = el
		const { canvas } = sceneEl
		if (!canvas) { return }

		window.removeEventListener('resize', this.__getCanvasPos)
		document.removeEventListener('scroll', this.__getCanvasPos)

		/* scene */
		sceneEl.removeEventListener('enter-vr', this.__onEnterVR)
		sceneEl.removeEventListener('exit-vr', this.__onExitVR)


		/* Mouse events */
		canvas.removeEventListener('mousedown', this.__onDown)
		canvas.removeEventListener('mousemove', this.__onMouseMove)
		canvas.removeEventListener('mouseup', this.__onRelease)
		canvas.removeEventListener('mouseout', this.__onRelease)

		/* Touch events */
		canvas.removeEventListener('touchstart', this.__onDown)
		canvas.removeEventListener('touchmove', this.__onTouchMove)
		canvas.removeEventListener('touchend', this.__onRelease)

		/* Click event */
		canvas.removeEventListener('click', this.__onClick)

		/* Element component change */
		el.removeEventListener('componentchanged', this.__onComponentChanged)

	},

	/**
	 * Check if the mouse cursor is active
	 * @private
	 */
	_isActive () {
		return !!(this._active || this._raycaster)
	},

	/**
	 * @private
	 */
	_onDown (evt) {
		if (!this._isActive()) { return }

		this._isDown = true

		this._updateMouse(evt)
		this._updateIntersectObject()

		if (!this._isMobile) {
			this._setInitMousePosition(evt)
		}
		if (this._intersectedEl) {
			this._emit('mousedown')
		}
	},

	/**
	 * @private
	 */
	_onClick (evt) {
		if (!this._isActive()) { return }

		this._updateMouse(evt)
		this._updateIntersectObject()

		if (this._intersectedEl) {
			this._emit('click')
		}
	},

	/**
	 * @private
	 */
	_onRelease () {
		if (!this._isActive()) { return }

		/* check if mouse position has updated */
		if (this._defMousePosition) {
			const defX = Math.abs(this._initMousePosition.x - this._defMousePosition.x)
			const defY = Math.abs(this._initMousePosition.y - this._defMousePosition.y)
			const def = Math.max(defX, defY)
			if (def > 0.04) {
				/* mouse has moved too much to recognize as click. */
				this._isDown = false
			}
		}

		if (this._isDown && this._intersectedEl) {
			this._emit('mouseup')
		}
		this._isDown = false
		this._resetMousePosition()
	},

	/**
	 * @private
	 */
	_onMouseMove (evt) {
		if (!this._isActive()) { return }

		this._updateMouse(evt)
		this._updateIntersectObject()

		if (this._isDown) {
			this._setMousePosition(evt)
		}
	},

	/**
	 * @private
	 */
	_onTouchMove (evt) {
		if (!this._isActive()) { return }

		this._isDown = false
	},

	/**
	 * @private
	 */
	_onEnterVR () {
		if (IS_VR_AVAILABLE) {
			this._isStereo = true
		}
		this._getCanvasPos()
	},

	/**
	 * @private
	 */
	_onExitVR () {
		this._isStereo = false
		this._getCanvasPos()

	},

	/**
	 * @private
	 */
	_onComponentChanged (evt) {
		if (evt.detail.name === 'position') {
			this._updateIntersectObject()
		}
	},


	/*=============================
	 =            mouse            =
	 =============================*/


	/**
	 * Get mouse position from size of canvas element
	 * @private
	 */
	_getPosition (evt) {
		const { width: w, height: h, left : offsetW, top : offsetH } = this._canvasSize

		let cx, cy
		if (this._isMobile) {
			const { touches } = evt
			if (!touches || touches.length !== 1) { return }
			const touch = touches[0]
			cx = touch.clientX
			cy = touch.clientY
		}
		else {
			cx = evt.clientX
			cy = evt.clientY
		}

		/* account for the offset if scene is embedded */
		cx = cx - offsetW
		cy = cy - offsetH

		if (this._isStereo) {
			cx = (cx % (w/2)) * 2
		}

		const x = (cx / w) * 2 - 1
		const y = - (cy / h) * 2 + 1

		return { x, y }

	},

	/**
	 * Update mouse
	 * @private
	 */
	_updateMouse (evt) {
		const pos = this._getPosition(evt)
		if (!pos) { return }

		this._mouse.x = pos.x
		this._mouse.y = pos.y
	},


	/**
	 * Update mouse position
	 * @private
	 */
	_setMousePosition (evt) {
		this._defMousePosition = this._getPosition(evt)
	},

	/**
	 * Update initial mouse position
	 * @private
	 */
	_setInitMousePosition (evt) {
		this._initMousePosition = this._getPosition(evt)
	},

	_resetMousePosition () {
		this._initMousePosition = this._defMousePosition = null
	},


	/*======================================
	 =            scene children            =
	 ======================================*/


	/**
	 * @private
	 */
	_getCanvasPos () {
		this._canvasSize = this.el.sceneEl.canvas.getBoundingClientRect() // update _canvas in case scene is embedded
	},

	/**
	 * Get non group object3D
	 * @private
	 */
	_getChildren (object3D) {
		return object3D.children.map(obj => (obj.type === 'Group')? this._getChildren(obj) : obj)
	},

	/**
	 * Get all non group object3D
	 * @private
	 */
	_getAllChildren () {
		const children = this._getChildren(this.el.sceneEl.object3D)
		return flattenDeep(children)
	},

	/*====================================
	 =            intersection            =
	 ====================================*/

	/**
	 * Update intersect element with cursor
	 * @private
	 */
	_updateIntersectObject () {
		const { _raycaster, el, _mouse } = this
		const { object3D: scene } = el.sceneEl
		const camera = this.el.getObject3D('camera')
		this._getAllChildren()
		/* find intersections */
		// _raycaster.setFromCamera(_mouse, camera) /* this somehow gets error so did the below */
		_raycaster.ray.origin.setFromMatrixPosition(camera.matrixWorld)
		_raycaster.ray.direction.set(_mouse.x, _mouse.y, 0.5).unproject(camera).sub(_raycaster.ray.origin).normalize()

		/* get objects intersected between mouse and camera */
		const children = this._getAllChildren()
		const intersects = _raycaster.intersectObjects(children)

		if (intersects.length > 0) {
			/* get the closest three obj */
			let obj
			intersects.every(item => {
				if (item.object.parent.visible === true) {
					obj = item.object
					return false
				}
				else {
					return true
				}
			})
			if (!obj) {
				this._clearIntersectObject()
				return
			}
			/* get the entity */
			const { el } = obj.parent
			/* only updates if the object is not the activated object */
			if (this._intersectedEl === el) { return }
			this._clearIntersectObject()
			/* apply new object as intersected */
			this._setIntersectObject(el)
		}
		else {
			this._clearIntersectObject()
		}
	},

	/**
	 * Set intersect element
	 * @private
	 * @param {AEntity} el `a-entity` element
	 */
	_setIntersectObject (el) {
		this._intersectedEl = el
		if (this._isMobile) { return }
		el.addState('hovered')
		el.emit('mouseenter')
		this.el.addState('hovering')

	},

	/**
	 * Clear intersect element
	 * @private
	 */
	_clearIntersectObject () {
		const { _intersectedEl: el } = this
		if (el && !this._isMobile) {
			el.removeState('hovered')
			el.emit('mouseleave')
			this.el.removeState('hovering')
		}

		this._intersectedEl = null
	},



	/*===============================
	 =            emitter            =
	 ===============================*/

	/**
	 * @private
	 */
	_emit (evt) {
		const { _intersectedEl } = this
		this.el.emit(evt, { target: _intersectedEl })
		if (_intersectedEl) { _intersectedEl.emit(evt) }
	},

})
