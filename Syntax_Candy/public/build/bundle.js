var app = (function () {
	'use strict';

	/** @returns {void} */
	function noop() {}

	/** @returns {void} */
	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	/** @type {typeof globalThis} */
	const globals =
		typeof window !== 'undefined'
			? window
			: typeof globalThis !== 'undefined'
			? globalThis
			: // @ts-ignore Node typings have this
			  global;

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} target
	 * @param {string} style_sheet_id
	 * @param {string} styles
	 * @returns {void}
	 */
	function append_styles(target, style_sheet_id, styles) {
		const append_styles_to = get_root_for_style(target);
		if (!append_styles_to.getElementById(style_sheet_id)) {
			const style = element('style');
			style.id = style_sheet_id;
			style.textContent = styles;
			append_stylesheet(append_styles_to, style);
		}
	}

	/**
	 * @param {Node} node
	 * @returns {ShadowRoot | Document}
	 */
	function get_root_for_style(node) {
		if (!node) return document;
		const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
		if (root && /** @type {ShadowRoot} */ (root).host) {
			return /** @type {ShadowRoot} */ (root);
		}
		return node.ownerDocument;
	}

	/**
	 * @param {ShadowRoot | Document} node
	 * @param {HTMLStyleElement} style
	 * @returns {CSSStyleSheet}
	 */
	function append_stylesheet(node, style) {
		append(/** @type {Document} */ (node).head || node, style);
		return style.sheet;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @returns {void} */
	function set_input_value(input, value) {
		input.value = value == null ? '' : value;
	}

	/**
	 * @returns {void} */
	function set_style(node, key, value, important) {
		if (value == null) {
			node.style.removeProperty(key);
		} else {
			node.style.setProperty(key, value, '');
		}
	}

	/**
	 * @returns {void} */
	function toggle_class(element, name, toggle) {
		// The `!!` is required because an `undefined` flag means flipping the current state.
		element.classList.toggle(name, !!toggle);
	}

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
	 * @returns {CustomEvent<T>}
	 */
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
		return new CustomEvent(type, { detail, bubbles, cancelable });
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
	 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
	 * it can be called from an external module).
	 *
	 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
	 *
	 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
	 *
	 * https://svelte.dev/docs/svelte#onmount
	 * @template T
	 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
	 * @returns {void}
	 */
	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	const outroing = new Set();

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	// TODO: Document the other params
	/**
	 * @param {SvelteComponent} component
	 * @param {import('./public.js').ComponentConstructorOptions} options
	 *
	 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
	 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
	 * This will be the `add_css` function from the compiled component.
	 *
	 * @returns {void}
	 */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles = null,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				// TODO: what is the correct type here?
				// @ts-expect-error
				const nodes = children(options.target);
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	/**
	 * The current version, as set in package.json.
	 *
	 * https://svelte.dev/docs/svelte-compiler#svelte-version
	 * @type {string}
	 */
	const VERSION = '4.2.20';
	const PUBLIC_VERSION = '4';

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @returns {void}
	 */
	function dispatch_dev(type, detail) {
		document.dispatchEvent(custom_event(type, { version: VERSION, ...detail }, { bubbles: true }));
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append_dev(target, node) {
		dispatch_dev('SvelteDOMInsert', { target, node });
		append(target, node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert_dev(target, node, anchor) {
		dispatch_dev('SvelteDOMInsert', { target, node, anchor });
		insert(target, node, anchor);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach_dev(node) {
		dispatch_dev('SvelteDOMRemove', { node });
		detach(node);
	}

	/**
	 * @param {Node} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @param {boolean} [has_prevent_default]
	 * @param {boolean} [has_stop_propagation]
	 * @param {boolean} [has_stop_immediate_propagation]
	 * @returns {() => void}
	 */
	function listen_dev(
		node,
		event,
		handler,
		options,
		has_prevent_default,
		has_stop_propagation,
		has_stop_immediate_propagation
	) {
		const modifiers =
			options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
		if (has_prevent_default) modifiers.push('preventDefault');
		if (has_stop_propagation) modifiers.push('stopPropagation');
		if (has_stop_immediate_propagation) modifiers.push('stopImmediatePropagation');
		dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
		const dispose = listen(node, event, handler, options);
		return () => {
			dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
			dispose();
		};
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr_dev(node, attribute, value) {
		attr(node, attribute, value);
		if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
		else dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
	}

	/**
	 * @param {Element} node
	 * @param {string} property
	 * @param {any} [value]
	 * @returns {void}
	 */
	function prop_dev(node, property, value) {
		node[property] = value;
		dispatch_dev('SvelteDOMSetProperty', { node, property, value });
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data_dev(text, data) {
		data = '' + data;
		if (text.data === data) return;
		dispatch_dev('SvelteDOMSetData', { node: text, data });
		text.data = /** @type {string} */ (data);
	}

	function ensure_array_like_dev(arg) {
		if (
			typeof arg !== 'string' &&
			!(arg && typeof arg === 'object' && 'length' in arg) &&
			!(typeof Symbol === 'function' && arg && Symbol.iterator in arg)
		) {
			throw new Error('{#each} only works with iterable values.');
		}
		return ensure_array_like(arg);
	}

	/**
	 * @returns {void} */
	function validate_slots(name, slot, keys) {
		for (const slot_key of Object.keys(slot)) {
			if (!~keys.indexOf(slot_key)) {
				console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
			}
		}
	}

	/**
	 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
	 *
	 * Can be used to create strongly typed Svelte components.
	 *
	 * #### Example:
	 *
	 * You have component library on npm called `component-library`, from which
	 * you export a component called `MyComponent`. For Svelte+TypeScript users,
	 * you want to provide typings. Therefore you create a `index.d.ts`:
	 * ```ts
	 * import { SvelteComponent } from "svelte";
	 * export class MyComponent extends SvelteComponent<{foo: string}> {}
	 * ```
	 * Typing this makes it possible for IDEs like VS Code with the Svelte extension
	 * to provide intellisense and to use the component like this in a Svelte file
	 * with TypeScript:
	 * ```svelte
	 * <script lang="ts">
	 * 	import { MyComponent } from "component-library";
	 * </script>
	 * <MyComponent foo={'bar'} />
	 * ```
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 * @template {Record<string, any>} [Slots=any]
	 * @extends {SvelteComponent<Props, Events>}
	 */
	class SvelteComponentDev extends SvelteComponent {
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Props}
		 */
		$$prop_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Events}
		 */
		$$events_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Slots}
		 */
		$$slot_def;

		/** @param {import('./public.js').ComponentConstructorOptions<Props>} options */
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error("'target' is a required option");
			}
			super();
		}

		/** @returns {void} */
		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn('Component was already destroyed'); // eslint-disable-line no-console
			};
		}

		/** @returns {void} */
		$capture_state() {}

		/** @returns {void} */
		$inject_state() {}
	}

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	/* src\App.svelte generated by Svelte v4.2.20 */

	const { Object: Object_1 } = globals;
	const file = "src\\App.svelte";

	function add_css(target) {
		append_styles(target, "svelte-19a10sd", ".container.svelte-19a10sd.svelte-19a10sd{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto 1fr 1fr;gap:16px;padding:16px;height:100vh}.header.svelte-19a10sd.svelte-19a10sd{grid-column:1 / -1;display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:rgba(255, 255, 255, 0.05);border-radius:12px;border:1px solid rgba(255, 255, 255, 0.1)}.header.svelte-19a10sd h1.svelte-19a10sd{font-size:24px;background:linear-gradient(90deg, #ff6b6b, #4ecdc4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.preset-buttons.svelte-19a10sd.svelte-19a10sd{display:flex;gap:12px}.preset-btn.svelte-19a10sd.svelte-19a10sd{padding:10px 20px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.3s ease;color:white}.preset-btn.svelte-19a10sd.svelte-19a10sd:hover{transform:translateY(-2px);box-shadow:0 4px 15px rgba(0, 0, 0, 0.3)}.panel.svelte-19a10sd.svelte-19a10sd{background:rgba(255, 255, 255, 0.05);border-radius:12px;border:1px solid rgba(255, 255, 255, 0.1);padding:16px;overflow:hidden}.panel-title.svelte-19a10sd.svelte-19a10sd{font-size:16px;margin-bottom:12px;color:#a0a0a0;display:flex;align-items:center;gap:8px}.panel-title.svelte-19a10sd.svelte-19a10sd::before{content:'';width:4px;height:16px;background:linear-gradient(180deg, #ff6b6b, #4ecdc4);border-radius:2px}.code-editor.svelte-19a10sd.svelte-19a10sd{width:100%;height:calc(100% - 40px);background:#0d1117;border:1px solid rgba(255, 255, 255, 0.1);border-radius:8px;padding:12px;font-family:'Consolas', monospace;font-size:14px;color:#e6edf3;resize:none;outline:none;line-height:1.5}.tokens-container.svelte-19a10sd.svelte-19a10sd{display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:8px;max-height:calc(100% - 40px);overflow-y:auto;padding-right:4px}.token.svelte-19a10sd.svelte-19a10sd{padding:6px 12px;border-radius:6px;font-size:12px;font-family:monospace;transition:all 0.3s ease;position:relative}.token.active.svelte-19a10sd.svelte-19a10sd{animation:svelte-19a10sd-tokenFloat 0.5s ease-in-out;transform:translateY(-10px);box-shadow:0 8px 20px rgba(255, 255, 255, 0.3)}@keyframes svelte-19a10sd-tokenFloat{0%{transform:translateY(0)}50%{transform:translateY(-15px)}100%{transform:translateY(-10px)}}.ast-viewer.svelte-19a10sd.svelte-19a10sd{font-family:monospace;font-size:12px;line-height:1.6;max-height:calc(100% - 40px);overflow-y:auto;white-space:pre-wrap}@keyframes svelte-19a10sd-nodeGrow{0%{opacity:0;transform:scale(0.5)}100%{opacity:1;transform:scale(1)}}.type-arrow.svelte-19a10sd.svelte-19a10sd{margin:8px 0;padding:8px;border-radius:6px;font-size:12px;transition:all 0.3s ease}.type-arrow.visible.svelte-19a10sd.svelte-19a10sd{animation:svelte-19a10sd-arrowPulse 0.5s ease-out}.type-arrow.error.svelte-19a10sd.svelte-19a10sd{background:rgba(255, 107, 107, 0.2);border-left:3px solid #ff6b6b}@keyframes svelte-19a10sd-arrowPulse{0%{opacity:0;transform:translateX(-20px)}100%{opacity:1;transform:translateX(0)}}.error-item.svelte-19a10sd.svelte-19a10sd{padding:10px;margin:8px 0;background:rgba(255, 107, 107, 0.15);border-radius:8px;border-left:4px solid #ff6b6b;font-size:13px;transition:all 0.3s ease;position:relative}.error-item.active.svelte-19a10sd.svelte-19a10sd{animation:svelte-19a10sd-errorWave 0.5s ease-in-out}@keyframes svelte-19a10sd-errorWave{0%,100%{box-shadow:0 0 0 0 rgba(255, 107, 107, 0)}50%{box-shadow:0 0 20px 5px rgba(255, 107, 107, 0.3)}}.error-item.svelte-19a10sd.svelte-19a10sd::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:repeating-linear-gradient(90deg, #ff6b6b, #ff6b6b 8px, transparent 8px, transparent 16px);animation:svelte-19a10sd-waveLine 1s linear infinite}@keyframes svelte-19a10sd-waveLine{0%{background-position:0 0}100%{background-position:16px 0}}.symbol-table.svelte-19a10sd.svelte-19a10sd{max-height:calc(100% - 40px);overflow-y:auto}.symbol-item.svelte-19a10sd.svelte-19a10sd{display:flex;justify-content:space-between;padding:8px 12px;margin:4px 0;background:rgba(255, 255, 255, 0.05);border-radius:6px;font-size:13px}.memory-bar.svelte-19a10sd.svelte-19a10sd{height:24px;background:rgba(255, 255, 255, 0.1);border-radius:12px;overflow:hidden;margin-top:8px}.memory-fill.svelte-19a10sd.svelte-19a10sd{height:100%;background:linear-gradient(90deg, #4ecdc4, #ffe66d, #ff6b6b);transition:width 0.1s ease;border-radius:12px}.memory-warning.svelte-19a10sd.svelte-19a10sd{color:#ff6b6b;font-size:12px;margin-top:4px}.scope-indicator.svelte-19a10sd.svelte-19a10sd{display:flex;gap:4px;margin-top:12px}.scope-level.svelte-19a10sd.svelte-19a10sd{width:20px;height:20px;background:rgba(255, 255, 255, 0.2);border-radius:4px;transition:all 0.3s ease}.scope-level.active.svelte-19a10sd.svelte-19a10sd{background:#4ecdc4;animation:svelte-19a10sd-scopePulse 0.5s ease-out}@keyframes svelte-19a10sd-scopePulse{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}.parse-stack.svelte-19a10sd.svelte-19a10sd{max-height:calc(100% - 40px);overflow-y:auto}.stack-item.svelte-19a10sd.svelte-19a10sd{display:flex;align-items:center;padding:6px 10px;margin:3px 0;background:rgba(255, 255, 255, 0.05);border-radius:4px;font-size:12px;font-family:monospace}.stack-item.error.svelte-19a10sd.svelte-19a10sd{background:rgba(255, 107, 107, 0.2);color:#ff6b6b}.analyze-btn.svelte-19a10sd.svelte-19a10sd{padding:12px 32px;background:linear-gradient(135deg, #ff6b6b, #4ecdc4);border:none;border-radius:8px;color:white;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.3s ease}.analyze-btn.svelte-19a10sd.svelte-19a10sd:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 20px rgba(255, 107, 107, 0.4)}.analyze-btn.svelte-19a10sd.svelte-19a10sd:disabled{opacity:0.5;cursor:not-allowed}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQXBwLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxyXG4gIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG4gIFxyXG4gIGxldCBjb2RlID0gJyc7XHJcbiAgbGV0IHRva2VucyA9IFtdO1xyXG4gIGxldCBhc3QgPSBudWxsO1xyXG4gIGxldCBwYXJzZVN0ZXBzID0gW107XHJcbiAgbGV0IHN5bWJvbFRhYmxlID0ge307XHJcbiAgbGV0IHNlbWFudGljRXJyb3JzID0gW107XHJcbiAgbGV0IHBhcnNlRXJyb3JzID0gW107XHJcbiAgbGV0IGhhc1BhcnNlRXJyb3IgPSBmYWxzZTtcclxuICBsZXQgY3VycmVudFN0ZXAgPSAwO1xyXG4gIGxldCBpc0FuaW1hdGluZyA9IGZhbHNlO1xyXG4gIGxldCBtZW1vcnlVc2FnZSA9IDA7XHJcbiAgbGV0IHNjb3BlRGVwdGggPSAwO1xyXG4gIGxldCBtYXhTY29wZURlcHRoID0gMDtcclxuICBsZXQgcGFyc2VTdGFjayA9IFtdO1xyXG4gIGxldCBhY3RpdmVUb2tlbkluZGV4ID0gLTE7XHJcbiAgbGV0IGdyb3dpbmdOb2RlcyA9IFtdO1xyXG4gIGxldCB0eXBlQXJyb3dzID0gW107XHJcbiAgbGV0IGVycm9yUG9zaXRpb25zID0gW107XHJcbiAgbGV0IGNvbGxhcHNlZE5vZGVzID0gW107XHJcbiAgXHJcbiAgY29uc3QgcHJlc2V0cyA9IFtcclxuICAgIHsgaWQ6ICdwcmVzZXQxJywgbmFtZTogJ+W3pumAkuW9kua2iOmZpCcsIGNvbG9yOiAnI2ZmNmI2YicgfSxcclxuICAgIHsgaWQ6ICdwcmVzZXQyJywgbmFtZTogJ+aCrOepuiBlbHNlJywgY29sb3I6ICcjNGVjZGM0JyB9LFxyXG4gICAgeyBpZDogJ3ByZXNldDMnLCBuYW1lOiAn57G75Z6L5LiN5Yy56YWNJywgY29sb3I6ICcjZmZlNjZkJyB9LFxyXG4gICAgeyBpZDogJ3ByZXNldDQnLCBuYW1lOiAn5L2c55So5Z+f6ZO+5pat6KOCJywgY29sb3I6ICcjYTg1NWY3JyB9XHJcbiAgXTtcclxuICBcclxuICBhc3luYyBmdW5jdGlvbiBsb2FkUHJlc2V0KHByZXNldElkKSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAvYXBpL3ByZXNldC8ke3ByZXNldElkfWApO1xyXG4gICAgY29uc3QgcHJlc2V0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgY29kZSA9IHByZXNldC5jb2RlO1xyXG4gICAgYXdhaXQgYW5hbHl6ZUNvZGUoKTtcclxuICB9XHJcbiAgXHJcbiAgYXN5bmMgZnVuY3Rpb24gYW5hbHl6ZUNvZGUoKSB7XHJcbiAgICBpc0FuaW1hdGluZyA9IHRydWU7XHJcbiAgICBjdXJyZW50U3RlcCA9IDA7XHJcbiAgICB0b2tlbnMgPSBbXTtcclxuICAgIGFzdCA9IG51bGw7XHJcbiAgICBwYXJzZVN0ZXBzID0gW107XHJcbiAgICBzeW1ib2xUYWJsZSA9IHt9O1xyXG4gICAgc2VtYW50aWNFcnJvcnMgPSBbXTtcclxuICAgIHBhcnNlRXJyb3JzID0gW107XHJcbiAgICBoYXNQYXJzZUVycm9yID0gZmFsc2U7XHJcbiAgICBwYXJzZVN0YWNrID0gW107XHJcbiAgICBhY3RpdmVUb2tlbkluZGV4ID0gLTE7XHJcbiAgICBncm93aW5nTm9kZXMgPSBbXTtcclxuICAgIHR5cGVBcnJvd3MgPSBbXTtcclxuICAgIGVycm9yUG9zaXRpb25zID0gW107XHJcbiAgICBjb2xsYXBzZWROb2RlcyA9IFtdO1xyXG4gICAgc2NvcGVEZXB0aCA9IDA7XHJcbiAgICBtYXhTY29wZURlcHRoID0gMDtcclxuICAgIFxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnL2FwaS9hbmFseXplJywge1xyXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc291cmNlOiBjb2RlIH0pXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgdG9rZW5zID0gcmVzdWx0LnRva2VucztcclxuICAgIGFzdCA9IHJlc3VsdC5hc3Q7XHJcbiAgICBwYXJzZVN0ZXBzID0gcmVzdWx0LnBhcnNlU3RlcHM7XHJcbiAgICBzeW1ib2xUYWJsZSA9IHJlc3VsdC5zeW1ib2xUYWJsZTtcclxuICAgIHNlbWFudGljRXJyb3JzID0gcmVzdWx0LnNlbWFudGljRXJyb3JzO1xyXG4gICAgcGFyc2VFcnJvcnMgPSByZXN1bHQucGFyc2VFcnJvcnMgfHwgW107XHJcbiAgICBoYXNQYXJzZUVycm9yID0gcmVzdWx0Lmhhc1BhcnNlRXJyb3IgfHwgZmFsc2U7XHJcbiAgICBwYXJzZVN0YWNrID0gcmVzdWx0LnBhcnNlU3RhY2s7XHJcbiAgICBtYXhTY29wZURlcHRoID0gcmVzdWx0Lm1heFNjb3BlRGVwdGggfHwgMDtcclxuICAgIFxyXG4gICAgYW5pbWF0ZVRva2VucygpO1xyXG4gIH1cclxuICBcclxuICBhc3luYyBmdW5jdGlvbiBhbmltYXRlVG9rZW5zKCkge1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgYWN0aXZlVG9rZW5JbmRleCA9IGk7XHJcbiAgICAgIGF3YWl0IGRlbGF5KDIwMCk7XHJcbiAgICB9XHJcbiAgICBhY3RpdmVUb2tlbkluZGV4ID0gLTE7XHJcbiAgICBhd2FpdCBkZWxheSg1MDApO1xyXG4gICAgYW5pbWF0ZVRyZWUoKTtcclxuICB9XHJcbiAgXHJcbiAgYXN5bmMgZnVuY3Rpb24gYW5pbWF0ZVRyZWUoKSB7XHJcbiAgICBpZiAoIWFzdCkgcmV0dXJuO1xyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBhZGROb2Rlcyhub2RlLCBwYXJlbnRJZCA9IG51bGwsIGRlcHRoID0gMCkge1xyXG4gICAgICBjb25zdCBub2RlSWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgOSk7XHJcbiAgICAgIGdyb3dpbmdOb2Rlcy5wdXNoKHsgaWQ6IG5vZGVJZCwgdHlwZTogbm9kZS50eXBlLCBwYXJlbnRJZCwgZGVwdGggfSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiBhZGROb2RlcyhjaGlsZCwgbm9kZUlkLCBkZXB0aCArIDEpKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobm9kZS5ib2R5KSB7XHJcbiAgICAgICAgbm9kZS5ib2R5LmZvckVhY2goY2hpbGQgPT4gYWRkTm9kZXMoY2hpbGQsIG5vZGVJZCwgZGVwdGggKyAxKSk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG5vZGUubGVmdCkgYWRkTm9kZXMobm9kZS5sZWZ0LCBub2RlSWQsIGRlcHRoICsgMSk7XHJcbiAgICAgIGlmIChub2RlLnJpZ2h0KSBhZGROb2Rlcyhub2RlLnJpZ2h0LCBub2RlSWQsIGRlcHRoICsgMSk7XHJcbiAgICAgIGlmIChub2RlLmlkKSBhZGROb2Rlcyhub2RlLmlkLCBub2RlSWQsIGRlcHRoICsgMSk7XHJcbiAgICAgIGlmIChub2RlLmV4cHJlc3Npb24pIGFkZE5vZGVzKG5vZGUuZXhwcmVzc2lvbiwgbm9kZUlkLCBkZXB0aCArIDEpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBhZGROb2Rlcyhhc3QpO1xyXG4gICAgXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyb3dpbmdOb2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBncm93aW5nTm9kZXNbaV0udmlzaWJsZSA9IHRydWU7XHJcbiAgICAgIGF3YWl0IGRlbGF5KDE1MCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGF3YWl0IGRlbGF5KDUwMCk7XHJcbiAgICBhbmltYXRlVHlwZUluZmVyZW5jZSgpO1xyXG4gIH1cclxuICBcclxuICBhc3luYyBmdW5jdGlvbiBhbmltYXRlVHlwZUluZmVyZW5jZSgpIHtcclxuICAgIHR5cGVBcnJvd3MgPSBbXTtcclxuICAgIFxyXG4gICAgaWYgKHNlbWFudGljRXJyb3JzLmxlbmd0aCA+IDApIHtcclxuICAgICAgc2VtYW50aWNFcnJvcnMuZm9yRWFjaCgoZXJyb3IsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgdHlwZUFycm93cy5wdXNoKHtcclxuICAgICAgICAgIGlkOiBpbmRleCxcclxuICAgICAgICAgIGZyb206IGVycm9yLnR5cGUsXHJcbiAgICAgICAgICB0bzogJ2Vycm9yJyxcclxuICAgICAgICAgIGVycm9yOiB0cnVlLFxyXG4gICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlQXJyb3dzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHR5cGVBcnJvd3NbaV0udmlzaWJsZSA9IHRydWU7XHJcbiAgICAgIGF3YWl0IGRlbGF5KDMwMCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGF3YWl0IGRlbGF5KDUwMCk7XHJcbiAgICBoaWdobGlnaHRFcnJvcnMoKTtcclxuICB9XHJcbiAgXHJcbiAgYXN5bmMgZnVuY3Rpb24gaGlnaGxpZ2h0RXJyb3JzKCkge1xyXG4gICAgY29uc3QgYWxsRXJyb3JzID0gW1xyXG4gICAgICAuLi5wYXJzZUVycm9ycy5tYXAoKGVyciwgaW5kZXgpID0+ICh7XHJcbiAgICAgICAgaWQ6IGBwYXJzZS0ke2luZGV4fWAsXHJcbiAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgdHlwZTogYOivreazlemUmeivrzogJHtlcnIudHlwZX1gLFxyXG4gICAgICAgIGFjdGl2ZTogZmFsc2UsXHJcbiAgICAgICAgaXNQYXJzZUVycm9yOiB0cnVlXHJcbiAgICAgIH0pKSxcclxuICAgICAgLi4uc2VtYW50aWNFcnJvcnMubWFwKChlcnIsIGluZGV4KSA9PiAoe1xyXG4gICAgICAgIGlkOiBgc2VtYW50aWMtJHtpbmRleH1gLFxyXG4gICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlLFxyXG4gICAgICAgIHR5cGU6IGDor63kuYnplJnor686ICR7ZXJyLnR5cGV9YCxcclxuICAgICAgICBhY3RpdmU6IGZhbHNlLFxyXG4gICAgICAgIGlzUGFyc2VFcnJvcjogZmFsc2VcclxuICAgICAgfSkpXHJcbiAgICBdO1xyXG4gICAgXHJcbiAgICBlcnJvclBvc2l0aW9ucyA9IGFsbEVycm9ycztcclxuICAgIFxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlcnJvclBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBlcnJvclBvc2l0aW9uc1tpXS5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICBhd2FpdCBkZWxheSg0MDApO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBhd2FpdCBkZWxheSg1MDApO1xyXG4gICAgc2ltdWxhdGVNZW1vcnlVc2FnZSgpO1xyXG4gIH1cclxuICBcclxuICBhc3luYyBmdW5jdGlvbiBzaW11bGF0ZU1lbW9yeVVzYWdlKCkge1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gMTAwOyBpICs9IDUpIHtcclxuICAgICAgbWVtb3J5VXNhZ2UgPSBpO1xyXG4gICAgICBhd2FpdCBkZWxheSg1MCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGZvciAobGV0IGkgPSAxMDA7IGkgPj0gMzA7IGkgLT0gMykge1xyXG4gICAgICBtZW1vcnlVc2FnZSA9IGk7XHJcbiAgICAgIGF3YWl0IGRlbGF5KDMwKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgYW5pbWF0ZVNjb3BlQ2hhaW4oKTtcclxuICB9XHJcbiAgXHJcbiAgYXN5bmMgZnVuY3Rpb24gYW5pbWF0ZVNjb3BlQ2hhaW4oKSB7XHJcbiAgICBzY29wZURlcHRoID0gMDtcclxuICAgIFxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbWF4U2NvcGVEZXB0aDsgaSsrKSB7XHJcbiAgICAgIHNjb3BlRGVwdGggPSBpO1xyXG4gICAgICBhd2FpdCBkZWxheSgyMDApO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBhd2FpdCBkZWxheSgxMDAwKTtcclxuICAgIGFuaW1hdGVDb2xsYXBzZSgpO1xyXG4gIH1cclxuICBcclxuICBhc3luYyBmdW5jdGlvbiBhbmltYXRlQ29sbGFwc2UoKSB7XHJcbiAgICBjb25zdCBub2RlcyA9IGdyb3dpbmdOb2Rlcy5maWx0ZXIobiA9PiBuLmRlcHRoID4gMik7XHJcbiAgICBcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDIpIHtcclxuICAgICAgY29sbGFwc2VkTm9kZXMucHVzaChub2Rlc1tpXS5pZCk7XHJcbiAgICAgIGF3YWl0IGRlbGF5KDE1MCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlzQW5pbWF0aW5nID0gZmFsc2U7XHJcbiAgfVxyXG4gIFxyXG4gIGZ1bmN0aW9uIGRlbGF5KG1zKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XHJcbiAgfVxyXG4gIFxyXG4gIGZ1bmN0aW9uIGdldFRva2VuQ29sb3IodHlwZSkge1xyXG4gICAgY29uc3QgY29sb3JzID0ge1xyXG4gICAgICBLRVlXT1JEOiAnI2ZmNmI2YicsXHJcbiAgICAgIFRZUEU6ICcjNGVjZGM0JyxcclxuICAgICAgSURFTlRJRklFUjogJyNmZmU2NmQnLFxyXG4gICAgICBOVU1CRVI6ICcjYTg1NWY3JyxcclxuICAgICAgU1RSSU5HOiAnIzIwZTA4MCcsXHJcbiAgICAgIE9QRVJBVE9SOiAnI2ZmOGM0MicsXHJcbiAgICAgIERFTElNSVRFUjogJyM5NDk0OTQnLFxyXG4gICAgICBFUlJPUjogJyNmZjAwMDAnXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIGNvbG9yc1t0eXBlXSB8fCAnI2ZmZmZmZic7XHJcbiAgfVxyXG4gIFxyXG4gIGZ1bmN0aW9uIGZvcm1hdEFTVChub2RlLCBpbmRlbnQgPSAwKSB7XHJcbiAgICBpZiAoIW5vZGUpIHJldHVybiAnJztcclxuICAgIFxyXG4gICAgY29uc3QgcHJlZml4ID0gJyAgJy5yZXBlYXQoaW5kZW50KTtcclxuICAgIGxldCByZXN1bHQgPSBgJHtwcmVmaXh9JHtub2RlLnR5cGV9YDtcclxuICAgIFxyXG4gICAgaWYgKG5vZGUubmFtZSkgcmVzdWx0ICs9IGA6ICR7bm9kZS5uYW1lfWA7XHJcbiAgICBpZiAobm9kZS52YWx1ZSAhPT0gdW5kZWZpbmVkKSByZXN1bHQgKz0gYCA9ICR7bm9kZS52YWx1ZX1gO1xyXG4gICAgaWYgKG5vZGUub3BlcmF0b3IpIHJlc3VsdCArPSBgICR7bm9kZS5vcGVyYXRvcn1gO1xyXG4gICAgXHJcbiAgICByZXN1bHQgKz0gJ1xcbic7XHJcbiAgICBcclxuICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XHJcbiAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICAgICAgcmVzdWx0ICs9IGZvcm1hdEFTVChjaGlsZCwgaW5kZW50ICsgMSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKG5vZGUuYm9keSkge1xyXG4gICAgICBub2RlLmJvZHkuZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICAgICAgcmVzdWx0ICs9IGZvcm1hdEFTVChjaGlsZCwgaW5kZW50ICsgMSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKG5vZGUubGVmdCkgcmVzdWx0ICs9IGZvcm1hdEFTVChub2RlLmxlZnQsIGluZGVudCArIDEpO1xyXG4gICAgaWYgKG5vZGUucmlnaHQpIHJlc3VsdCArPSBmb3JtYXRBU1Qobm9kZS5yaWdodCwgaW5kZW50ICsgMSk7XHJcbiAgICBpZiAobm9kZS5pZCkgcmVzdWx0ICs9IGZvcm1hdEFTVChub2RlLmlkLCBpbmRlbnQgKyAxKTtcclxuICAgIGlmIChub2RlLmV4cHJlc3Npb24pIHJlc3VsdCArPSBmb3JtYXRBU1Qobm9kZS5leHByZXNzaW9uLCBpbmRlbnQgKyAxKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcbiAgXHJcbiAgb25Nb3VudChhc3luYyAoKSA9PiB7XHJcbiAgICBhd2FpdCBmZXRjaCgnL2FwaS9wcmVzZXRzJyk7XHJcbiAgfSk7XHJcbjwvc2NyaXB0PlxyXG5cclxuPHN0eWxlPlxyXG4gIC5jb250YWluZXIge1xyXG4gICAgZGlzcGxheTogZ3JpZDtcclxuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDFmcjtcclxuICAgIGdyaWQtdGVtcGxhdGUtcm93czogYXV0byAxZnIgMWZyO1xyXG4gICAgZ2FwOiAxNnB4O1xyXG4gICAgcGFkZGluZzogMTZweDtcclxuICAgIGhlaWdodDogMTAwdmg7XHJcbiAgfVxyXG4gIFxyXG4gIC5oZWFkZXIge1xyXG4gICAgZ3JpZC1jb2x1bW46IDEgLyAtMTtcclxuICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XHJcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAgcGFkZGluZzogMTZweCAyNHB4O1xyXG4gICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcclxuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XHJcbiAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSk7XHJcbiAgfVxyXG4gIFxyXG4gIC5oZWFkZXIgaDEge1xyXG4gICAgZm9udC1zaXplOiAyNHB4O1xyXG4gICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDkwZGVnLCAjZmY2YjZiLCAjNGVjZGM0KTtcclxuICAgIC13ZWJraXQtYmFja2dyb3VuZC1jbGlwOiB0ZXh0O1xyXG4gICAgLXdlYmtpdC10ZXh0LWZpbGwtY29sb3I6IHRyYW5zcGFyZW50O1xyXG4gICAgYmFja2dyb3VuZC1jbGlwOiB0ZXh0O1xyXG4gIH1cclxuICBcclxuICAucHJlc2V0LWJ1dHRvbnMge1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGdhcDogMTJweDtcclxuICB9XHJcbiAgXHJcbiAgLnByZXNldC1idG4ge1xyXG4gICAgcGFkZGluZzogMTBweCAyMHB4O1xyXG4gICAgYm9yZGVyOiBub25lO1xyXG4gICAgYm9yZGVyLXJhZGl1czogOHB4O1xyXG4gICAgZm9udC1zaXplOiAxNHB4O1xyXG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcclxuICAgIGN1cnNvcjogcG9pbnRlcjtcclxuICAgIHRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2U7XHJcbiAgICBjb2xvcjogd2hpdGU7XHJcbiAgfVxyXG4gIFxyXG4gIC5wcmVzZXQtYnRuOmhvdmVyIHtcclxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtMnB4KTtcclxuICAgIGJveC1zaGFkb3c6IDAgNHB4IDE1cHggcmdiYSgwLCAwLCAwLCAwLjMpO1xyXG4gIH1cclxuICBcclxuICAucGFuZWwge1xyXG4gICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcclxuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XHJcbiAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSk7XHJcbiAgICBwYWRkaW5nOiAxNnB4O1xyXG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcclxuICB9XHJcbiAgXHJcbiAgLnBhbmVsLXRpdGxlIHtcclxuICAgIGZvbnQtc2l6ZTogMTZweDtcclxuICAgIG1hcmdpbi1ib3R0b206IDEycHg7XHJcbiAgICBjb2xvcjogI2EwYTBhMDtcclxuICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAgZ2FwOiA4cHg7XHJcbiAgfVxyXG4gIFxyXG4gIC5wYW5lbC10aXRsZTo6YmVmb3JlIHtcclxuICAgIGNvbnRlbnQ6ICcnO1xyXG4gICAgd2lkdGg6IDRweDtcclxuICAgIGhlaWdodDogMTZweDtcclxuICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCgxODBkZWcsICNmZjZiNmIsICM0ZWNkYzQpO1xyXG4gICAgYm9yZGVyLXJhZGl1czogMnB4O1xyXG4gIH1cclxuICBcclxuICAuY29kZS1lZGl0b3Ige1xyXG4gICAgd2lkdGg6IDEwMCU7XHJcbiAgICBoZWlnaHQ6IGNhbGMoMTAwJSAtIDQwcHgpO1xyXG4gICAgYmFja2dyb3VuZDogIzBkMTExNztcclxuICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcclxuICAgIGJvcmRlci1yYWRpdXM6IDhweDtcclxuICAgIHBhZGRpbmc6IDEycHg7XHJcbiAgICBmb250LWZhbWlseTogJ0NvbnNvbGFzJywgbW9ub3NwYWNlO1xyXG4gICAgZm9udC1zaXplOiAxNHB4O1xyXG4gICAgY29sb3I6ICNlNmVkZjM7XHJcbiAgICByZXNpemU6IG5vbmU7XHJcbiAgICBvdXRsaW5lOiBub25lO1xyXG4gICAgbGluZS1oZWlnaHQ6IDEuNTtcclxuICB9XHJcbiAgXHJcbiAgLnRva2Vucy1jb250YWluZXIge1xyXG4gICAgZGlzcGxheTogZ3JpZDtcclxuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZmlsbCwgbWlubWF4KDE0MHB4LCAxZnIpKTtcclxuICAgIGdhcDogOHB4O1xyXG4gICAgbWF4LWhlaWdodDogY2FsYygxMDAlIC0gNDBweCk7XHJcbiAgICBvdmVyZmxvdy15OiBhdXRvO1xyXG4gICAgcGFkZGluZy1yaWdodDogNHB4O1xyXG4gIH1cclxuICBcclxuICAudG9rZW4ge1xyXG4gICAgcGFkZGluZzogNnB4IDEycHg7XHJcbiAgICBib3JkZXItcmFkaXVzOiA2cHg7XHJcbiAgICBmb250LXNpemU6IDEycHg7XHJcbiAgICBmb250LWZhbWlseTogbW9ub3NwYWNlO1xyXG4gICAgdHJhbnNpdGlvbjogYWxsIDAuM3MgZWFzZTtcclxuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICB9XHJcbiAgXHJcbiAgLnRva2VuLmFjdGl2ZSB7XHJcbiAgICBhbmltYXRpb246IHRva2VuRmxvYXQgMC41cyBlYXNlLWluLW91dDtcclxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtMTBweCk7XHJcbiAgICBib3gtc2hhZG93OiAwIDhweCAyMHB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4zKTtcclxuICB9XHJcbiAgXHJcbiAgQGtleWZyYW1lcyB0b2tlbkZsb2F0IHtcclxuICAgIDAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApOyB9XHJcbiAgICA1MCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTE1cHgpOyB9XHJcbiAgICAxMDAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0xMHB4KTsgfVxyXG4gIH1cclxuICBcclxuICAuYXN0LXZpZXdlciB7XHJcbiAgICBmb250LWZhbWlseTogbW9ub3NwYWNlO1xyXG4gICAgZm9udC1zaXplOiAxMnB4O1xyXG4gICAgbGluZS1oZWlnaHQ6IDEuNjtcclxuICAgIG1heC1oZWlnaHQ6IGNhbGMoMTAwJSAtIDQwcHgpO1xyXG4gICAgb3ZlcmZsb3cteTogYXV0bztcclxuICAgIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcclxuICB9XHJcbiAgXHJcbiAgLmFzdC1ub2RlIHtcclxuICAgIHRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2U7XHJcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbiAgfVxyXG4gIFxyXG4gIC5hc3Qtbm9kZS5ncm93aW5nIHtcclxuICAgIGFuaW1hdGlvbjogbm9kZUdyb3cgMC4zcyBlYXNlLW91dDtcclxuICAgIGNvbG9yOiAjNGVjZGM0O1xyXG4gIH1cclxuICBcclxuICBAa2V5ZnJhbWVzIG5vZGVHcm93IHtcclxuICAgIDAlIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiBzY2FsZSgwLjUpOyB9XHJcbiAgICAxMDAlIHsgb3BhY2l0eTogMTsgdHJhbnNmb3JtOiBzY2FsZSgxKTsgfVxyXG4gIH1cclxuICBcclxuICAuYXN0LW5vZGUuY29sbGFwc2VkIHtcclxuICAgIG9wYWNpdHk6IDAuMztcclxuICB9XHJcbiAgXHJcbiAgLnR5cGUtYXJyb3cge1xyXG4gICAgbWFyZ2luOiA4cHggMDtcclxuICAgIHBhZGRpbmc6IDhweDtcclxuICAgIGJvcmRlci1yYWRpdXM6IDZweDtcclxuICAgIGZvbnQtc2l6ZTogMTJweDtcclxuICAgIHRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2U7XHJcbiAgfVxyXG4gIFxyXG4gIC50eXBlLWFycm93LnZpc2libGUge1xyXG4gICAgYW5pbWF0aW9uOiBhcnJvd1B1bHNlIDAuNXMgZWFzZS1vdXQ7XHJcbiAgfVxyXG4gIFxyXG4gIC50eXBlLWFycm93LmVycm9yIHtcclxuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAxMDcsIDEwNywgMC4yKTtcclxuICAgIGJvcmRlci1sZWZ0OiAzcHggc29saWQgI2ZmNmI2YjtcclxuICB9XHJcbiAgXHJcbiAgQGtleWZyYW1lcyBhcnJvd1B1bHNlIHtcclxuICAgIDAlIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC0yMHB4KTsgfVxyXG4gICAgMTAwJSB7IG9wYWNpdHk6IDE7IHRyYW5zZm9ybTogdHJhbnNsYXRlWCgwKTsgfVxyXG4gIH1cclxuICBcclxuICAuZXJyb3ItaXRlbSB7XHJcbiAgICBwYWRkaW5nOiAxMHB4O1xyXG4gICAgbWFyZ2luOiA4cHggMDtcclxuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAxMDcsIDEwNywgMC4xNSk7XHJcbiAgICBib3JkZXItcmFkaXVzOiA4cHg7XHJcbiAgICBib3JkZXItbGVmdDogNHB4IHNvbGlkICNmZjZiNmI7XHJcbiAgICBmb250LXNpemU6IDEzcHg7XHJcbiAgICB0cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlO1xyXG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG4gIH1cclxuICBcclxuICAuZXJyb3ItaXRlbS5hY3RpdmUge1xyXG4gICAgYW5pbWF0aW9uOiBlcnJvcldhdmUgMC41cyBlYXNlLWluLW91dDtcclxuICB9XHJcbiAgXHJcbiAgQGtleWZyYW1lcyBlcnJvcldhdmUge1xyXG4gICAgMCUsIDEwMCUgeyBib3gtc2hhZG93OiAwIDAgMCAwIHJnYmEoMjU1LCAxMDcsIDEwNywgMCk7IH1cclxuICAgIDUwJSB7IGJveC1zaGFkb3c6IDAgMCAyMHB4IDVweCByZ2JhKDI1NSwgMTA3LCAxMDcsIDAuMyk7IH1cclxuICB9XHJcbiAgXHJcbiAgLmVycm9yLWl0ZW06OmFmdGVyIHtcclxuICAgIGNvbnRlbnQ6ICcnO1xyXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgYm90dG9tOiAwO1xyXG4gICAgbGVmdDogMDtcclxuICAgIHJpZ2h0OiAwO1xyXG4gICAgaGVpZ2h0OiAycHg7XHJcbiAgICBiYWNrZ3JvdW5kOiByZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDkwZGVnLCAjZmY2YjZiLCAjZmY2YjZiIDhweCwgdHJhbnNwYXJlbnQgOHB4LCB0cmFuc3BhcmVudCAxNnB4KTtcclxuICAgIGFuaW1hdGlvbjogd2F2ZUxpbmUgMXMgbGluZWFyIGluZmluaXRlO1xyXG4gIH1cclxuICBcclxuICBAa2V5ZnJhbWVzIHdhdmVMaW5lIHtcclxuICAgIDAlIHsgYmFja2dyb3VuZC1wb3NpdGlvbjogMCAwOyB9XHJcbiAgICAxMDAlIHsgYmFja2dyb3VuZC1wb3NpdGlvbjogMTZweCAwOyB9XHJcbiAgfVxyXG4gIFxyXG4gIC5zeW1ib2wtdGFibGUge1xyXG4gICAgbWF4LWhlaWdodDogY2FsYygxMDAlIC0gNDBweCk7XHJcbiAgICBvdmVyZmxvdy15OiBhdXRvO1xyXG4gIH1cclxuICBcclxuICAuc3ltYm9sLWl0ZW0ge1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcclxuICAgIHBhZGRpbmc6IDhweCAxMnB4O1xyXG4gICAgbWFyZ2luOiA0cHggMDtcclxuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XHJcbiAgICBib3JkZXItcmFkaXVzOiA2cHg7XHJcbiAgICBmb250LXNpemU6IDEzcHg7XHJcbiAgfVxyXG4gIFxyXG4gIC5tZW1vcnktYmFyIHtcclxuICAgIGhlaWdodDogMjRweDtcclxuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcclxuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XHJcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xyXG4gICAgbWFyZ2luLXRvcDogOHB4O1xyXG4gIH1cclxuICBcclxuICAubWVtb3J5LWZpbGwge1xyXG4gICAgaGVpZ2h0OiAxMDAlO1xyXG4gICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDkwZGVnLCAjNGVjZGM0LCAjZmZlNjZkLCAjZmY2YjZiKTtcclxuICAgIHRyYW5zaXRpb246IHdpZHRoIDAuMXMgZWFzZTtcclxuICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XHJcbiAgfVxyXG4gIFxyXG4gIC5tZW1vcnktd2FybmluZyB7XHJcbiAgICBjb2xvcjogI2ZmNmI2YjtcclxuICAgIGZvbnQtc2l6ZTogMTJweDtcclxuICAgIG1hcmdpbi10b3A6IDRweDtcclxuICB9XHJcbiAgXHJcbiAgLnNjb3BlLWluZGljYXRvciB7XHJcbiAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgZ2FwOiA0cHg7XHJcbiAgICBtYXJnaW4tdG9wOiAxMnB4O1xyXG4gIH1cclxuICBcclxuICAuc2NvcGUtbGV2ZWwge1xyXG4gICAgd2lkdGg6IDIwcHg7XHJcbiAgICBoZWlnaHQ6IDIwcHg7XHJcbiAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XHJcbiAgICBib3JkZXItcmFkaXVzOiA0cHg7XHJcbiAgICB0cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlO1xyXG4gIH1cclxuICBcclxuICAuc2NvcGUtbGV2ZWwuYWN0aXZlIHtcclxuICAgIGJhY2tncm91bmQ6ICM0ZWNkYzQ7XHJcbiAgICBhbmltYXRpb246IHNjb3BlUHVsc2UgMC41cyBlYXNlLW91dDtcclxuICB9XHJcbiAgXHJcbiAgQGtleWZyYW1lcyBzY29wZVB1bHNlIHtcclxuICAgIDAlIHsgdHJhbnNmb3JtOiBzY2FsZSgwKTsgfVxyXG4gICAgNTAlIHsgdHJhbnNmb3JtOiBzY2FsZSgxLjIpOyB9XHJcbiAgICAxMDAlIHsgdHJhbnNmb3JtOiBzY2FsZSgxKTsgfVxyXG4gIH1cclxuICBcclxuICAucGFyc2Utc3RhY2sge1xyXG4gICAgbWF4LWhlaWdodDogY2FsYygxMDAlIC0gNDBweCk7XHJcbiAgICBvdmVyZmxvdy15OiBhdXRvO1xyXG4gIH1cclxuICBcclxuICAuc3RhY2staXRlbSB7XHJcbiAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcclxuICAgIHBhZGRpbmc6IDZweCAxMHB4O1xyXG4gICAgbWFyZ2luOiAzcHggMDtcclxuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XHJcbiAgICBib3JkZXItcmFkaXVzOiA0cHg7XHJcbiAgICBmb250LXNpemU6IDEycHg7XHJcbiAgICBmb250LWZhbWlseTogbW9ub3NwYWNlO1xyXG4gIH1cclxuICBcclxuICAuc3RhY2staXRlbS5lcnJvciB7XHJcbiAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMTA3LCAxMDcsIDAuMik7XHJcbiAgICBjb2xvcjogI2ZmNmI2YjtcclxuICB9XHJcbiAgXHJcbiAgLmFuYWx5emUtYnRuIHtcclxuICAgIHBhZGRpbmc6IDEycHggMzJweDtcclxuICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCgxMzVkZWcsICNmZjZiNmIsICM0ZWNkYzQpO1xyXG4gICAgYm9yZGVyOiBub25lO1xyXG4gICAgYm9yZGVyLXJhZGl1czogOHB4O1xyXG4gICAgY29sb3I6IHdoaXRlO1xyXG4gICAgZm9udC1zaXplOiAxNHB4O1xyXG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcclxuICAgIGN1cnNvcjogcG9pbnRlcjtcclxuICAgIHRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2U7XHJcbiAgfVxyXG4gIFxyXG4gIC5hbmFseXplLWJ0bjpob3Zlcjpub3QoOmRpc2FibGVkKSB7XHJcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTJweCk7XHJcbiAgICBib3gtc2hhZG93OiAwIDZweCAyMHB4IHJnYmEoMjU1LCAxMDcsIDEwNywgMC40KTtcclxuICB9XHJcbiAgXHJcbiAgLmFuYWx5emUtYnRuOmRpc2FibGVkIHtcclxuICAgIG9wYWNpdHk6IDAuNTtcclxuICAgIGN1cnNvcjogbm90LWFsbG93ZWQ7XHJcbiAgfVxyXG48L3N0eWxlPlxyXG5cclxuPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxyXG4gIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cclxuICAgIDxoMT7nvJbor5HlmajliY3nq6/lj6/op4bljJblt6Xlhbc8L2gxPlxyXG4gICAgPGRpdiBjbGFzcz1cInByZXNldC1idXR0b25zXCI+XHJcbiAgICAgIHsjZWFjaCBwcmVzZXRzIGFzIHByZXNldH1cclxuICAgICAgICA8YnV0dG9uIFxyXG4gICAgICAgICAgY2xhc3M9XCJwcmVzZXQtYnRuXCIgXHJcbiAgICAgICAgICBzdHlsZT1cImJhY2tncm91bmQ6IHtwcmVzZXQuY29sb3J9O1wiXHJcbiAgICAgICAgICBvbjpjbGljaz17KCkgPT4gbG9hZFByZXNldChwcmVzZXQuaWQpfVxyXG4gICAgICAgID5cclxuICAgICAgICAgIHtwcmVzZXQubmFtZX1cclxuICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgey9lYWNofVxyXG4gICAgICA8YnV0dG9uIFxyXG4gICAgICAgIGNsYXNzPVwiYW5hbHl6ZS1idG5cIiBcclxuICAgICAgICBvbjpjbGljaz17YW5hbHl6ZUNvZGV9XHJcbiAgICAgICAgZGlzYWJsZWQ9e2lzQW5pbWF0aW5nIHx8ICFjb2RlLnRyaW0oKX1cclxuICAgICAgPlxyXG4gICAgICAgIHtpc0FuaW1hdGluZyA/ICfliIbmnpDkuK0uLi4nIDogJ+W8gOWni+WIhuaekCd9XHJcbiAgICAgIDwvYnV0dG9uPlxyXG4gICAgPC9kaXY+XHJcbiAgPC9kaXY+XHJcbiAgXHJcbiAgPGRpdiBjbGFzcz1cInBhbmVsXCI+XHJcbiAgICA8ZGl2IGNsYXNzPVwicGFuZWwtdGl0bGVcIj7ku6PnoIHnvJbovpHlmag8L2Rpdj5cclxuICAgIDx0ZXh0YXJlYSBcclxuICAgICAgY2xhc3M9XCJjb2RlLWVkaXRvclwiIFxyXG4gICAgICBiaW5kOnZhbHVlPXtjb2RlfVxyXG4gICAgICBwbGFjZWhvbGRlcj1cIuWcqOatpOi+k+WFpea6kOS7o+eggS4uLlwiXHJcbiAgICAvPlxyXG4gIDwvZGl2PlxyXG4gIFxyXG4gIDxkaXYgY2xhc3M9XCJwYW5lbFwiPlxyXG4gICAgPGRpdiBjbGFzcz1cInBhbmVsLXRpdGxlXCI+6K+N5rOV5YiG5p6QIC0g5Luk54mM5rWBPC9kaXY+XHJcbiAgICA8ZGl2IGNsYXNzPVwidG9rZW5zLWNvbnRhaW5lclwiPlxyXG4gICAgICB7I2VhY2ggdG9rZW5zIGFzIHRva2VuLCBpbmRleH1cclxuICAgICAgICA8ZGl2IFxyXG4gICAgICAgICAgY2xhc3M9XCJ0b2tlblwiIFxyXG4gICAgICAgICAgY2xhc3M6YWN0aXZlPXtpbmRleCA9PT0gYWN0aXZlVG9rZW5JbmRleH1cclxuICAgICAgICAgIHN0eWxlPVwiYmFja2dyb3VuZDoge2dldFRva2VuQ29sb3IodG9rZW4udHlwZSl9MjA7IGNvbG9yOiB7Z2V0VG9rZW5Db2xvcih0b2tlbi50eXBlKX07IGJvcmRlcjogMXB4IHNvbGlkIHtnZXRUb2tlbkNvbG9yKHRva2VuLnR5cGUpfTQwO1wiXHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0b2tlbi10eXBlXCI+e3Rva2VuLnR5cGV9PC9zcGFuPlxyXG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0b2tlbi12YWx1ZVwiPlwie3Rva2VuLnZhbHVlfVwiPC9zcGFuPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICB7L2VhY2h9XHJcbiAgICA8L2Rpdj5cclxuICA8L2Rpdj5cclxuICBcclxuICA8ZGl2IGNsYXNzPVwicGFuZWxcIj5cclxuICAgIDxkaXYgY2xhc3M9XCJwYW5lbC10aXRsZVwiPuivreazleWIhuaekCAtIOaKveixoeivreazleagkTwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cImFzdC12aWV3ZXJcIj5cclxuICAgICAgeyNpZiBhc3R9XHJcbiAgICAgICAge2Zvcm1hdEFTVChhc3QpfVxyXG4gICAgICB7OmVsc2V9XHJcbiAgICAgICAg562J5b6F5YiG5p6QLi4uXHJcbiAgICAgIHsvaWZ9XHJcbiAgICA8L2Rpdj5cclxuICA8L2Rpdj5cclxuICBcclxuICA8ZGl2IGNsYXNzPVwicGFuZWxcIj5cclxuICAgIDxkaXYgY2xhc3M9XCJwYW5lbC10aXRsZVwiPuivreS5ieWIhuaekCAtIOexu+Wei+aOqOaWrTwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cInR5cGUtYXJyb3dzXCI+XHJcbiAgICAgIHsjZWFjaCB0eXBlQXJyb3dzIGFzIGFycm93fVxyXG4gICAgICAgIDxkaXYgXHJcbiAgICAgICAgICBjbGFzcz1cInR5cGUtYXJyb3dcIiBcclxuICAgICAgICAgIGNsYXNzOnZpc2libGU9e2Fycm93LnZpc2libGV9XHJcbiAgICAgICAgICBjbGFzczplcnJvcj17YXJyb3cuZXJyb3J9XHJcbiAgICAgICAgPlxyXG4gICAgICAgICAge2Fycm93Lm1lc3NhZ2V9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIHsvZWFjaH1cclxuICAgICAgeyNpZiB0eXBlQXJyb3dzLmxlbmd0aCA9PT0gMCAmJiAhaXNBbmltYXRpbmcgJiYgY29kZX1cclxuICAgICAgICA8cCBzdHlsZT1cImNvbG9yOiAjNGVjZGM0O1wiPuexu+Wei+ajgOafpemAmui/hzwvcD5cclxuICAgICAgey9pZn1cclxuICAgIDwvZGl2PlxyXG4gIDwvZGl2PlxyXG4gIFxyXG4gIDxkaXYgY2xhc3M9XCJwYW5lbFwiPlxyXG4gICAgPGRpdiBjbGFzcz1cInBhbmVsLXRpdGxlXCI+6ZSZ6K+v5qCH6K6wPC9kaXY+XHJcbiAgICA8ZGl2IGNsYXNzPVwiZXJyb3JzLWNvbnRhaW5lclwiPlxyXG4gICAgICB7I2VhY2ggZXJyb3JQb3NpdGlvbnMgYXMgZXJyb3J9XHJcbiAgICAgICAgPGRpdiBcclxuICAgICAgICAgIGNsYXNzPVwiZXJyb3ItaXRlbVwiIFxyXG4gICAgICAgICAgY2xhc3M6YWN0aXZlPXtlcnJvci5hY3RpdmV9XHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPHN0cm9uZz57ZXJyb3IudHlwZX06PC9zdHJvbmc+IHtlcnJvci5tZXNzYWdlfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICB7L2VhY2h9XHJcbiAgICAgIHsjaWYgZXJyb3JQb3NpdGlvbnMubGVuZ3RoID09PSAwICYmICFpc0FuaW1hdGluZyAmJiBjb2RlfVxyXG4gICAgICAgIDxwIHN0eWxlPVwiY29sb3I6ICM0ZWNkYzQ7XCI+5pyq5qOA5rWL5Yiw6ZSZ6K+vPC9wPlxyXG4gICAgICB7L2lmfVxyXG4gICAgPC9kaXY+XHJcbiAgPC9kaXY+XHJcbiAgXHJcbiAgPGRpdiBjbGFzcz1cInBhbmVsXCI+XHJcbiAgICA8ZGl2IGNsYXNzPVwicGFuZWwtdGl0bGVcIj7nrKblj7fooag8L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJzeW1ib2wtdGFibGVcIj5cclxuICAgICAgeyNlYWNoIE9iamVjdC5lbnRyaWVzKHN5bWJvbFRhYmxlKSBhcyBbbmFtZSwgaW5mb119XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cInN5bWJvbC1pdGVtXCI+XHJcbiAgICAgICAgICA8c3BhbiBzdHlsZT1cImNvbG9yOiAjZmZlNjZkO1wiPntuYW1lfTwvc3Bhbj5cclxuICAgICAgICAgIDxzcGFuIHN0eWxlPVwiY29sb3I6ICM0ZWNkYzQ7XCI+e2luZm8udHlwZX08L3NwYW4+XHJcbiAgICAgICAgICA8c3BhbiBzdHlsZT1cImNvbG9yOiAjYTBhMGEwO1wiPuS9nOeUqOWfnzoge2luZm8uc2NvcGVEZXB0aH08L3NwYW4+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIHsvZWFjaH1cclxuICAgICAgeyNpZiBPYmplY3Qua2V5cyhzeW1ib2xUYWJsZSkubGVuZ3RoID09PSAwICYmICFpc0FuaW1hdGluZyAmJiBjb2RlfVxyXG4gICAgICAgIDxwIHN0eWxlPVwiY29sb3I6ICNhMGEwYTA7XCI+5pqC5peg56ym5Y+3PC9wPlxyXG4gICAgICB7L2lmfVxyXG4gICAgPC9kaXY+XHJcbiAgPC9kaXY+XHJcbiAgXHJcbiAgPGRpdiBjbGFzcz1cInBhbmVsXCI+XHJcbiAgICA8ZGl2IGNsYXNzPVwicGFuZWwtdGl0bGVcIj7lhoXlrZjkvb/nlKjmqKHmi588L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJtZW1vcnktYmFyXCI+XHJcbiAgICAgIDxkaXYgXHJcbiAgICAgICAgY2xhc3M9XCJtZW1vcnktZmlsbFwiIFxyXG4gICAgICAgIHN0eWxlPVwid2lkdGg6IHttZW1vcnlVc2FnZX0lO1wiXHJcbiAgICAgIC8+XHJcbiAgICA8L2Rpdj5cclxuICAgIDxkaXYgc3R5bGU9XCJkaXNwbGF5OiBmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47IG1hcmdpbi10b3A6IDRweDsgZm9udC1zaXplOiAxMnB4O1wiPlxyXG4gICAgICA8c3Bhbj4wJTwvc3Bhbj5cclxuICAgICAgPHNwYW4gc3R5bGU9XCJjb2xvcjoge21lbW9yeVVzYWdlID4gODAgPyAnI2ZmNmI2YicgOiAnIzRlY2RjNCd9O1wiPnttZW1vcnlVc2FnZX0lPC9zcGFuPlxyXG4gICAgICA8c3Bhbj4xMDAlPC9zcGFuPlxyXG4gICAgPC9kaXY+XHJcbiAgICB7I2lmIG1lbW9yeVVzYWdlID4gODB9XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJtZW1vcnktd2FybmluZ1wiPuKaoO+4jyDlhoXlrZjls7DlgLzorablkYo8L2Rpdj5cclxuICAgIHsvaWZ9XHJcbiAgPC9kaXY+XHJcbiAgXHJcbiAgPGRpdiBjbGFzcz1cInBhbmVsXCI+XHJcbiAgICA8ZGl2IGNsYXNzPVwicGFuZWwtdGl0bGVcIj7kvZznlKjln5/mt7HluqY8L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJzY29wZS1pbmRpY2F0b3JcIj5cclxuICAgICAgeyNlYWNoIEFycmF5KDYpIGFzIF8sIGl9XHJcbiAgICAgICAgPGRpdiBcclxuICAgICAgICAgIGNsYXNzPVwic2NvcGUtbGV2ZWxcIiBcclxuICAgICAgICAgIGNsYXNzOmFjdGl2ZT17aSA8IHNjb3BlRGVwdGh9XHJcbiAgICAgICAgICB0aXRsZT17YOS9nOeUqOWfn+WxgiAke2kgKyAxfWB9XHJcbiAgICAgICAgLz5cclxuICAgICAgey9lYWNofVxyXG4gICAgPC9kaXY+XHJcbiAgICA8ZGl2IHN0eWxlPVwibWFyZ2luLXRvcDogMTJweDsgZm9udC1zaXplOiAxM3B4O1wiPlxyXG4gICAgICDlvZPliY3mt7HluqY6IDxzcGFuIHN0eWxlPVwiY29sb3I6ICM0ZWNkYzQ7XCI+e3Njb3BlRGVwdGh9PC9zcGFuPlxyXG4gICAgPC9kaXY+XHJcbiAgICB7I2lmIHNjb3BlRGVwdGggPiA0fVxyXG4gICAgICA8ZGl2IHN0eWxlPVwiY29sb3I6ICNmZmU2NmQ7IGZvbnQtc2l6ZTogMTJweDsgbWFyZ2luLXRvcDogOHB4O1wiPlxyXG4gICAgICAgIOKaoO+4jyDkvZznlKjln5/ltYzlpZfov4fmt7HvvIzlj6/og73lr7zoh7Tmn6Xmib7lu7bov59cclxuICAgICAgPC9kaXY+XHJcbiAgICB7L2lmfVxyXG4gIDwvZGl2PlxyXG4gIFxyXG4gIDxkaXYgY2xhc3M9XCJwYW5lbFwiPlxyXG4gICAgPGRpdiBjbGFzcz1cInBhbmVsLXRpdGxlXCI+5YiG5p6Q5qCIPC9kaXY+XHJcbiAgICA8ZGl2IGNsYXNzPVwicGFyc2Utc3RhY2tcIj5cclxuICAgICAgeyNlYWNoIHBhcnNlU3RhY2sgYXMgaXRlbSwgaW5kZXh9XHJcbiAgICAgICAgPGRpdiBcclxuICAgICAgICAgIGNsYXNzPVwic3RhY2staXRlbVwiIFxyXG4gICAgICAgICAgY2xhc3M6ZXJyb3I9e2l0ZW0uYWN0aW9uID09PSAnRVJST1InfVxyXG4gICAgICAgID5cclxuICAgICAgICAgIDxzcGFuIHN0eWxlPVwibWFyZ2luLXJpZ2h0OiAxMnB4OyBjb2xvcjogI2EwYTBhMDtcIj57aW5kZXh9PC9zcGFuPlxyXG4gICAgICAgICAgPHNwYW4gc3R5bGU9XCJmb250LXdlaWdodDogNjAwO1wiPntpdGVtLmFjdGlvbn08L3NwYW4+XHJcbiAgICAgICAgICB7I2lmIGl0ZW0udG9rZW59PHNwYW4gc3R5bGU9XCJtYXJnaW4tbGVmdDogOHB4O1wiPntpdGVtLnRva2VuLnZhbHVlfTwvc3Bhbj57L2lmfVxyXG4gICAgICAgICAgeyNpZiBpdGVtLm1lc3NhZ2V9PHNwYW4gc3R5bGU9XCJtYXJnaW4tbGVmdDogOHB4OyBjb2xvcjogI2ZmNmI2YjtcIj57aXRlbS5tZXNzYWdlfTwvc3Bhbj57L2lmfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICB7L2VhY2h9XHJcbiAgICAgIHsjaWYgcGFyc2VTdGFjay5sZW5ndGggPT09IDB9XHJcbiAgICAgICAgPHAgc3R5bGU9XCJjb2xvcjogI2EwYTBhMDtcIj7nrYnlvoXliIbmnpAuLi48L3A+XHJcbiAgICAgIHsvaWZ9XHJcbiAgICA8L2Rpdj5cclxuICA8L2Rpdj5cclxuPC9kaXY+XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFvUUUsd0NBQVcsQ0FDVCxPQUFPLENBQUUsSUFBSSxDQUNiLHFCQUFxQixDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQzlCLGtCQUFrQixDQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUNoQyxHQUFHLENBQUUsSUFBSSxDQUNULE9BQU8sQ0FBRSxJQUFJLENBQ2IsTUFBTSxDQUFFLEtBQ1YsQ0FFQSxxQ0FBUSxDQUNOLFdBQVcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FDbkIsT0FBTyxDQUFFLElBQUksQ0FDYixlQUFlLENBQUUsYUFBYSxDQUM5QixXQUFXLENBQUUsTUFBTSxDQUNuQixP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 */");
	}

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[31] = list[i];
		child_ctx[33] = i;
		return child_ctx;
	}

	function get_each_context_1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[34] = list[i];
		child_ctx[36] = i;
		return child_ctx;
	}

	function get_each_context_2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[37] = list[i][0];
		child_ctx[38] = list[i][1];
		return child_ctx;
	}

	function get_each_context_3(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[41] = list[i];
		return child_ctx;
	}

	function get_each_context_4(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[44] = list[i];
		return child_ctx;
	}

	function get_each_context_5(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[47] = list[i];
		child_ctx[33] = i;
		return child_ctx;
	}

	function get_each_context_6(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[49] = list[i];
		return child_ctx;
	}

	// (575:6) {#each presets as preset}
	function create_each_block_6(ctx) {
		let button;
		let t_value = /*preset*/ ctx[49].name + "";
		let t;
		let mounted;
		let dispose;

		function click_handler() {
			return /*click_handler*/ ctx[14](/*preset*/ ctx[49]);
		}

		const block = {
			c: function create() {
				button = element("button");
				t = text(t_value);
				attr_dev(button, "class", "preset-btn svelte-19a10sd");
				set_style(button, "background", /*preset*/ ctx[49].color);
				add_location(button, file, 575, 8, 13582);
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);
				append_dev(button, t);

				if (!mounted) {
					dispose = listen_dev(button, "click", click_handler, false, false, false, false);
					mounted = true;
				}
			},
			p: function update(new_ctx, dirty) {
				ctx = new_ctx;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_6.name,
			type: "each",
			source: "(575:6) {#each presets as preset}",
			ctx
		});

		return block;
	}

	// (606:6) {#each tokens as token, index}
	function create_each_block_5(ctx) {
		let div;
		let span0;
		let t0_value = /*token*/ ctx[47].type + "";
		let t0;
		let t1;
		let span1;
		let t2;
		let t3_value = /*token*/ ctx[47].value + "";
		let t3;
		let t4;
		let t5;

		const block = {
			c: function create() {
				div = element("div");
				span0 = element("span");
				t0 = text(t0_value);
				t1 = space();
				span1 = element("span");
				t2 = text("\"");
				t3 = text(t3_value);
				t4 = text("\"");
				t5 = space();
				attr_dev(span0, "class", "token-type");
				add_location(span0, file, 611, 10, 14605);
				attr_dev(span1, "class", "token-value");
				add_location(span1, file, 612, 10, 14661);
				attr_dev(div, "class", "token svelte-19a10sd");
				set_style(div, "background", getTokenColor(/*token*/ ctx[47].type) + "20");
				set_style(div, "color", getTokenColor(/*token*/ ctx[47].type));
				set_style(div, "border", "1px solid " + getTokenColor(/*token*/ ctx[47].type) + "40");
				toggle_class(div, "active", /*index*/ ctx[33] === /*activeTokenIndex*/ ctx[8]);
				add_location(div, file, 606, 8, 14351);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, span0);
				append_dev(span0, t0);
				append_dev(div, t1);
				append_dev(div, span1);
				append_dev(span1, t2);
				append_dev(span1, t3);
				append_dev(span1, t4);
				append_dev(div, t5);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*tokens*/ 2 && t0_value !== (t0_value = /*token*/ ctx[47].type + "")) set_data_dev(t0, t0_value);
				if (dirty[0] & /*tokens*/ 2 && t3_value !== (t3_value = /*token*/ ctx[47].value + "")) set_data_dev(t3, t3_value);

				if (dirty[0] & /*tokens*/ 2) {
					set_style(div, "background", getTokenColor(/*token*/ ctx[47].type) + "20");
				}

				if (dirty[0] & /*tokens*/ 2) {
					set_style(div, "color", getTokenColor(/*token*/ ctx[47].type));
				}

				if (dirty[0] & /*tokens*/ 2) {
					set_style(div, "border", "1px solid " + getTokenColor(/*token*/ ctx[47].type) + "40");
				}

				if (dirty[0] & /*activeTokenIndex*/ 256) {
					toggle_class(div, "active", /*index*/ ctx[33] === /*activeTokenIndex*/ ctx[8]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_5.name,
			type: "each",
			source: "(606:6) {#each tokens as token, index}",
			ctx
		});

		return block;
	}

	// (624:6) {:else}
	function create_else_block(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("等待分析...");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block.name,
			type: "else",
			source: "(624:6) {:else}",
			ctx
		});

		return block;
	}

	// (622:6) {#if ast}
	function create_if_block_8(ctx) {
		let t_value = formatAST(/*ast*/ ctx[2]) + "";
		let t;

		const block = {
			c: function create() {
				t = text(t_value);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*ast*/ 4 && t_value !== (t_value = formatAST(/*ast*/ ctx[2]) + "")) set_data_dev(t, t_value);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_8.name,
			type: "if",
			source: "(622:6) {#if ast}",
			ctx
		});

		return block;
	}

	// (633:6) {#each typeArrows as arrow}
	function create_each_block_4(ctx) {
		let div;
		let t_value = /*arrow*/ ctx[44].message + "";
		let t;

		const block = {
			c: function create() {
				div = element("div");
				t = text(t_value);
				attr_dev(div, "class", "type-arrow svelte-19a10sd");
				toggle_class(div, "visible", /*arrow*/ ctx[44].visible);
				toggle_class(div, "error", /*arrow*/ ctx[44].error);
				add_location(div, file, 633, 8, 15129);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, t);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*typeArrows*/ 512 && t_value !== (t_value = /*arrow*/ ctx[44].message + "")) set_data_dev(t, t_value);

				if (dirty[0] & /*typeArrows*/ 512) {
					toggle_class(div, "visible", /*arrow*/ ctx[44].visible);
				}

				if (dirty[0] & /*typeArrows*/ 512) {
					toggle_class(div, "error", /*arrow*/ ctx[44].error);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_4.name,
			type: "each",
			source: "(633:6) {#each typeArrows as arrow}",
			ctx
		});

		return block;
	}

	// (642:6) {#if typeArrows.length === 0 && !isAnimating && code}
	function create_if_block_7(ctx) {
		let p;

		const block = {
			c: function create() {
				p = element("p");
				p.textContent = "类型检查通过";
				set_style(p, "color", "#4ecdc4");
				add_location(p, file, 642, 8, 15383);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_7.name,
			type: "if",
			source: "(642:6) {#if typeArrows.length === 0 && !isAnimating && code}",
			ctx
		});

		return block;
	}

	// (651:6) {#each errorPositions as error}
	function create_each_block_3(ctx) {
		let div;
		let strong;
		let t0_value = /*error*/ ctx[41].type + "";
		let t0;
		let t1;
		let t2;
		let t3_value = /*error*/ ctx[41].message + "";
		let t3;

		const block = {
			c: function create() {
				div = element("div");
				strong = element("strong");
				t0 = text(t0_value);
				t1 = text(":");
				t2 = space();
				t3 = text(t3_value);
				add_location(strong, file, 655, 10, 15706);
				attr_dev(div, "class", "error-item svelte-19a10sd");
				toggle_class(div, "active", /*error*/ ctx[41].active);
				add_location(div, file, 651, 8, 15608);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, strong);
				append_dev(strong, t0);
				append_dev(strong, t1);
				append_dev(div, t2);
				append_dev(div, t3);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*errorPositions*/ 1024 && t0_value !== (t0_value = /*error*/ ctx[41].type + "")) set_data_dev(t0, t0_value);
				if (dirty[0] & /*errorPositions*/ 1024 && t3_value !== (t3_value = /*error*/ ctx[41].message + "")) set_data_dev(t3, t3_value);

				if (dirty[0] & /*errorPositions*/ 1024) {
					toggle_class(div, "active", /*error*/ ctx[41].active);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_3.name,
			type: "each",
			source: "(651:6) {#each errorPositions as error}",
			ctx
		});

		return block;
	}

	// (659:6) {#if errorPositions.length === 0 && !isAnimating && code}
	function create_if_block_6(ctx) {
		let p;

		const block = {
			c: function create() {
				p = element("p");
				p.textContent = "未检测到错误";
				set_style(p, "color", "#4ecdc4");
				add_location(p, file, 659, 8, 15858);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_6.name,
			type: "if",
			source: "(659:6) {#if errorPositions.length === 0 && !isAnimating && code}",
			ctx
		});

		return block;
	}

	// (668:6) {#each Object.entries(symbolTable) as [name, info]}
	function create_each_block_2(ctx) {
		let div;
		let span0;
		let t0_value = /*name*/ ctx[37] + "";
		let t0;
		let t1;
		let span1;
		let t2_value = /*info*/ ctx[38].type + "";
		let t2;
		let t3;
		let span2;
		let t4;
		let t5_value = /*info*/ ctx[38].scopeDepth + "";
		let t5;

		const block = {
			c: function create() {
				div = element("div");
				span0 = element("span");
				t0 = text(t0_value);
				t1 = space();
				span1 = element("span");
				t2 = text(t2_value);
				t3 = space();
				span2 = element("span");
				t4 = text("作用域: ");
				t5 = text(t5_value);
				set_style(span0, "color", "#ffe66d");
				add_location(span0, file, 669, 10, 16135);
				set_style(span1, "color", "#4ecdc4");
				add_location(span1, file, 670, 10, 16190);
				set_style(span2, "color", "#a0a0a0");
				add_location(span2, file, 671, 10, 16250);
				attr_dev(div, "class", "symbol-item svelte-19a10sd");
				add_location(div, file, 668, 8, 16098);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, span0);
				append_dev(span0, t0);
				append_dev(div, t1);
				append_dev(div, span1);
				append_dev(span1, t2);
				append_dev(div, t3);
				append_dev(div, span2);
				append_dev(span2, t4);
				append_dev(span2, t5);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*symbolTable*/ 8 && t0_value !== (t0_value = /*name*/ ctx[37] + "")) set_data_dev(t0, t0_value);
				if (dirty[0] & /*symbolTable*/ 8 && t2_value !== (t2_value = /*info*/ ctx[38].type + "")) set_data_dev(t2, t2_value);
				if (dirty[0] & /*symbolTable*/ 8 && t5_value !== (t5_value = /*info*/ ctx[38].scopeDepth + "")) set_data_dev(t5, t5_value);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_2.name,
			type: "each",
			source: "(668:6) {#each Object.entries(symbolTable) as [name, info]}",
			ctx
		});

		return block;
	}

	// (675:6) {#if Object.keys(symbolTable).length === 0 && !isAnimating && code}
	function create_if_block_5(ctx) {
		let p;

		const block = {
			c: function create() {
				p = element("p");
				p.textContent = "暂无符号";
				set_style(p, "color", "#a0a0a0");
				add_location(p, file, 675, 8, 16425);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_5.name,
			type: "if",
			source: "(675:6) {#if Object.keys(symbolTable).length === 0 && !isAnimating && code}",
			ctx
		});

		return block;
	}

	// (694:4) {#if memoryUsage > 80}
	function create_if_block_4(ctx) {
		let div;

		const block = {
			c: function create() {
				div = element("div");
				div.textContent = "⚠️ 内存峰值警告";
				attr_dev(div, "class", "memory-warning svelte-19a10sd");
				add_location(div, file, 694, 6, 16990);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_4.name,
			type: "if",
			source: "(694:4) {#if memoryUsage > 80}",
			ctx
		});

		return block;
	}

	// (702:6) {#each Array(6) as _, i}
	function create_each_block_1(ctx) {
		let div;

		const block = {
			c: function create() {
				div = element("div");
				attr_dev(div, "class", "scope-level svelte-19a10sd");
				attr_dev(div, "title", `作用域层 ${/*i*/ ctx[36] + 1}`);
				toggle_class(div, "active", /*i*/ ctx[36] < /*scopeDepth*/ ctx[6]);
				add_location(div, file, 702, 8, 17200);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*scopeDepth*/ 64) {
					toggle_class(div, "active", /*i*/ ctx[36] < /*scopeDepth*/ ctx[6]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_1.name,
			type: "each",
			source: "(702:6) {#each Array(6) as _, i}",
			ctx
		});

		return block;
	}

	// (713:4) {#if scopeDepth > 4}
	function create_if_block_3(ctx) {
		let div;

		const block = {
			c: function create() {
				div = element("div");
				div.textContent = "⚠️ 作用域嵌套过深，可能导致查找延迟";
				set_style(div, "color", "#ffe66d");
				set_style(div, "font-size", "12px");
				set_style(div, "margin-top", "8px");
				add_location(div, file, 713, 6, 17515);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_3.name,
			type: "if",
			source: "(713:4) {#if scopeDepth > 4}",
			ctx
		});

		return block;
	}

	// (730:10) {#if item.token}
	function create_if_block_2(ctx) {
		let span;
		let t_value = /*item*/ ctx[31].token.value + "";
		let t;

		const block = {
			c: function create() {
				span = element("span");
				t = text(t_value);
				set_style(span, "margin-left", "8px");
				add_location(span, file, 729, 26, 18055);
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);
				append_dev(span, t);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*parseStack*/ 128 && t_value !== (t_value = /*item*/ ctx[31].token.value + "")) set_data_dev(t, t_value);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(span);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2.name,
			type: "if",
			source: "(730:10) {#if item.token}",
			ctx
		});

		return block;
	}

	// (731:10) {#if item.message}
	function create_if_block_1(ctx) {
		let span;
		let t_value = /*item*/ ctx[31].message + "";
		let t;

		const block = {
			c: function create() {
				span = element("span");
				t = text(t_value);
				set_style(span, "margin-left", "8px");
				set_style(span, "color", "#ff6b6b");
				add_location(span, file, 730, 28, 18147);
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);
				append_dev(span, t);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*parseStack*/ 128 && t_value !== (t_value = /*item*/ ctx[31].message + "")) set_data_dev(t, t_value);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(span);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1.name,
			type: "if",
			source: "(731:10) {#if item.message}",
			ctx
		});

		return block;
	}

	// (723:6) {#each parseStack as item, index}
	function create_each_block(ctx) {
		let div;
		let span0;
		let t1;
		let span1;
		let t2_value = /*item*/ ctx[31].action + "";
		let t2;
		let t3;
		let t4;
		let if_block0 = /*item*/ ctx[31].token && create_if_block_2(ctx);
		let if_block1 = /*item*/ ctx[31].message && create_if_block_1(ctx);

		const block = {
			c: function create() {
				div = element("div");
				span0 = element("span");
				span0.textContent = `${/*index*/ ctx[33]}`;
				t1 = space();
				span1 = element("span");
				t2 = text(t2_value);
				t3 = space();
				if (if_block0) if_block0.c();
				t4 = space();
				if (if_block1) if_block1.c();
				set_style(span0, "margin-right", "12px");
				set_style(span0, "color", "#a0a0a0");
				add_location(span0, file, 727, 10, 17899);
				set_style(span1, "font-weight", "600");
				add_location(span1, file, 728, 10, 17975);
				attr_dev(div, "class", "stack-item svelte-19a10sd");
				toggle_class(div, "error", /*item*/ ctx[31].action === 'ERROR');
				add_location(div, file, 723, 8, 17791);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, span0);
				append_dev(div, t1);
				append_dev(div, span1);
				append_dev(span1, t2);
				append_dev(div, t3);
				if (if_block0) if_block0.m(div, null);
				append_dev(div, t4);
				if (if_block1) if_block1.m(div, null);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*parseStack*/ 128 && t2_value !== (t2_value = /*item*/ ctx[31].action + "")) set_data_dev(t2, t2_value);

				if (/*item*/ ctx[31].token) {
					if (if_block0) {
						if_block0.p(ctx, dirty);
					} else {
						if_block0 = create_if_block_2(ctx);
						if_block0.c();
						if_block0.m(div, t4);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (/*item*/ ctx[31].message) {
					if (if_block1) {
						if_block1.p(ctx, dirty);
					} else {
						if_block1 = create_if_block_1(ctx);
						if_block1.c();
						if_block1.m(div, null);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (dirty[0] & /*parseStack*/ 128) {
					toggle_class(div, "error", /*item*/ ctx[31].action === 'ERROR');
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block.name,
			type: "each",
			source: "(723:6) {#each parseStack as item, index}",
			ctx
		});

		return block;
	}

	// (734:6) {#if parseStack.length === 0}
	function create_if_block(ctx) {
		let p;

		const block = {
			c: function create() {
				p = element("p");
				p.textContent = "等待分析...";
				set_style(p, "color", "#a0a0a0");
				add_location(p, file, 734, 8, 18299);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block.name,
			type: "if",
			source: "(734:6) {#if parseStack.length === 0}",
			ctx
		});

		return block;
	}

	function create_fragment(ctx) {
		let div31;
		let div1;
		let h1;
		let t1;
		let div0;
		let t2;
		let button;
		let t3_value = (/*isAnimating*/ ctx[4] ? '分析中...' : '开始分析') + "";
		let t3;
		let button_disabled_value;
		let t4;
		let div3;
		let div2;
		let t6;
		let textarea;
		let t7;
		let div6;
		let div4;
		let t9;
		let div5;
		let t10;
		let div9;
		let div7;
		let t12;
		let div8;
		let t13;
		let div12;
		let div10;
		let t15;
		let div11;
		let t16;
		let t17;
		let div15;
		let div13;
		let t19;
		let div14;
		let t20;
		let t21;
		let div18;
		let div16;
		let t23;
		let div17;
		let t24;
		let show_if = Object.keys(/*symbolTable*/ ctx[3]).length === 0 && !/*isAnimating*/ ctx[4] && /*code*/ ctx[0];
		let t25;
		let div23;
		let div19;
		let t27;
		let div21;
		let div20;
		let t28;
		let div22;
		let span0;
		let t30;
		let span1;
		let t31;
		let t32;
		let t33;
		let span2;
		let t35;
		let t36;
		let div27;
		let div24;
		let t38;
		let div25;
		let t39;
		let div26;
		let t40;
		let span3;
		let t41;
		let t42;
		let t43;
		let div30;
		let div28;
		let t45;
		let div29;
		let t46;
		let mounted;
		let dispose;
		let each_value_6 = ensure_array_like_dev(/*presets*/ ctx[11]);
		let each_blocks_6 = [];

		for (let i = 0; i < each_value_6.length; i += 1) {
			each_blocks_6[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
		}

		let each_value_5 = ensure_array_like_dev(/*tokens*/ ctx[1]);
		let each_blocks_5 = [];

		for (let i = 0; i < each_value_5.length; i += 1) {
			each_blocks_5[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
		}

		function select_block_type(ctx, dirty) {
			if (/*ast*/ ctx[2]) return create_if_block_8;
			return create_else_block;
		}

		let current_block_type = select_block_type(ctx);
		let if_block0 = current_block_type(ctx);
		let each_value_4 = ensure_array_like_dev(/*typeArrows*/ ctx[9]);
		let each_blocks_4 = [];

		for (let i = 0; i < each_value_4.length; i += 1) {
			each_blocks_4[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
		}

		let if_block1 = /*typeArrows*/ ctx[9].length === 0 && !/*isAnimating*/ ctx[4] && /*code*/ ctx[0] && create_if_block_7(ctx);
		let each_value_3 = ensure_array_like_dev(/*errorPositions*/ ctx[10]);
		let each_blocks_3 = [];

		for (let i = 0; i < each_value_3.length; i += 1) {
			each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
		}

		let if_block2 = /*errorPositions*/ ctx[10].length === 0 && !/*isAnimating*/ ctx[4] && /*code*/ ctx[0] && create_if_block_6(ctx);
		let each_value_2 = ensure_array_like_dev(Object.entries(/*symbolTable*/ ctx[3]));
		let each_blocks_2 = [];

		for (let i = 0; i < each_value_2.length; i += 1) {
			each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
		}

		let if_block3 = show_if && create_if_block_5(ctx);
		let if_block4 = /*memoryUsage*/ ctx[5] > 80 && create_if_block_4(ctx);
		let each_value_1 = ensure_array_like_dev(Array(6));
		let each_blocks_1 = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
		}

		let if_block5 = /*scopeDepth*/ ctx[6] > 4 && create_if_block_3(ctx);
		let each_value = ensure_array_like_dev(/*parseStack*/ ctx[7]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		let if_block6 = /*parseStack*/ ctx[7].length === 0 && create_if_block(ctx);

		const block = {
			c: function create() {
				div31 = element("div");
				div1 = element("div");
				h1 = element("h1");
				h1.textContent = "编译器前端可视化工具";
				t1 = space();
				div0 = element("div");

				for (let i = 0; i < each_blocks_6.length; i += 1) {
					each_blocks_6[i].c();
				}

				t2 = space();
				button = element("button");
				t3 = text(t3_value);
				t4 = space();
				div3 = element("div");
				div2 = element("div");
				div2.textContent = "代码编辑器";
				t6 = space();
				textarea = element("textarea");
				t7 = space();
				div6 = element("div");
				div4 = element("div");
				div4.textContent = "词法分析 - 令牌流";
				t9 = space();
				div5 = element("div");

				for (let i = 0; i < each_blocks_5.length; i += 1) {
					each_blocks_5[i].c();
				}

				t10 = space();
				div9 = element("div");
				div7 = element("div");
				div7.textContent = "语法分析 - 抽象语法树";
				t12 = space();
				div8 = element("div");
				if_block0.c();
				t13 = space();
				div12 = element("div");
				div10 = element("div");
				div10.textContent = "语义分析 - 类型推断";
				t15 = space();
				div11 = element("div");

				for (let i = 0; i < each_blocks_4.length; i += 1) {
					each_blocks_4[i].c();
				}

				t16 = space();
				if (if_block1) if_block1.c();
				t17 = space();
				div15 = element("div");
				div13 = element("div");
				div13.textContent = "错误标记";
				t19 = space();
				div14 = element("div");

				for (let i = 0; i < each_blocks_3.length; i += 1) {
					each_blocks_3[i].c();
				}

				t20 = space();
				if (if_block2) if_block2.c();
				t21 = space();
				div18 = element("div");
				div16 = element("div");
				div16.textContent = "符号表";
				t23 = space();
				div17 = element("div");

				for (let i = 0; i < each_blocks_2.length; i += 1) {
					each_blocks_2[i].c();
				}

				t24 = space();
				if (if_block3) if_block3.c();
				t25 = space();
				div23 = element("div");
				div19 = element("div");
				div19.textContent = "内存使用模拟";
				t27 = space();
				div21 = element("div");
				div20 = element("div");
				t28 = space();
				div22 = element("div");
				span0 = element("span");
				span0.textContent = "0%";
				t30 = space();
				span1 = element("span");
				t31 = text(/*memoryUsage*/ ctx[5]);
				t32 = text("%");
				t33 = space();
				span2 = element("span");
				span2.textContent = "100%";
				t35 = space();
				if (if_block4) if_block4.c();
				t36 = space();
				div27 = element("div");
				div24 = element("div");
				div24.textContent = "作用域深度";
				t38 = space();
				div25 = element("div");

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].c();
				}

				t39 = space();
				div26 = element("div");
				t40 = text("当前深度: ");
				span3 = element("span");
				t41 = text(/*scopeDepth*/ ctx[6]);
				t42 = space();
				if (if_block5) if_block5.c();
				t43 = space();
				div30 = element("div");
				div28 = element("div");
				div28.textContent = "分析栈";
				t45 = space();
				div29 = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t46 = space();
				if (if_block6) if_block6.c();
				attr_dev(h1, "class", "svelte-19a10sd");
				add_location(h1, file, 572, 4, 13486);
				attr_dev(button, "class", "analyze-btn svelte-19a10sd");
				button.disabled = button_disabled_value = /*isAnimating*/ ctx[4] || !/*code*/ ctx[0].trim();
				add_location(button, file, 583, 6, 13796);
				attr_dev(div0, "class", "preset-buttons svelte-19a10sd");
				add_location(div0, file, 573, 4, 13511);
				attr_dev(div1, "class", "header svelte-19a10sd");
				add_location(div1, file, 571, 2, 13460);
				attr_dev(div2, "class", "panel-title svelte-19a10sd");
				add_location(div2, file, 594, 4, 14038);
				attr_dev(textarea, "class", "code-editor svelte-19a10sd");
				attr_dev(textarea, "placeholder", "在此输入源代码...");
				add_location(textarea, file, 595, 4, 14080);
				attr_dev(div3, "class", "panel svelte-19a10sd");
				add_location(div3, file, 593, 2, 14013);
				attr_dev(div4, "class", "panel-title svelte-19a10sd");
				add_location(div4, file, 603, 4, 14226);
				attr_dev(div5, "class", "tokens-container svelte-19a10sd");
				add_location(div5, file, 604, 4, 14273);
				attr_dev(div6, "class", "panel svelte-19a10sd");
				add_location(div6, file, 602, 2, 14201);
				attr_dev(div7, "class", "panel-title svelte-19a10sd");
				add_location(div7, file, 619, 4, 14795);
				attr_dev(div8, "class", "ast-viewer svelte-19a10sd");
				add_location(div8, file, 620, 4, 14844);
				attr_dev(div9, "class", "panel svelte-19a10sd");
				add_location(div9, file, 618, 2, 14770);
				attr_dev(div10, "class", "panel-title svelte-19a10sd");
				add_location(div10, file, 630, 4, 15011);
				attr_dev(div11, "class", "type-arrows");
				add_location(div11, file, 631, 4, 15059);
				attr_dev(div12, "class", "panel svelte-19a10sd");
				add_location(div12, file, 629, 2, 14986);
				attr_dev(div13, "class", "panel-title svelte-19a10sd");
				add_location(div13, file, 648, 4, 15488);
				attr_dev(div14, "class", "errors-container");
				add_location(div14, file, 649, 4, 15529);
				attr_dev(div15, "class", "panel svelte-19a10sd");
				add_location(div15, file, 647, 2, 15463);
				attr_dev(div16, "class", "panel-title svelte-19a10sd");
				add_location(div16, file, 665, 4, 15963);
				attr_dev(div17, "class", "symbol-table svelte-19a10sd");
				add_location(div17, file, 666, 4, 16003);
				attr_dev(div18, "class", "panel svelte-19a10sd");
				add_location(div18, file, 664, 2, 15938);
				attr_dev(div19, "class", "panel-title svelte-19a10sd");
				add_location(div19, file, 681, 4, 16528);
				attr_dev(div20, "class", "memory-fill svelte-19a10sd");
				set_style(div20, "width", /*memoryUsage*/ ctx[5] + "%");
				add_location(div20, file, 683, 6, 16603);
				attr_dev(div21, "class", "memory-bar svelte-19a10sd");
				add_location(div21, file, 682, 4, 16571);
				add_location(span0, file, 689, 6, 16808);
				set_style(span1, "color", /*memoryUsage*/ ctx[5] > 80 ? '#ff6b6b' : '#4ecdc4');
				add_location(span1, file, 690, 6, 16831);
				add_location(span2, file, 691, 6, 16925);
				set_style(div22, "display", "flex");
				set_style(div22, "justify-content", "space-between");
				set_style(div22, "margin-top", "4px");
				set_style(div22, "font-size", "12px");
				add_location(div22, file, 688, 4, 16706);
				attr_dev(div23, "class", "panel svelte-19a10sd");
				add_location(div23, file, 680, 2, 16503);
				attr_dev(div24, "class", "panel-title svelte-19a10sd");
				add_location(div24, file, 699, 4, 17087);
				attr_dev(div25, "class", "scope-indicator svelte-19a10sd");
				add_location(div25, file, 700, 4, 17129);
				set_style(span3, "color", "#4ecdc4");
				add_location(span3, file, 710, 12, 17420);
				set_style(div26, "margin-top", "12px");
				set_style(div26, "font-size", "13px");
				add_location(div26, file, 709, 4, 17358);
				attr_dev(div27, "class", "panel svelte-19a10sd");
				add_location(div27, file, 698, 2, 17062);
				attr_dev(div28, "class", "panel-title svelte-19a10sd");
				add_location(div28, file, 720, 4, 17675);
				attr_dev(div29, "class", "parse-stack svelte-19a10sd");
				add_location(div29, file, 721, 4, 17715);
				attr_dev(div30, "class", "panel svelte-19a10sd");
				add_location(div30, file, 719, 2, 17650);
				attr_dev(div31, "class", "container svelte-19a10sd");
				add_location(div31, file, 570, 0, 13433);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div31, anchor);
				append_dev(div31, div1);
				append_dev(div1, h1);
				append_dev(div1, t1);
				append_dev(div1, div0);

				for (let i = 0; i < each_blocks_6.length; i += 1) {
					if (each_blocks_6[i]) {
						each_blocks_6[i].m(div0, null);
					}
				}

				append_dev(div0, t2);
				append_dev(div0, button);
				append_dev(button, t3);
				append_dev(div31, t4);
				append_dev(div31, div3);
				append_dev(div3, div2);
				append_dev(div3, t6);
				append_dev(div3, textarea);
				set_input_value(textarea, /*code*/ ctx[0]);
				append_dev(div31, t7);
				append_dev(div31, div6);
				append_dev(div6, div4);
				append_dev(div6, t9);
				append_dev(div6, div5);

				for (let i = 0; i < each_blocks_5.length; i += 1) {
					if (each_blocks_5[i]) {
						each_blocks_5[i].m(div5, null);
					}
				}

				append_dev(div31, t10);
				append_dev(div31, div9);
				append_dev(div9, div7);
				append_dev(div9, t12);
				append_dev(div9, div8);
				if_block0.m(div8, null);
				append_dev(div31, t13);
				append_dev(div31, div12);
				append_dev(div12, div10);
				append_dev(div12, t15);
				append_dev(div12, div11);

				for (let i = 0; i < each_blocks_4.length; i += 1) {
					if (each_blocks_4[i]) {
						each_blocks_4[i].m(div11, null);
					}
				}

				append_dev(div11, t16);
				if (if_block1) if_block1.m(div11, null);
				append_dev(div31, t17);
				append_dev(div31, div15);
				append_dev(div15, div13);
				append_dev(div15, t19);
				append_dev(div15, div14);

				for (let i = 0; i < each_blocks_3.length; i += 1) {
					if (each_blocks_3[i]) {
						each_blocks_3[i].m(div14, null);
					}
				}

				append_dev(div14, t20);
				if (if_block2) if_block2.m(div14, null);
				append_dev(div31, t21);
				append_dev(div31, div18);
				append_dev(div18, div16);
				append_dev(div18, t23);
				append_dev(div18, div17);

				for (let i = 0; i < each_blocks_2.length; i += 1) {
					if (each_blocks_2[i]) {
						each_blocks_2[i].m(div17, null);
					}
				}

				append_dev(div17, t24);
				if (if_block3) if_block3.m(div17, null);
				append_dev(div31, t25);
				append_dev(div31, div23);
				append_dev(div23, div19);
				append_dev(div23, t27);
				append_dev(div23, div21);
				append_dev(div21, div20);
				append_dev(div23, t28);
				append_dev(div23, div22);
				append_dev(div22, span0);
				append_dev(div22, t30);
				append_dev(div22, span1);
				append_dev(span1, t31);
				append_dev(span1, t32);
				append_dev(div22, t33);
				append_dev(div22, span2);
				append_dev(div23, t35);
				if (if_block4) if_block4.m(div23, null);
				append_dev(div31, t36);
				append_dev(div31, div27);
				append_dev(div27, div24);
				append_dev(div27, t38);
				append_dev(div27, div25);

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					if (each_blocks_1[i]) {
						each_blocks_1[i].m(div25, null);
					}
				}

				append_dev(div27, t39);
				append_dev(div27, div26);
				append_dev(div26, t40);
				append_dev(div26, span3);
				append_dev(span3, t41);
				append_dev(div27, t42);
				if (if_block5) if_block5.m(div27, null);
				append_dev(div31, t43);
				append_dev(div31, div30);
				append_dev(div30, div28);
				append_dev(div30, t45);
				append_dev(div30, div29);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div29, null);
					}
				}

				append_dev(div29, t46);
				if (if_block6) if_block6.m(div29, null);

				if (!mounted) {
					dispose = [
						listen_dev(button, "click", /*analyzeCode*/ ctx[13], false, false, false, false),
						listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[15])
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*presets, loadPreset*/ 6144) {
					each_value_6 = ensure_array_like_dev(/*presets*/ ctx[11]);
					let i;

					for (i = 0; i < each_value_6.length; i += 1) {
						const child_ctx = get_each_context_6(ctx, each_value_6, i);

						if (each_blocks_6[i]) {
							each_blocks_6[i].p(child_ctx, dirty);
						} else {
							each_blocks_6[i] = create_each_block_6(child_ctx);
							each_blocks_6[i].c();
							each_blocks_6[i].m(div0, t2);
						}
					}

					for (; i < each_blocks_6.length; i += 1) {
						each_blocks_6[i].d(1);
					}

					each_blocks_6.length = each_value_6.length;
				}

				if (dirty[0] & /*isAnimating*/ 16 && t3_value !== (t3_value = (/*isAnimating*/ ctx[4] ? '分析中...' : '开始分析') + "")) set_data_dev(t3, t3_value);

				if (dirty[0] & /*isAnimating, code*/ 17 && button_disabled_value !== (button_disabled_value = /*isAnimating*/ ctx[4] || !/*code*/ ctx[0].trim())) {
					prop_dev(button, "disabled", button_disabled_value);
				}

				if (dirty[0] & /*code*/ 1) {
					set_input_value(textarea, /*code*/ ctx[0]);
				}

				if (dirty[0] & /*tokens, activeTokenIndex*/ 258) {
					each_value_5 = ensure_array_like_dev(/*tokens*/ ctx[1]);
					let i;

					for (i = 0; i < each_value_5.length; i += 1) {
						const child_ctx = get_each_context_5(ctx, each_value_5, i);

						if (each_blocks_5[i]) {
							each_blocks_5[i].p(child_ctx, dirty);
						} else {
							each_blocks_5[i] = create_each_block_5(child_ctx);
							each_blocks_5[i].c();
							each_blocks_5[i].m(div5, null);
						}
					}

					for (; i < each_blocks_5.length; i += 1) {
						each_blocks_5[i].d(1);
					}

					each_blocks_5.length = each_value_5.length;
				}

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0.d(1);
					if_block0 = current_block_type(ctx);

					if (if_block0) {
						if_block0.c();
						if_block0.m(div8, null);
					}
				}

				if (dirty[0] & /*typeArrows*/ 512) {
					each_value_4 = ensure_array_like_dev(/*typeArrows*/ ctx[9]);
					let i;

					for (i = 0; i < each_value_4.length; i += 1) {
						const child_ctx = get_each_context_4(ctx, each_value_4, i);

						if (each_blocks_4[i]) {
							each_blocks_4[i].p(child_ctx, dirty);
						} else {
							each_blocks_4[i] = create_each_block_4(child_ctx);
							each_blocks_4[i].c();
							each_blocks_4[i].m(div11, t16);
						}
					}

					for (; i < each_blocks_4.length; i += 1) {
						each_blocks_4[i].d(1);
					}

					each_blocks_4.length = each_value_4.length;
				}

				if (/*typeArrows*/ ctx[9].length === 0 && !/*isAnimating*/ ctx[4] && /*code*/ ctx[0]) {
					if (if_block1) ; else {
						if_block1 = create_if_block_7(ctx);
						if_block1.c();
						if_block1.m(div11, null);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (dirty[0] & /*errorPositions*/ 1024) {
					each_value_3 = ensure_array_like_dev(/*errorPositions*/ ctx[10]);
					let i;

					for (i = 0; i < each_value_3.length; i += 1) {
						const child_ctx = get_each_context_3(ctx, each_value_3, i);

						if (each_blocks_3[i]) {
							each_blocks_3[i].p(child_ctx, dirty);
						} else {
							each_blocks_3[i] = create_each_block_3(child_ctx);
							each_blocks_3[i].c();
							each_blocks_3[i].m(div14, t20);
						}
					}

					for (; i < each_blocks_3.length; i += 1) {
						each_blocks_3[i].d(1);
					}

					each_blocks_3.length = each_value_3.length;
				}

				if (/*errorPositions*/ ctx[10].length === 0 && !/*isAnimating*/ ctx[4] && /*code*/ ctx[0]) {
					if (if_block2) ; else {
						if_block2 = create_if_block_6(ctx);
						if_block2.c();
						if_block2.m(div14, null);
					}
				} else if (if_block2) {
					if_block2.d(1);
					if_block2 = null;
				}

				if (dirty[0] & /*symbolTable*/ 8) {
					each_value_2 = ensure_array_like_dev(Object.entries(/*symbolTable*/ ctx[3]));
					let i;

					for (i = 0; i < each_value_2.length; i += 1) {
						const child_ctx = get_each_context_2(ctx, each_value_2, i);

						if (each_blocks_2[i]) {
							each_blocks_2[i].p(child_ctx, dirty);
						} else {
							each_blocks_2[i] = create_each_block_2(child_ctx);
							each_blocks_2[i].c();
							each_blocks_2[i].m(div17, t24);
						}
					}

					for (; i < each_blocks_2.length; i += 1) {
						each_blocks_2[i].d(1);
					}

					each_blocks_2.length = each_value_2.length;
				}

				if (dirty[0] & /*symbolTable, isAnimating, code*/ 25) show_if = Object.keys(/*symbolTable*/ ctx[3]).length === 0 && !/*isAnimating*/ ctx[4] && /*code*/ ctx[0];

				if (show_if) {
					if (if_block3) ; else {
						if_block3 = create_if_block_5(ctx);
						if_block3.c();
						if_block3.m(div17, null);
					}
				} else if (if_block3) {
					if_block3.d(1);
					if_block3 = null;
				}

				if (dirty[0] & /*memoryUsage*/ 32) {
					set_style(div20, "width", /*memoryUsage*/ ctx[5] + "%");
				}

				if (dirty[0] & /*memoryUsage*/ 32) set_data_dev(t31, /*memoryUsage*/ ctx[5]);

				if (dirty[0] & /*memoryUsage*/ 32) {
					set_style(span1, "color", /*memoryUsage*/ ctx[5] > 80 ? '#ff6b6b' : '#4ecdc4');
				}

				if (/*memoryUsage*/ ctx[5] > 80) {
					if (if_block4) ; else {
						if_block4 = create_if_block_4(ctx);
						if_block4.c();
						if_block4.m(div23, null);
					}
				} else if (if_block4) {
					if_block4.d(1);
					if_block4 = null;
				}

				if (dirty[0] & /*scopeDepth*/ 64) {
					each_value_1 = ensure_array_like_dev(Array(6));
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks_1[i]) {
							each_blocks_1[i].p(child_ctx, dirty);
						} else {
							each_blocks_1[i] = create_each_block_1(child_ctx);
							each_blocks_1[i].c();
							each_blocks_1[i].m(div25, null);
						}
					}

					for (; i < each_blocks_1.length; i += 1) {
						each_blocks_1[i].d(1);
					}

					each_blocks_1.length = each_value_1.length;
				}

				if (dirty[0] & /*scopeDepth*/ 64) set_data_dev(t41, /*scopeDepth*/ ctx[6]);

				if (/*scopeDepth*/ ctx[6] > 4) {
					if (if_block5) ; else {
						if_block5 = create_if_block_3(ctx);
						if_block5.c();
						if_block5.m(div27, null);
					}
				} else if (if_block5) {
					if_block5.d(1);
					if_block5 = null;
				}

				if (dirty[0] & /*parseStack*/ 128) {
					each_value = ensure_array_like_dev(/*parseStack*/ ctx[7]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div29, t46);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}

				if (/*parseStack*/ ctx[7].length === 0) {
					if (if_block6) ; else {
						if_block6 = create_if_block(ctx);
						if_block6.c();
						if_block6.m(div29, null);
					}
				} else if (if_block6) {
					if_block6.d(1);
					if_block6 = null;
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div31);
				}

				destroy_each(each_blocks_6, detaching);
				destroy_each(each_blocks_5, detaching);
				if_block0.d();
				destroy_each(each_blocks_4, detaching);
				if (if_block1) if_block1.d();
				destroy_each(each_blocks_3, detaching);
				if (if_block2) if_block2.d();
				destroy_each(each_blocks_2, detaching);
				if (if_block3) if_block3.d();
				if (if_block4) if_block4.d();
				destroy_each(each_blocks_1, detaching);
				if (if_block5) if_block5.d();
				destroy_each(each_blocks, detaching);
				if (if_block6) if_block6.d();
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function getTokenColor(type) {
		const colors = {
			KEYWORD: '#ff6b6b',
			TYPE: '#4ecdc4',
			IDENTIFIER: '#ffe66d',
			NUMBER: '#a855f7',
			STRING: '#20e080',
			OPERATOR: '#ff8c42',
			DELIMITER: '#949494',
			ERROR: '#ff0000'
		};

		return colors[type] || '#ffffff';
	}

	function formatAST(node, indent = 0) {
		if (!node) return '';
		const prefix = ('  ').repeat(indent);
		let result = `${prefix}${node.type}`;
		if (node.name) result += `: ${node.name}`;
		if (node.value !== undefined) result += ` = ${node.value}`;
		if (node.operator) result += ` ${node.operator}`;
		result += '\n';

		if (node.children) {
			node.children.forEach(child => {
				result += formatAST(child, indent + 1);
			});
		}

		if (node.body) {
			node.body.forEach(child => {
				result += formatAST(child, indent + 1);
			});
		}

		if (node.left) result += formatAST(node.left, indent + 1);
		if (node.right) result += formatAST(node.right, indent + 1);
		if (node.id) result += formatAST(node.id, indent + 1);
		if (node.expression) result += formatAST(node.expression, indent + 1);
		return result;
	}

	function instance($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('App', slots, []);
		let code = '';
		let tokens = [];
		let ast = null;
		let parseSteps = [];
		let symbolTable = {};
		let semanticErrors = [];
		let parseErrors = [];
		let hasParseError = false;
		let currentStep = 0;
		let isAnimating = false;
		let memoryUsage = 0;
		let scopeDepth = 0;
		let maxScopeDepth = 0;
		let parseStack = [];
		let activeTokenIndex = -1;
		let growingNodes = [];
		let typeArrows = [];
		let errorPositions = [];
		let collapsedNodes = [];

		const presets = [
			{
				id: 'preset1',
				name: '左递归消除',
				color: '#ff6b6b'
			},
			{
				id: 'preset2',
				name: '悬空 else',
				color: '#4ecdc4'
			},
			{
				id: 'preset3',
				name: '类型不匹配',
				color: '#ffe66d'
			},
			{
				id: 'preset4',
				name: '作用域链断裂',
				color: '#a855f7'
			}
		];

		async function loadPreset(presetId) {
			const response = await fetch(`/api/preset/${presetId}`);
			const preset = await response.json();
			$$invalidate(0, code = preset.code);
			await analyzeCode();
		}

		async function analyzeCode() {
			$$invalidate(4, isAnimating = true);
			currentStep = 0;
			$$invalidate(1, tokens = []);
			$$invalidate(2, ast = null);
			parseSteps = [];
			$$invalidate(3, symbolTable = {});
			semanticErrors = [];
			parseErrors = [];
			hasParseError = false;
			$$invalidate(7, parseStack = []);
			$$invalidate(8, activeTokenIndex = -1);
			growingNodes = [];
			$$invalidate(9, typeArrows = []);
			$$invalidate(10, errorPositions = []);
			collapsedNodes = [];
			$$invalidate(6, scopeDepth = 0);
			maxScopeDepth = 0;

			const response = await fetch('/api/analyze', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ source: code })
			});

			const result = await response.json();
			$$invalidate(1, tokens = result.tokens);
			$$invalidate(2, ast = result.ast);
			parseSteps = result.parseSteps;
			$$invalidate(3, symbolTable = result.symbolTable);
			semanticErrors = result.semanticErrors;
			parseErrors = result.parseErrors || [];
			hasParseError = result.hasParseError || false;
			$$invalidate(7, parseStack = result.parseStack);
			maxScopeDepth = result.maxScopeDepth || 0;
			animateTokens();
		}

		async function animateTokens() {
			for (let i = 0; i < tokens.length; i++) {
				$$invalidate(8, activeTokenIndex = i);
				await delay(200);
			}

			$$invalidate(8, activeTokenIndex = -1);
			await delay(500);
			animateTree();
		}

		async function animateTree() {
			if (!ast) return;

			function addNodes(node, parentId = null, depth = 0) {
				const nodeId = Math.random().toString(36).substr(2, 9);

				growingNodes.push({
					id: nodeId,
					type: node.type,
					parentId,
					depth
				});

				if (node.children) {
					node.children.forEach(child => addNodes(child, nodeId, depth + 1));
				}

				if (node.body) {
					node.body.forEach(child => addNodes(child, nodeId, depth + 1));
				}

				if (node.left) addNodes(node.left, nodeId, depth + 1);
				if (node.right) addNodes(node.right, nodeId, depth + 1);
				if (node.id) addNodes(node.id, nodeId, depth + 1);
				if (node.expression) addNodes(node.expression, nodeId, depth + 1);
			}

			addNodes(ast);

			for (let i = 0; i < growingNodes.length; i++) {
				growingNodes[i].visible = true;
				await delay(150);
			}

			await delay(500);
			animateTypeInference();
		}

		async function animateTypeInference() {
			$$invalidate(9, typeArrows = []);

			if (semanticErrors.length > 0) {
				semanticErrors.forEach((error, index) => {
					typeArrows.push({
						id: index,
						from: error.type,
						to: 'error',
						error: true,
						message: error.message
					});
				});
			}

			for (let i = 0; i < typeArrows.length; i++) {
				$$invalidate(9, typeArrows[i].visible = true, typeArrows);
				await delay(300);
			}

			await delay(500);
			highlightErrors();
		}

		async function highlightErrors() {
			const allErrors = [
				...parseErrors.map((err, index) => ({
					id: `parse-${index}`,
					message: err.message,
					type: `语法错误: ${err.type}`,
					active: false,
					isParseError: true
				})),
				...semanticErrors.map((err, index) => ({
					id: `semantic-${index}`,
					message: err.message,
					type: `语义错误: ${err.type}`,
					active: false,
					isParseError: false
				}))
			];

			$$invalidate(10, errorPositions = allErrors);

			for (let i = 0; i < errorPositions.length; i++) {
				$$invalidate(10, errorPositions[i].active = true, errorPositions);
				await delay(400);
			}

			await delay(500);
			simulateMemoryUsage();
		}

		async function simulateMemoryUsage() {
			for (let i = 0; i <= 100; i += 5) {
				$$invalidate(5, memoryUsage = i);
				await delay(50);
			}

			for (let i = 100; i >= 30; i -= 3) {
				$$invalidate(5, memoryUsage = i);
				await delay(30);
			}

			animateScopeChain();
		}

		async function animateScopeChain() {
			$$invalidate(6, scopeDepth = 0);

			for (let i = 0; i <= maxScopeDepth; i++) {
				$$invalidate(6, scopeDepth = i);
				await delay(200);
			}

			await delay(1000);
			animateCollapse();
		}

		async function animateCollapse() {
			const nodes = growingNodes.filter(n => n.depth > 2);

			for (let i = 0; i < nodes.length; i += 2) {
				collapsedNodes.push(nodes[i].id);
				await delay(150);
			}

			$$invalidate(4, isAnimating = false);
		}

		onMount(async () => {
			await fetch('/api/presets');
		});

		const writable_props = [];

		Object_1.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
		});

		const click_handler = preset => loadPreset(preset.id);

		function textarea_input_handler() {
			code = this.value;
			$$invalidate(0, code);
		}

		$$self.$capture_state = () => ({
			onMount,
			code,
			tokens,
			ast,
			parseSteps,
			symbolTable,
			semanticErrors,
			parseErrors,
			hasParseError,
			currentStep,
			isAnimating,
			memoryUsage,
			scopeDepth,
			maxScopeDepth,
			parseStack,
			activeTokenIndex,
			growingNodes,
			typeArrows,
			errorPositions,
			collapsedNodes,
			presets,
			loadPreset,
			analyzeCode,
			animateTokens,
			animateTree,
			animateTypeInference,
			highlightErrors,
			simulateMemoryUsage,
			animateScopeChain,
			animateCollapse,
			delay,
			getTokenColor,
			formatAST
		});

		$$self.$inject_state = $$props => {
			if ('code' in $$props) $$invalidate(0, code = $$props.code);
			if ('tokens' in $$props) $$invalidate(1, tokens = $$props.tokens);
			if ('ast' in $$props) $$invalidate(2, ast = $$props.ast);
			if ('parseSteps' in $$props) parseSteps = $$props.parseSteps;
			if ('symbolTable' in $$props) $$invalidate(3, symbolTable = $$props.symbolTable);
			if ('semanticErrors' in $$props) semanticErrors = $$props.semanticErrors;
			if ('parseErrors' in $$props) parseErrors = $$props.parseErrors;
			if ('hasParseError' in $$props) hasParseError = $$props.hasParseError;
			if ('currentStep' in $$props) currentStep = $$props.currentStep;
			if ('isAnimating' in $$props) $$invalidate(4, isAnimating = $$props.isAnimating);
			if ('memoryUsage' in $$props) $$invalidate(5, memoryUsage = $$props.memoryUsage);
			if ('scopeDepth' in $$props) $$invalidate(6, scopeDepth = $$props.scopeDepth);
			if ('maxScopeDepth' in $$props) maxScopeDepth = $$props.maxScopeDepth;
			if ('parseStack' in $$props) $$invalidate(7, parseStack = $$props.parseStack);
			if ('activeTokenIndex' in $$props) $$invalidate(8, activeTokenIndex = $$props.activeTokenIndex);
			if ('growingNodes' in $$props) growingNodes = $$props.growingNodes;
			if ('typeArrows' in $$props) $$invalidate(9, typeArrows = $$props.typeArrows);
			if ('errorPositions' in $$props) $$invalidate(10, errorPositions = $$props.errorPositions);
			if ('collapsedNodes' in $$props) collapsedNodes = $$props.collapsedNodes;
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			code,
			tokens,
			ast,
			symbolTable,
			isAnimating,
			memoryUsage,
			scopeDepth,
			parseStack,
			activeTokenIndex,
			typeArrows,
			errorPositions,
			presets,
			loadPreset,
			analyzeCode,
			click_handler,
			textarea_input_handler
		];
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, {}, add_css, [-1, -1]);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "App",
				options,
				id: create_fragment.name
			});
		}
	}

	const app = new App({
	  target: document.body,
	  props: {}
	});

	return app;

})();
