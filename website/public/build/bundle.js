
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
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
        flushing = false;
        seen_callbacks.clear();
    }
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
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
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
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Legend.svelte generated by Svelte v3.35.0 */

    const file$3 = "src/components/Legend.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (77:10) {#each data.legend.buckets as bucket, index}
    function create_each_block$1(ctx) {
    	let rect;
    	let rect_width_value;
    	let rect_x_value;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "class", "q-choropleth-legend-bucket");
    			set_style(rect, "fill", getColorClass(/*bucket*/ ctx[2]));
    			attr_dev(rect, "width", rect_width_value = "" + (getAspectWidth(/*data*/ ctx[0].legend, /*bucket*/ ctx[2]) + "%"));
    			attr_dev(rect, "height", /*legendBarHeight*/ ctx[1]);
    			attr_dev(rect, "x", rect_x_value = "" + (getAspectXValue(/*data*/ ctx[0].legend, /*bucket*/ ctx[2]) + "%"));
    			attr_dev(rect, "y", /*legendBarHeight*/ ctx[1] - 4);
    			add_location(rect, file$3, 77, 12, 1669);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1) {
    				set_style(rect, "fill", getColorClass(/*bucket*/ ctx[2]));
    			}

    			if (dirty & /*data*/ 1 && rect_width_value !== (rect_width_value = "" + (getAspectWidth(/*data*/ ctx[0].legend, /*bucket*/ ctx[2]) + "%"))) {
    				attr_dev(rect, "width", rect_width_value);
    			}

    			if (dirty & /*data*/ 1 && rect_x_value !== (rect_x_value = "" + (getAspectXValue(/*data*/ ctx[0].legend, /*bucket*/ ctx[2]) + "%"))) {
    				attr_dev(rect, "x", rect_x_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(77:10) {#each data.legend.buckets as bucket, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let span0;
    	let t0_value = /*data*/ ctx[0].legend.minValue + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*data*/ ctx[0].legend.maxValue + "";
    	let t2;
    	let t3;
    	let div2;
    	let svg;
    	let g;
    	let t4;
    	let div1;
    	let each_value = /*data*/ ctx[0].legend.buckets;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			svg = svg_element("svg");
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div1 = element("div");
    			attr_dev(span0, "class", "legend-value-container--minVal svelte-agu8vk");
    			add_location(span0, file$3, 70, 6, 1346);
    			attr_dev(span1, "class", "legend-value-container--maxVal svelte-agu8vk");
    			add_location(span1, file$3, 71, 6, 1427);
    			attr_dev(div0, "class", "legend-value-container svelte-agu8vk");
    			add_location(div0, file$3, 69, 4, 1303);
    			add_location(g, file$3, 75, 8, 1598);
    			attr_dev(svg, "class", "legend-buckets svelte-agu8vk");
    			add_location(svg, file$3, 74, 6, 1561);
    			attr_dev(div1, "class", "legend-borders s-color-gray-6 svelte-agu8vk");
    			add_location(div1, file$3, 87, 6, 2025);
    			attr_dev(div2, "class", "legend-border-container svelte-agu8vk");
    			add_location(div2, file$3, 73, 4, 1517);
    			attr_dev(div3, "class", "legend-container svelte-agu8vk");
    			add_location(div3, file$3, 68, 2, 1268);
    			attr_dev(div4, "class", "legend svelte-agu8vk");
    			add_location(div4, file$3, 67, 0, 1245);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(span1, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, svg);
    			append_dev(svg, g);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}

    			append_dev(div2, t4);
    			append_dev(div2, div1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*data*/ ctx[0].legend.minValue + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*data*/ ctx[0].legend.maxValue + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*getColorClass, data, getAspectWidth, legendBarHeight, getAspectXValue*/ 3) {
    				each_value = /*data*/ ctx[0].legend.buckets;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getAspectWidth(legend, bucket) {
    	const range = legend.maxValue - legend.minValue;
    	return (bucket.to - bucket.from) * 100 / range;
    }

    function getAspectXValue(legend, bucket) {
    	const range = legend.maxValue - legend.minValue;
    	return (bucket.from - legend.minValue) * 100 / range;
    }

    function getColorClass(legendItem) {
    	if (legendItem.color.colorClass !== undefined) {
    		return legendItem.color.colorClass;
    	}

    	return "";
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Legend", slots, []);
    	let { data } = $$props;
    	let legendBarHeight = 15;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Legend> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		data,
    		legendBarHeight,
    		getAspectWidth,
    		getAspectXValue,
    		getColorClass
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("legendBarHeight" in $$props) $$invalidate(1, legendBarHeight = $$props.legendBarHeight);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, legendBarHeight];
    }

    class Legend extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Legend",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Legend> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Legend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Legend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Map.svelte generated by Svelte v3.35.0 */

    const { console: console_1 } = globals;
    const file$2 = "src/components/Map.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let g0;
    	let path0;
    	let g1;
    	let path1;
    	let g2;
    	let path2;
    	let g3;
    	let path3;
    	let path4;
    	let g4;
    	let path5;
    	let g5;
    	let path6;
    	let g6;
    	let path7;
    	let g7;
    	let path8;
    	let g8;
    	let path9;
    	let g9;
    	let path10;
    	let g10;
    	let path11;
    	let g11;
    	let path12;
    	let g12;
    	let path13;
    	let text_1;
    	let t;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			g1 = svg_element("g");
    			path1 = svg_element("path");
    			g2 = svg_element("g");
    			path2 = svg_element("path");
    			g3 = svg_element("g");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			g4 = svg_element("g");
    			path5 = svg_element("path");
    			g5 = svg_element("g");
    			path6 = svg_element("path");
    			g6 = svg_element("g");
    			path7 = svg_element("path");
    			g7 = svg_element("g");
    			path8 = svg_element("path");
    			g8 = svg_element("g");
    			path9 = svg_element("path");
    			g9 = svg_element("g");
    			path10 = svg_element("path");
    			g10 = svg_element("g");
    			path11 = svg_element("path");
    			g11 = svg_element("g");
    			path12 = svg_element("path");
    			g12 = svg_element("g");
    			path13 = svg_element("path");
    			text_1 = svg_element("text");
    			t = text("Zürisee");
    			attr_dev(path0, "d", "M453.5,403.1c-0.9,1-2.4,1.7-3.5,1.7c-1,0-2.8,1.2-4.1,2.6c-4.3,5.2-6.9,7.1-10.8,8.2c-2.2,0.6-6.9,2.7-10.5,4.8\n      c-7.2,4.3-11.1,5.6-12,4c-0.9-1.3-3.9-1.4-7.8-0.2c-1.7,0.5-5.4,1.5-8.3,2c-3.5,0.7-6,1.8-7.6,3.5l-5.2,5.8\n      c-2,2.1-19.3,14.6-24.2,17.6c-0.5,0.3-2.7,1.9-5.4,4c-0.1-0.2-0.1-0.3-0.2-0.5c-4.5-7.6-9.6-14.8-15.5-21.4c-3-3.4-6.2-6.6-9.5-9.8\n      c-1.7-1.6-3.6-3.1-4.7-5.2c-1.1-2.3-0.9-5.4-0.9-7.9c-0.6-19.5-1.2-39-1.8-58.5c0.5-0.5,1.1-1.1,1.7-1.8c1-1.2,4.8-2.8,6.3-2.8\n      c2.9,0,8.5-3.1,9.5-5.4c1-2,1.2-2.2,5.2-1c2.2,0.7,6,2.2,8.4,3.2c2.3,1.1,5.4,2.1,6.7,2.5c2.5,0.6,14.4,11.6,18.3,16.9\n      c2,2.6,3.5,3.3,13.1,5.6c7.5,1.8,11.7,3.2,13.8,5c1.9,1.7,4,2.4,6.7,2.4c3.1,0,4.5,0.7,7.5,3.7c2,2,4,4.4,4.3,5.3\n      c0.4,0.8,2.7,2.4,5.4,3.6c2.5,1.3,6,3.2,7.6,4.5c1.7,1.2,5,2.4,7.3,2.7c2.4,0.2,6.1,1.1,8.1,1.9C454.9,401.4,455,401.6,453.5,403.1\n      z");
    			add_location(path0, file$2, 40, 4, 1007);
    			set_style(g0, "color", getColor("Kreis 8", /*data*/ ctx[0]));
    			attr_dev(g0, "fill", "currentColor");
    			attr_dev(g0, "stroke-width", "1");
    			attr_dev(g0, "stroke", "currentColor");
    			attr_dev(g0, "class", "Kreis8");
    			add_location(g0, file$2, 34, 2, 862);
    			attr_dev(path1, "d", "M341.3,467c-0.5,0.4-2.4,1.8-4.3,3.1c-3.4,2.4-7.2,5.5-9.3,7.3c-0.6,0.6-2.6,2.1-4.5,3.4c-1.9,1.3-4,2.7-4.4,3.3\n      c-0.3,0.2-0.4,0.2-0.5,0.3c-1.1,1-6.3,5.6-12.1,13.4c-5.9,8-7,8.9-12.8,9.9c-8,1.5-10.9,3.2-11.7,6.9c-0.4,2.3-1.3,3.7-3,4.3\n      c-1.4,0.6-2.3,1.7-2.3,2.9s-0.7,2-2,2c-1.1,0-2.8,0.9-4,2c-1.1,1.1-2.6,1.8-3.3,1.5c-0.8-0.3-1.7-0.1-2,0.5s-1.2,0.8-2,0.5\n      c-2.3-0.9-4.3,0.5-4.3,3.2c0,2.8-0.9,4.4-2.5,4.7c-9.4,1.8-15.6,3.4-15.8,4.2c-0.2,0.5-2,1-4.1,1c-1.9,0-4.2,0.6-4.8,1.3\n      c-0.6,0.8-2.2,1.2-3.7,1c-1.8-0.3-4.8,0.6-8.5,2.5c-3.6,2-7.1,3-9.8,3c-5.3,0-11.1,1.7-14.6,4.2l-2.8,2l-2.3-2.8\n      c-2-2.3-2.3-3.6-2.2-8.7c0.1-3.2,0.8-8.2,1.6-10.8c1.8-6.9,1.6-14-0.7-18.9c-2.4-5.4-2.4-9.5,0-13.6c1.5-2.4,2-4.9,2-10.3\n      c0-8.3,3.3-21,7.3-28.1c2.5-4.6,7.5-9.6,9.5-9.6c0.6,0,3.3-1.1,6.2-2.3c5-2.4,5.1-2.4,12.2-1c3.9,0.9,8.3,1.3,9.7,0.9\n      c7.9-2,9.1-9.5,3.4-21.5c-3.3-6.9-3.4-7.5-2-9.7c1-1.5,4.9-3.6,11.1-6c10.7-4.2,14.5-7.2,15.5-12.8c0.6-2.9-0.8-22.4-2-29.7\n      c-0.1-0.8-0.6-4.1-0.9-7.3c-0.4-3.2-1.4-7.7-2.2-9.9c-1.4-3.8-1.4-4.4,0.6-8.7c2-4.5,8.7-12.5,12.1-14.3c1-0.5,3.8-1.1,6.2-1.4\n      c2.7-0.2,5-1.1,5.8-2c0.5-0.8,1.1-1.2,1.3-1.1c0.2-0.2,0.5-0.3,0.8-0.5c0.5-0.3,1-0.6,1.6-0.8c1.4-1.1,2.3-1,3.8,0.5\n      c0.4,0.2,0.8,0.6,1.1,0.9c0.5,0.4,1.1,0.7,1.5,0.7c0.3,0,0.6,0.2,0.8,0.4c0.7,0.3,1.3,0.8,1.7,1.3c1.2,0.6,3.2,3,6,7.1\n      c5.3,7.8,8.1,12,9.4,14.3c0.2,0.2,0.3,0.4,0.5,0.5l0.7,0.7c0.3,0.2,0.5,0.5,0.7,0.8c0.1,0.1,0.2,0.2,0.2,0.3\n      c0.5,0.4,0.9,0.9,1.2,1.4c0.2,0.1,0.3,0.3,0.4,0.4c0.6,20.7,0.7,41.5,1.9,62.2c0.6,9.5,7.5,13.9,13.6,20.3\n      c6.8,7.2,12.7,15.2,17.8,23.8c0.3,0.5,0.6,0.8,0.9,1.1C345.9,463.4,343.1,465.5,341.3,467z");
    			add_location(path1, file$2, 56, 4, 2039);
    			set_style(g1, "color", getColor("Kreis 2", /*data*/ ctx[0]));
    			attr_dev(g1, "fill", "currentColor");
    			attr_dev(g1, "stroke-width", "1");
    			attr_dev(g1, "stroke", "currentColor");
    			attr_dev(g1, "class", "Kreis2");
    			add_location(g1, file$2, 50, 2, 1894);
    			attr_dev(path2, "d", "M337.4,323.7c1.7,1.4,2,6.4,0.5,7.3c-0.6,0.4-2.1,2.7-3.4,5.3c-1.6,3.1-3.3,5.1-5.3,6c-1.7,0.7-3,1.6-3,2.1\n      s-0.7,0.6-1.4,0.3c-0.8-0.3-2.7,0.2-4.4,1.2c-2.8,1.7-2.9,1.7-4.9-0.7c-1.1-1.3-2.2-3.4-2.5-4.7c-1.3-5.2-12.5-18.6-15.3-18.6\n      c-0.8,0-2.2-0.9-3.2-2c-2.1-2.2-9.1-2.7-11.1-0.8c-2.1,2.1-0.2-4.1,2.8-9c1.6-2.4,3.4-6.1,4.3-8.1c0.6-1.5,1.4-2.8,2-3.3\n      c0.3-0.6,0.7-1.2,1.2-1.7c0.2-0.4,0.6-0.8,1.2-1.2c6.1-4.3,11.4-17.4,11.8-28.8c0.2-5.2,1.1-5.2,3.5,0c1,2,1.8,3.8,1.9,4.1\n      c0.4,2.1,1.9,3.9,2.9,3.9c0.8,0,2.3,0.9,3.5,2s3.1,2,4.4,2c1.5,0,2.2,0.6,2.2,1.7c0,2.8,4,6.2,7.4,6.2c2.6,0,3.5,0.6,4.7,3.1\n      c2.5,5.6,3.9,14.4,2.5,16.1c-0.2,0.2-0.3,0.6-0.4,1c-0.1,0.5-1.2,2.7-2.4,5.1C334.5,316.5,334.7,321.6,337.4,323.7z");
    			add_location(path2, file$2, 78, 4, 3864);
    			set_style(g2, "color", getColor("Kreis 1", /*data*/ ctx[0]));
    			attr_dev(g2, "fill", "currentColor");
    			attr_dev(g2, "stroke-width", "1");
    			attr_dev(g2, "stroke", "currentColor");
    			attr_dev(g2, "class", "Kreis1");
    			add_location(g2, file$2, 72, 2, 3719);
    			attr_dev(path3, "d", "M337.5,380l-1-17.7l-3.6-12.8c0.4,0.5-3-3.5-3-3.5l-1.3-1.5l-0.9-1c0,0-0.3-0.4-0.6-0.8l-0.6-0.7l-2.8-5.2\n      l-13.6,7c0,0.5-0.9,2-2.2,3.5l2.2,4.8l0.2,2.6l0.2,3.2l-8.9,13.7l-4.6,52.9l3.1,17.7l1.7,14.3l6,12.1l12.5,15.6\n      c5.3-4.6,10.6-9.1,16.2-13.3c13-9.9,26.7-19.8,40.4-28.7c0,0-12.8-32.4-13.6-33.8l-20.8-10.1");
    			add_location(path3, file$2, 92, 4, 4742);
    			set_style(g3, "color", "lightblue");
    			attr_dev(g3, "fill", "currentColor");
    			attr_dev(g3, "stroke-width", "1");
    			attr_dev(g3, "stroke", "currentColor");
    			attr_dev(g3, "class", "lake");
    			add_location(g3, file$2, 86, 2, 4617);
    			attr_dev(path4, "d", "M584.5,376.8c-3.7-2.2-4.7-5-3.1-8.8c2.8-6.9-4.7-14-15.8-14.7l-6.6-0.5l0.1-5c0.1-3.2,0.7-5.2,1.7-5.7\n    c2.2-1.3,5.9-11.2,5.2-14.2c-1.9-7.4-10.8-9.7-17.6-4.4l-3.5,2.8l-6.2-2c-3.5-1.1-7.4-3.1-9.4-5c-6.7-6.2-9.9-9.6-9.9-10.4\n    c0-0.5-1.2-2-2.6-3.2c-7.8-6.8-14.8-15.3-15.9-19.2c-0.7-2.8-1.5-7.2-2-10.5c-0.3-0.8-0.6-1.7-1-2.6c-0.2-0.6-1-2-1.8-3.3\n    c-0.5-0.5-1-1-1.4-1.5c-0.8-0.5-1.5-1.3-2.1-2.1c-0.8-1.3-3-3.3-5-4.5c-1.8-1.2-4.1-3.4-4.9-4.9c-1.3-2.5-1.3-3.2,0.6-7.2\n    c3.6-8.2-0.2-15.9-8.6-17.8c-0.6-0.1-2.6-0.7-4.5-1.3c-3.1-1.1-3.4-1.5-3.9-6.2c-0.7-6-3.9-9.5-8.6-9.5c-1.6,0-2.8-0.3-2.8-0.8\n    c0.1-0.9,1.9-3.2,2.6-3.6c0,0,0,0,0-0.1c0.2-0.2,0.4-0.4,0.6-0.5c0.3-0.2,0.5-0.4,0.9-0.6c0.4-0.2,0.8-0.4,1.3-0.5\n    c0.3-0.1,0.6-0.3,0.9-0.4c0.2-0.1,0.4-0.1,0.6-0.2c0.5-0.3,1-0.6,1.6-0.8c3.7-1.8,11.1-9.1,11.1-10.7c0-1.3-1.5-2.7-3.1-3.4\n    c-1-0.3-1.8-1.2-1.8-1.8c0-0.9,2.1-1,7.7-0.6c6.1,0.5,8,0.3,8.9-0.8c0.9-1.1,1.7-1.2,3-0.4c2.5,1.4,3.4,0.6,6.4-5.5\n    c2.8-6.2,2.3-8.2-2.5-10.2c-1.7-0.7-2.8-1.5-2.7-1.9c4-7.8,4.1-7.8,2.8-10.4c-0.6-1.4-2-2.7-3-3c-2.2-0.6-2.3-1.2-0.8-4.9\n    c0.6-1.5,1.2-3.2,1.4-3.9c0.1-0.6,1.2-2.3,2.3-4c1.2-1.6,2-3.9,1.8-5.2c-0.3-2-1.1-2.4-6.6-3.5c-11.5-2.2-12.2-2.3-13.1-3.3\n    c-0.6-0.5-1.7-0.9-2.4-0.9c-0.9,0-2.8-0.7-4.4-1.6c-1.7-0.8-7.9-3.4-14.1-5.9c-10.5-4.2-15.5-5.5-25.7-6.7c-2.8-0.4-5.7-1.6-7.7-3.3\n    l-3.3-2.7l1.4-4.6c1-3.4,1.1-8.3,0.6-18.9c-0.7-16.7-1.6-18.6-6.4-15c-1.7,1.2-4.3,2.2-6,2.2c-4.3,0-8.3,2.3-9.8,5.9\n    c-0.4,0.9-0.8,1.6-1.3,2.2c-0.2,0.8-0.6,1.6-1.2,2.2c-0.6,1.8-6,5.4-8.4,5.4c-1.5,0-3.2-1.2-4.8-3.2c-4.4-5.7-7.5-8.1-15.9-12.2\n    c-4.6-2.2-8.9-4.1-9.4-4.1c-0.6,0-1.1-0.5-1.1-1c0-0.6,0.5-1,1.2-1c0.6,0,0.8-0.3,0.5-0.7c-0.4-0.3,0.4-2,1.7-3.7\n    c3-3.9,8.4-14.9,8.4-17.2c0-0.9-0.7-1.9-1.4-2.2c-2.1-0.9-4.6-6-6.7-14.3c-1-4-1.8-7.8-2-8.4c0-0.6-1.6-2-3.4-3.3\n    c-2.9-2-4.3-2.3-11.5-2.2c-7.2,0.2-8.4,0-10.2-1.8c-2.2-2.2-15.5-6-18-5.2c-0.8,0.4-1.5,1.7-1.5,2.9c0,2-0.5,2.3-2.8,2.3\n    c-1.7,0-3.2,0.4-3.5,1c-0.3,0.5-3.8,1-7.6,1c-5.4,0-7.7-0.5-10-2c-1.8-1.3-4.6-2-7.5-2c-2.4,0-7.3-0.9-10.7-2\n    c-10.8-3.4-15.3-2.3-16.9,4.1l-0.7,2.6L239,20.4c-7.6,0.3-15.4,0.8-17.4,1.2c-2.8,0.6-4.5,0.1-8.8-2.3c-2.9-1.6-10.2-4.9-16.3-7.3\n    c-9.3-3.8-12.2-4.5-17.6-4.5c-6,0-7.1,0.4-12.9,3.9c-7,4.3-15.4,7.4-22.9,8.3c-9.5,1.3-14.7,3.2-18,6.8c-2.6,3-3,4.2-3,8.9\n    c0,2.9,0.6,6.5,1.4,8c1.4,2.6,7.9,7,10.5,7c3.1,0,7.7,7.1,7.6,11.8c-0.1,1.8-9.3,6-12,5.4c-1.2-0.3-3.2-1.5-4.5-2.6\n    c-2.9-2.7-7.9-3.1-10.1-0.8c-1,1-1.8,2.2-1.8,2.7c0,1.7-2,2.2-3.4,1.1c-0.8-0.7-1.5-0.9-1.5-0.4s-0.4,0.3-0.8-0.4\n    c-1.2-1.7-4.8-2.2-5.9-0.9c-0.6,0.7-1.5,3.8-2,6.9c-1.9,10.3-7,15.1-17.3,16.1c-4.7,0.5-6.8,1.3-7.8,2.5c-1.6,2.2-1.8,6-0.4,6.8\n    c1.6,1,1.1,4.7-1,7.8c-2.1,3.2-2.5,9.3-0.8,11c0.7,0.7,2.1,1.2,3.4,1.2c1.5,0,2.2,0.6,2.2,1.8c0,1,0.7,2.7,1.6,3.9\n    c1.2,1.8,2.4,2.2,6.2,2.2c4.9,0,7.1-1.3,8.3-4.9c0.3-1.1,1.3-1.9,2-1.9c1.1,0,1,0.7-0.7,2.8c-2.5,3.5-1.8,8.5,1.5,10\n    c1.8,0.9,2.2,1.8,2,7c0,3.3,0.4,7.7,0.8,9.7c0.7,3.3,0.6,3.7-1.1,3.7c-1.1,0-4.8,0.9-8.3,2c-3.5,1.1-9.6,2.3-13.5,2.8\n    c-4.7,0.7-7.6,1.6-8.9,2.8c-1.8,1.8-5.1,14.2-4.3,16.4c0.2,0.6-0.7,1.7-2,2.4c-2,1-2.3,1.8-1.8,3.7c0.8,2.9,2.5,4.4,8.3,6.6\n    c2.4,0.9,4.9,2.2,5.6,2.7c0.7,0.5,1.8,1.6,2.6,2.1c0.8,0.7,2.8,1.3,4.5,1.3h3l-1.8,2.3c-1.2,1.6-2.2,2.1-3.2,1.6\n    c-0.8-0.4-3.6-1-6.3-1.4c-2.6-0.3-6-0.9-7.5-1.2c-1.8-0.4-3.1,0-4.6,1.5c-2.9,2.9-2.5,4.7,1.9,8.8c2.4,2.2,4,4.7,4.4,6.7\n    c0.5,2.9,0.4,3.1-1.4,2c-2.5-1.6-8.1,1-10.5,4.8c-1,1.5-2,2.9-2.2,3.2c-0.4,0.3-1.4,2.3-2.2,4.6c-2.6,6.6-5.7,13.2-6.8,14\n    c0,0.2-0.1,0.4-0.3,0.6c-0.1,0.2-0.2,0.3-0.3,0.5c-0.1,0.3-0.2,0.5-0.3,0.7c-0.2,0.6-1.1,1.9-2.1,3.1c-1.3,1.4-2.3,2.7-2.4,3.1\n    c-0.1,0.4-0.5,1.5-0.8,2.2c-0.4,0.8-0.4,2.6-0.2,3.9c0.4,2,0.1,2.4-1.7,2.4c-1.8,0-2.3,0.7-2.8,3.8c-0.3,2.2-1.2,4-1.8,4.3\n    c-0.7,0.3-4.8,0.3-9.1,0c-6.2-0.4-8.5-0.1-11.2,1.4c-3.1,1.6-3.4,2.2-3.4,6.2c0,4.2,0.2,4.5,4.9,7.6c4.6,3,5.3,3.2,12.7,3\n    c11.5-0.4,20.8,1.6,25.2,5.4c1.9,1.7,5.4,4.1,7.6,5.5c2.2,1.4,6.1,4.1,8.6,6c3.6,3,5.3,3.7,8.6,3.7c3.4,0,4.2,0.3,4.2,1.8\n    c0,2.6-4.7,8.2-9.2,10.9c-4.2,2.6-7.8,6.1-8,6.8c-0.1,0.4-0.3,0.6-0.8,1.6c-1.8,1.7-2,7.4-0.7,10.1c0.6,1,3.8,3.4,7.3,5.5\n    c8.8,5.1,10,6.4,10.8,11.9c1.1,7.4,2.9,10.4,8.1,13.1c4,2.1,6,2.3,14.9,2.4c11.3,0,13.8,0.9,17.2,5.9c1,1.5,3.1,3.9,4.7,5.6\n    c2.2,2.2,2.9,3.9,3.1,7.3c0.2,3.6,0.9,5.1,3.9,8.2c3.1,3.2,3.7,4.5,3.7,7.9c0,3.9,0.2,4.1,6.8,8.6c3.8,2.4,8.4,6.4,10.4,8.8\n    c3.3,4,8.2,9,14.7,14.7c1.5,1.4,3.1,3.6,3.7,5.2c0.9,2.3,0.7,3-1,4.9c-2.6,2.8-2.4,6.5,0.5,9.3c1.4,1.3,2.2,2.4,2,2.7\n    c-1.2,1.1,2.6,9.7,5.6,12.8c5.7,6.1,7.1,9.6,7,16.9c-0.1,3.6-0.7,7.1-1.2,7.8c-3.7,4.7-3.8,14-0.3,20.6c2.4,4.4,2.4,5.2,0,14.8\n    c-3.2,12.9-2.2,21.3,3,26.9c3.2,3.5,9,3.9,12.8,0.9c3.5-2.7,6.4-3.6,14.8-4.8c5.1-0.7,8.2-1.7,9.6-3c2.1-2,3.4-2.3,7.3-2\n    c1.2,0.1,3.1-0.4,4.4-1.1c1.3-0.7,3.2-1.2,4.4-1c1.3,0.1,3.5-0.7,5.1-1.8c1.8-1.4,4.4-2,7.2-2c2.4,0,4.8-0.5,5.1-1\n    c0.4-0.6,1.5-0.8,2.4-0.5c2,0.7,4.7-1.7,5.5-5c0.4-1.5,1.3-2.3,2.4-2.3c1,0,1.8-0.5,1.8-1c0-0.6,0.5-1,1.1-1c0.6,0,2.4-0.6,4.1-1.4\n    c1.8-0.8,4.2-1.6,5.6-1.8c1.6-0.2,2.5-1,2.7-2.2c0.1-1.1,1.6-2.7,3.1-3.6c2-1.2,2.8-2.4,3.1-4.9c0.3-3.1,0.5-3.3,6.6-4.8\n    c8.5-2,10.1-3,14.6-9c2.2-2.8,4.4-5.6,4.9-6.2c0.6-0.7,1-1.7,1-1.7s7.9-9.5,12.1-12.2c1.3-0.9,5.7-4.3,9.8-7.7l9.2-6.8\n    c3.9-3.7,8.2-7.2,10.8-8.8c6.9-4.1,28.7-20.3,33-24.5c2.5-2.5,5.6-5,6.6-5.4c1-0.4,6-0.7,11-0.7c9.5,0,15.8-1.8,22.5-6.6\n    c1.5-1,4.6-2.3,7-3c5.1-1.4,11.1-5.4,12.8-8.5c0.7-1.3,2-2.2,3-2.2c3.1,0,5.6-1.8,7.5-5.8l2-3.7l8.1,0.5c4.9,0.3,9.5,1.1,11.5,2.2\n    c4.9,2.4,8.1,3,15.7,3c5.6,0,7.1,0.4,8.6,2.1c1.1,1.1,3.6,2.1,5.8,2.4c5.2,0.7,8-2,8-7.5c0-5.9,2.7-7.2,12.7-6.4\n    c6.6,0.6,8.4,0.4,12.3-1.3c2.5-1.2,6-2,7.8-2s4.3-0.5,5.7-1.1c1.8-0.9,3.8-0.6,10.2,1.5c8,2.7,12.5,2.8,16.8,0.7\n    c4.8-2.5,6.8-5.2,6.8-8.9C592,383.4,590.4,380.6,584.5,376.8z\n    M388.1,98.6c9-2.5,10.2-3.3,12.9-8.6c3.5-7,4-7.4,8.3-7.4h3.9\n    l-0.6,12.9c-0.3,7.1-0.7,15.1-1,17.7c-0.3,3.7-0.1,4.9,1.2,5.3c1,0.4,3.1,1.9,4.8,3.3c1.8,1.5,4.9,3,6.8,3.3c13,2,19.7,3.6,26.8,6.8\n    c15.6,6.9,29.3,11.8,33.6,12.1c0.7,0.1,0.4,1.7-0.9,4.2c-1.1,2.2-2.2,6.4-2.4,9.1c-0.4,5-0.3,5.2,2.6,6.2l3,1.1l-2,4.2\n    c-2.6,5.8-2.5,6.2,1.9,9.4c2.7,2,3.6,3.1,2.8,3.9c-0.6,0.6-1.6,0.8-2.2,0.5c-0.8-0.2-2.3,0.1-3.6,0.8c-1.3,0.8-4.5,1.2-7.3,1\n    c-3.8-0.2-6.4,0.3-9.6,1.8c-5.4,2.6-6.5,5.8-3.7,9.6c1.7,2.2,1.8,2.9,0.7,3.9c-1.9,1.7-9.8,6.3-10.9,6.3c-0.2,0.2-0.5,0.3-0.8,0.5\n    l-0.1,0.1c-0.4,0.5-1,1.2-1.6,2.2c-2.5,3.8-4.7,10.2-3.7,11.2c0.4,0.4-0.2,0.2-1.4-0.4c-1.2-0.6-2.8-2.2-3.7-3.5\n    c-3.3-5.2-8.6-6.4-12.6-2.9c-2.6,2.2-3.6,2.4-7.8,1.9c-7.1-1-15.5-4.4-18.3-7.6c-6.4-7.2-12.7-13.4-15.7-15\n    c-4.6-2.6-7.4-5.6-9.1-9.5c-0.8-2-2.5-4.2-3.9-5.1c-3.3-2.2-10-2.9-14.7-1.6c-2,0.6-4,0.8-4.2,0.6c-0.3-0.2,1.3-2.7,3.4-5.6\n    c6-7.7,7.4-11.2,6.7-15.5c-0.5-3-0.2-4.1,1.9-6.3c1.3-1.4,2.6-4.1,3-6c0.6-3.1,0.1-14.2-1.2-28.6\n    C368.6,105.3,370.6,103.6,388.1,98.6z\n    M375.6,225.2c-1-0.1-3.7,1.9-6,4.2c-2.2,2.4-4.8,4.5-5.5,4.7c-2.7,0.6-5.8,4.3-8.2,9.8\n    c-2,4.5-6.9,9.9-8.7,9.9c-0.1,0-0.1,0.1-0.2,0.1c-0.1,0-0.1,0-0.2,0.1c-0.4,0.2-0.8,0.4-1.1,0.6c-0.1,0.1-0.3,0.1-0.4,0.2\n    c-0.4,0.3-0.8,0.8-1.2,1.2c-2.5,2.7-3.1,7.1-1.2,9.1c0.4,0.4,0.7,0.8,0.7,1c0.1,0.2,0.2,0.4,0.3,0.7c0.2,0.4,0.4,0.7,0.5,1.1\n    c0.2,0.3,0.5,0.6,0.8,0.9c1.4,1.5,2.4,3,2.4,3.4c0,0.5-1.6,2.6-3.5,4.8c-3.1,3.4-4.1,3.9-7.7,3.9c-3.3,0-4.4-0.4-4.9-1.8\n    c-1-3.1-4.4-6.9-6.2-6.9c-1,0-2.5-1.1-3.5-2.3c-1-1.3-2.2-2.1-2.9-1.9c-0.6,0.3-1.9-1.3-2.7-3.3c-1.5-3.4-16.3-20.1-16.3-18.5\n    c0,0.4-1.8-0.5-3.9-1.8l-4-2.6l2.8-3c4.2-4.4,5.3-7,5.3-12.5l-14.3-44.7c-0.4-6.7-1.4-11.6-3.5-18.1c-1.7-4.9-3.1-9.3-3.2-9.8\n    c-0.1-0.6-2.3-3-5.1-5.7c-2.6-2.5-4.9-5-4.9-5.4c-0.1-0.4-0.6-1.6-1.2-2.6c-1.8-3.4,0.6-9.4,3-7.4c0.6,0.5,3.5,1.8,6.4,3.1\n    c2.9,1.3,8.8,4.2,12.9,6.4c4.2,2.2,8.6,4.4,10,4.8c3.3,0.8,6.4,4.6,5.8,7.3c-0.3,1.8,0.4,2.8,3.1,4.7c6,4,9.4,8.6,9.1,12.4\n    c-0.3,4.8,1.3,6,5.8,4.4c3.4-1.3,3.7-1.2,5,0.8c2.5,3.7,6.1,2.6,11.8-3.5c4.4-4.7,5.4-5.3,6.1-3.9c0.5,0.9,1.5,1.7,2.2,1.7\n    c1.1,0,1.1,0.5-0.1,2.8c-1.4,2.7-1.4,4.9,0,8.1c1.1,2.3,6.5,3.1,13,1.8c6.5-1.3,8.7-0.4,10.5,4.1c1.8,4.2,5.3,7.9,9.9,10.2\n    c2.1,1.1,4.8,2.9,6,4.1c1.2,1.1,2.2,1.8,2.2,1.5c0-0.4,1.1,0.7,2.4,2.2c1.4,1.7,2.4,3.2,2.4,3.6c0,0.4,0.7,1.3,1.6,2\n    c1.4,1,0.8,1.8-4.8,6.6c-3.5,3.1-6.8,6.9-7.5,8.6c-0.8,1.8-1.8,2.8-2.7,2.6s-1.4-0.7-1.3-1.3C381,226.6,378.4,225.3,375.6,225.2z\n    M337.3,323.7c1.7,1.4,2,6.4,0.5,7.3c-0.6,0.4-2,2.7-3.4,5.3c-1.6,3.1-3.3,5.1-5.3,6c-1.7,0.7-3,1.6-3,2c0,0.4-0.7,0.6-1.4,0.3\n    c-0.8-0.3-2.7,0.2-4.4,1.2c-2.8,1.7-2.9,1.7-4.9-0.7c-1.1-1.3-2.2-3.4-2.5-4.7c-1.3-5.2-12.5-18.7-15.3-18.7c-0.8,0-2.2-0.9-3.2-2\n    c-2-2.2-9.1-2.7-11.1-0.8c-2.2,2.1-0.2-4.1,2.8-9c1.6-2.4,3.4-6,4.3-8.1c0.6-1.5,1.4-2.8,2-3.3c0.3-0.6,0.7-1.2,1.2-1.7\n    c0.2-0.4,0.6-0.8,1.2-1.2c6-4.3,11.4-17.4,11.8-28.8c0.2-5.2,1.1-5.2,3.5,0c1,1.9,1.8,3.8,1.9,4.1c0.4,2,1.8,3.9,2.9,3.9\n    c0.8,0,2.3,0.9,3.5,1.9c1.2,1.1,3.1,2,4.4,2c1.5,0,2.2,0.6,2.2,1.7c0,2.8,4,6.1,7.4,6.1c2.6,0,3.5,0.6,4.7,3.1\n    c2.5,5.6,3.9,14.4,2.5,16.1c-0.2,0.2-0.3,0.6-0.4,1c-0.1,0.5-1.2,2.7-2.4,5.1C334.5,316.5,334.7,321.6,337.3,323.7z\n    M196.6,252.2\n    c-2.2-2.4-2.5-3.1-1.5-4.7c2.5-4.2,0.9-8.8-3.3-8.8c-1.2,0-2.5-0.6-3.1-1.3c-0.6-0.7-3.7-2.5-7-4.1c-3.2-1.6-5.9-3.4-5.9-4.2\n    c0-2.2,3.9-7,5.7-7c0.9,0,3.2,1,5.1,2c1.8,1.2,4.3,2.8,5.4,3.8s9.4,5.6,18.4,10.2c9.2,4.6,17.3,9,18.1,9.8c0.9,0.7,3.1,1.8,5,2.4\n    c1.8,0.7,4.3,1.7,5.4,2.2c6,2.6,15.6,5.8,19.2,6.2c2.3,0.4,5.3,1.2,6.6,1.8c7.6,4,15.7,8.4,17.7,9.7c1.3,0.8,3.9,1.8,5.8,2.2\n    c2.6,0.6,7.1,2.2,10.5,4c1.3,0.7-5.2,11.5-9.6,16c-2.9,2.9-4.9,6.2-4.9,8.3c0,0.8-1.3,2.8-2.8,4.6c-1.6,1.8-3.1,4.8-3.5,6.6\n    c-0.8,3.7-3.1,8.8-4,8.8c-1.3,0-9.1-6.5-16.5-13.7c-15.4-15-18.5-17.6-21.4-17.6c-1.3,0-3.7-1-5.6-2.2c-1.9-1.2-6.7-3.7-10.9-5.5\n    c-4.2-1.9-8.9-4.5-10.4-5.9c-6.1-5.5-8.4-7.3-11.5-9.2l-3.1-1.8l2.4-2.9C199.9,258.3,199.9,255.7,196.6,252.2z\n    M189.2,210.5\n    c-0.4-1.5,0-1.9,1.3-1.9c1,0,2.7-1.1,4-2.5c2.2-2.3,2.6-2.4,12.6-2.1l10.2,0.3l12.7,6c7,3.3,14.2,6.4,15.9,6.6\n    c1.8,0.3,5,1.2,7.1,1.8c4.3,1.5,14.5,7.4,14.2,8.3c-0.2,0.5,2,3.2,8.6,10.4c1.1,1.2,3,2.7,4.4,3.4c1.3,0.7,5,3.3,8.3,5.9\n    c3.2,2.5,7.3,5.4,9.1,6.4c2.9,1.7,3.1,2.2,3.1,7.2c0,2.9-0.3,6.3-0.6,7.4l-0.6,2l-6.3-2.2c-3.5-1.3-6.7-2.7-7-3.2\n    c-0.3-0.6-2.9-1.8-5.9-3c-2.8-1.1-6.8-3-8.8-4.3c-4.5-2.9-8.4-4.3-13.4-4.9c-2.2-0.3-6.4-1.6-9.3-2.9C225.2,238.3,200,225,193.3,220\n    c-3-2.2-5.7-4.2-5.9-4.4c-0.2-0.1,0.2-0.9,0.9-1.8C189.2,213.1,189.5,211.5,189.2,210.5z\n    M137.5,44.4c-6.2-2.3-8.6-4.7-8.6-8.8\n    c0-3.4,4.7-7.4,9.6-8.2c15.6-2.5,19.5-3.7,29-8.8c5.4-2.9,10.8-5.4,12.2-5.4c1.3,0,5.9,1.6,10.2,3.5c4.3,2,11.9,5.5,16.9,7.8\n    c9.5,4.5,14.8,5.4,20.4,3.2c1.5-0.6,9-1.2,16.7-1.2c14.8-0.2,15.8-0.5,15.8-5.3c0-3.1,1.4-3.5,7-1.8c2.7,0.8,6.8,1.5,9,1.5\n    c2.3,0,5.7,0.9,7.9,2.2c3.1,1.8,6,2.2,14.5,2.5c7,0.3,11,0,11.7-0.7c0.6-0.6,3.2-1.1,5.9-1.1c3.9,0,4.9-0.3,5.3-2\n    c0.4-1.6,1.1-1.8,3.1-1.3c1.4,0.3,2.7,1,2.8,1.5c0.2,0.4,1,0.8,1.7,0.8s1.5,0.6,1.8,1.2c0.2,0.9,3.1,1.3,9.9,1.3\n    c10.4,0,12.3,1,12.3,6.2c0.1,1.4,1,5,2,7.9c1.1,2.9,2,5.8,2.2,6.4c0.1,0.5,0.9,1.8,1.8,2.7c1.1,1.2,1.5,2.6,1,3.9\n    c-0.7,2.6-6.7,11.9-7.8,12.4c-0.2,0.4-0.5,0.8-0.9,1.2c-0.2,1-0.3,2.7-0.5,5.7l-0.2,4.4l10.2,5.1c10,5.1,14.1,7.9,15.8,11.1\n    c0.7,1.3-0.1,2.1-3.8,4c-4.9,2.5-9.8,9.1-10.1,13.5c-0.1,2.3,0.7,11.5,1.8,20.8c0.7,5.7-1.1,13.4-3.7,16.2c-1.2,1.4-2.2,4.4-2.7,8.1\n    c-0.6,3.7-1.6,6.7-2.7,7.8c-1.8,1.9-2,1.9-3.6,0.2c-1-1-3.1-1.8-4.8-1.8c-3.4,0.1-11,4.7-11.8,7.3c-0.5,1.6-0.8,1.6-3.4,0.2\n    c-1.7-0.8-3.7-1.2-4.8-0.8c-1.4,0.4-2-0.1-2.3-2.2c-0.5-2.5-8.8-12-10.5-12c-0.4,0-1.1-1.7-1.5-3.6c-0.7-3.8-6.2-10.1-8.9-10.1\n    c-1.8,0-11-4.6-13.3-6.6c-1-0.8-1.8-1.1-1.8-0.6s-0.4,0.4-0.8-0.1c-1.5-2-17.8-9.4-19.4-8.8c-3.1,1.1-8.3,8.5-7.8,11\n    c0.6,2.9-0.8,1.7-3-2.8c-1.1-2.2-3.3-4.1-6.5-5.8c-8.5-4.3-11.7-6.4-13-8.1c-1.5-1.8-7-2.2-10-0.7c-1.4,0.8-2.9,0.6-5.6-0.6\n    c-2-0.9-7.3-2-11.8-2.3c-5.3-0.6-9.3-1.6-11.5-2.8c-1.8-1.2-4-2-4.7-2s-2.2-1.2-3.6-2.5c-1.7-1.8-3.1-2.3-4.9-2.2\n    c-2.3,0.4-2.6,0.1-3.1-3.4c-0.7-5-2.4-6.7-11.5-11.6c-4.2-2.2-7.4-4.4-7.2-4.7c0.7-1.1-5.4-7.8-6.9-7.8c-0.8,0-1.4-0.4-1.4-0.9\n    s-0.8-1.2-1.7-1.5c-1-0.3-2.9-1.7-4.3-2.9c-1.5-1.4-2.9-2.1-3.2-1.8c-0.3,0.4-0.6,0.1-0.6-0.5c0-0.7,0.4-1.2,0.8-1.2\n    c0.5,0,1.5-1.8,2.2-3.9c1.2-3.5,1.1-4.4-0.4-7.6c-1-2-2-4.7-2.2-6C145.2,47.7,144,46.6,137.5,44.4z\n    M95.8,112.8\n    c-4.5,0-5,0.3-6.9,3.4c-2.3,3.7-3.9,3.7-3.9-0.1c0-1.6-1-2.9-2.8-4.1c-2.4-1.5-2.7-2-1.8-3.6c0.6-1.1,1.4-4.4,1.7-7.3\n    c0.3-3.5,0.9-5.3,1.7-5.2c0.7,0.2,3.3-0.2,5.9-0.7c7.1-1.6,13.5-7.4,15.5-14.2c0.8-2.8,1.2-5.8,0.8-6.4c-0.6-1-0.4-1.1,0.7-0.1\n    c2.1,2.1,7.8,1.6,10.4-0.9c1.3-1.2,2.2-2.8,2.2-3.6c0-1,0.3-1.2,0.8-0.5c0.4,0.5,1.8,1.8,3.1,2.6c1.6,1.1,4.4,1.7,8.3,1.7\n    c3.8,0,7.2,0.7,9.8,1.9c6.5,3.2,14.4,9.5,15.9,12.7c0.8,1.7,2.4,3.4,3.6,3.9c1.1,0.4,2.6,1.6,3.4,2.4c0.8,1,3.2,2.5,5.4,3.4\n    c5,2.2,6.2,3.7,7,8.5c0.7,4.3,3.8,10.1,5.6,10.1c0.7,0,2-0.6,3-1.4c1.6-1.1,2.3-0.9,6.2,1.8c4,2.6,5.6,3.1,13.8,3.6\n    c5.7,0.4,10.5,1.3,12.4,2.2c4.2,2.2,9,2.9,12,1.8c1.9-0.7,3.2-0.4,6.3,1.6c2.2,1.4,4.8,3.3,6,4.3c1.1,1,2.7,1.8,3.6,1.8\n    c1.8,0,7.2,4.7,7.4,6.3c0.1,0.5,1.1,2,2.2,3.3c1.5,1.7,2.7,2.2,4.8,1.9c1.9-0.3,3,0.1,3.6,1.3c0.4,1,2.6,3.7,5,6.1l10.9,30.9\n    c0,7.9,2,15,6.5,23.3c5.9,10.5,6.9,13,7.6,17.8c0.6,3.8,0.3,5.2-1.5,8.1c-3.9,6.3-6.6,6.4-11.7,0.5c-12.5-14.8-19.7-19.7-32.2-21.9\n    c-1.8-0.3-8.8-3.3-15.3-6.6l-11.9-6l-11.1,0.1c-8.9,0.2-11.4-0.1-12.4-1.3c-0.7-0.8-1.8-1.5-2.5-1.5c-0.8,0-1.4-0.5-1.4-1\n    c0-0.6-0.6-1-1.3-1c-1.2,0-1.8-0.6-8.7-8c-2.1-2.2-4.9-4-7.7-4.7c-2.3-0.7-5.6-2-7.1-3.2c-3.6-2.5-10.2-2.6-16.4-0.3\n    c-5.6,2.2-12.5,1.7-16.3-1.1c-1.4-1.1-4.6-5-7.1-8.7c-5.5-8-9.6-11.7-14.4-12.8c-2.3-0.6-3.6-1.5-3.8-2.7c-0.2-1.1-0.9-2.4-1.5-2.9\n    c-3.1-2.6-3.8-6-2.5-11.6c1.3-6,0.3-10.3-2.5-10.3c-1.4,0-1.4-0.3,0-2.9c2-3.9,1.8-5.6-1-8.3C101.2,113.3,99.7,112.8,95.8,112.8z\n    M126.9,369.3l-2,3l-2.2-2c-6.5-6.2-10.9-7.7-18.1-6.2c-5.6,1.2-14.2-0.7-17.2-3.6c-1.4-1.4-2.3-4-2.8-7.4\n    c-0.9-6.9-2.4-9.1-9.2-13.4c-3-2-6.5-4.4-7.6-5.6l-2.1-2l2-2.7c1.1-1.5,3.8-3.9,6-5.4c4.7-3.1,6.2-4.6,9.2-8.8\n    c1.9-2.6,2.2-4.2,2-9.8c-0.3-7.3-0.6-7.5-8.1-5.7c-2.5,0.6-3.6,0.1-6.8-2.8c-2.1-2-6.1-4.8-8.8-6.4c-2.7-1.6-6-3.9-7.2-5.3\n    c-4-4.3-18.3-7.7-28.1-6.7c-4,0.4-5.8,0.1-8.2-1.4l-3-2l2.6-0.7c1.5-0.4,5.6-0.4,9.2-0.1c5.5,0.5,6.9,0.3,9.6-1.4\n    c2.4-1.6,3.2-2.7,3.2-5s0.5-2.9,1.8-2.9c2.9,0,4.3-2.5,3.7-6.8c-0.3-2.4,0-2.8,0.6-3.9c0.3-0.5,0.1-0.3,0.4-0.6\n    c0.1-0.6,0.7-2.4,2.2-4.7c1.6-2.2,3.8-6.4,5.1-9.4c1.2-2.9,2.7-5.7,3.2-6c0.1-0.5,0.1-0.4,0.3-0.8c0.6-0.9,2.8-7.1,5-8.9\n    c1.3-1.1,2.3-1.4,3.2-0.8c2.2,1.4,5.4,1,7-0.9c3.4-3.8,3.2-12.3-0.4-15.9c-1.7-1.7-1.7-1.8-0.1-1.8c0.9,0,3.6,0.7,6,1.6\n    c5.3,1.8,8.1,1.3,9.9-2c0.7-1.4,2.3-3.1,3.6-3.9c2.6-1.8,2.9-5.5,0.8-7.7c-0.9-0.9-3.4-2-5.7-2.5c-6.6-1.8-12.5-5.2-11.8-6.8\n    c1.1-2.5,0.4-7.1-1.2-8.3c-2.4-1.8-1-9.2,1.8-9.7c1.2-0.2,5-0.9,8.5-1.5c3.5-0.6,8.6-1.7,11.2-2.5c6.8-2,17.2-1.5,20.7,1.1\n    c1.5,1.1,4.8,5,7.4,8.7c6.4,9.4,7.9,10.7,13.6,12.6c6.2,2,13,2.1,18.4,0.1c5.5-2,8.1-1.9,12.8,0.4c2.2,1.1,5.2,2.2,6.6,2.5\n    c2.4,0.5,7.9,5.3,7.9,6.9c0,0.7,4.4,4.3,7,5.9c1.7,0.9,1.4,1.3-2.8,3.4c-3.6,1.9-4.8,2.9-5,5c-0.2,1.6-0.7,2.7-1.2,2.7\n    s-1.2,1-1.5,2.2c-0.4,1.3-2.3,4-4.4,6.1c-3.8,4.1-5.9,8.7-5.9,13.3c0,2.3,1,3.1,7.6,6.7c10.1,5.5,10.9,6.4,10.2,9.9\n    c-0.4,2.2,0.1,3.3,2.3,5.6l2.8,2.8l-3.2,4.1c-1.8,2.3-4.7,6-6.6,8c-2,2.1-3.2,4.3-2.9,4.8c0.3,0.5-1.3,2.6-3.5,4.7\n    c-3.6,3.5-3.9,4.3-3.3,7c0.4,1.8,2.3,4.7,4.4,6.6c4.2,4.1,7.8,9.7,7.8,12.1c0,1.6-5.7,9.1-9.9,13.3c-15.5,14.8-16.7,16.4-17.1,24.1\n    c-0.2,4.5-0.5,5.2-4.5,8.1c-2.2,1.8-7.2,5-11,7.2C133.2,361.8,129.6,364.9,126.9,369.3z\n    M182.5,468.1c-2.2-2.4-3.8-5-3.8-6.4\n    c0-3.2-2.5-9.1-4-9.1c-0.8,0-0.5-0.8,0.6-2c1.4-1.5,1.7-3,1.3-7.3l-0.5-5.4L163,424.8c-7.2-7.3-15.1-14.6-17.7-16.3\n    c-4.1-2.6-4.5-3.3-4-5.8c0.3-1.7,0-3.4-0.7-4.3c-0.4-0.9-0.4-1-0.7-1.4c-0.2-0.3-0.5-1.1-2.5-2.5c-3.8-2.6-3.9-2.7-3.6-8.9\n    c0.1-3.2-0.3-4.4-2-5.6c-4.5-3.1,1.3-10.5,15.4-19.4c15.5-9.9,15.8-10.2,15.8-18.2c0-5,2-8.9,6.3-11.8c3.8-2.6,12.9-12.4,16.4-17.7\n    c5.2-7.6,4.5-14.7-1.8-20.8c-1.3-1.2-2.3-2.5-2.3-2.9c0-0.5-0.7-1.5-1.5-2.2c-1.9-2-1.8-2.4,1-5.5c1.4-1.5,2.4-3,2.4-3.5\n    c0-1.3,5.1-7,6.2-7c0.6,0,2.4,1.1,4,2.4c1.7,1.3,3.4,2.8,4.1,3.4c0.7,0.5,1.7,1,2.2,1c0.6,0,1.3,0.7,1.6,1.5c0.4,0.8,1,1.5,1.5,1.5\n    c0.4,0,2.7,1.4,5.2,2.9c2.3,1.7,6.2,3.6,8.5,4.5c2.3,0.8,5.8,2.3,7.7,3.4c1.8,1.2,5.5,2.9,8.1,3.9c2.5,1,6,3.4,7.6,5.3\n    c1.7,1.9,3.4,3.4,3.8,3.4s4.4,3.7,9,8.1c4.5,4.5,9.7,9,11.3,10.1c3.4,2,3.5,3,0.7,4.7c-3.5,2.1-11.3,10.6-12.7,14\n    c-1.7,3.9-2,12.2-0.6,14.8c1.3,2.2,4.1,22.7,4.7,33.6c0.6,10.1-0.3,12.1-6.6,14.7c-11.5,4.9-16.5,7.4-18.3,9.3c-3,3-2.6,9.3,1,18.6\n    c3.4,9,3.4,11.3-0.1,11c-17.3-1.8-17.6-1.7-25.6,2.1c-5.2,2.5-8.7,5-10.9,7.8c-4.2,5.1-9,15-8.5,17.8\n    C187.7,473,186.4,472.2,182.5,468.1z\n    M341.3,467c-0.5,0.4-2.4,1.8-4.3,3.1c-3.4,2.4-7.2,5.5-9.3,7.3c-0.6,0.6-2.6,2.1-4.5,3.4\n    c-1.9,1.3-4,2.7-4.4,3.3c-0.3,0.2-0.4,0.2-0.5,0.3c-1.1,1-6.3,5.6-12.1,13.4c-5.9,8-7,8.9-12.8,9.9c-8,1.5-10.9,3.2-11.7,6.9\n    c-0.4,2.3-1.3,3.7-3,4.3c-1.4,0.6-2.3,1.7-2.3,2.9s-0.7,2-2,2c-1.1,0-2.8,0.9-4,2c-1.1,1.1-2.6,1.8-3.3,1.5c-0.8-0.3-1.7-0.1-2,0.5\n    s-1.2,0.8-2,0.5c-2.3-0.9-4.3,0.5-4.3,3.2c0,2.8-0.9,4.4-2.5,4.7c-9.4,1.8-15.6,3.4-15.8,4.2c-0.2,0.5-2,1-4.1,1\n    c-1.9,0-4.2,0.6-4.8,1.3c-0.6,0.8-2.2,1.2-3.7,1c-1.8-0.3-4.8,0.6-8.5,2.5c-3.6,2-7.1,3-9.8,3c-5.3,0-11.1,1.7-14.6,4.2l-2.8,2\n    l-2.3-2.8c-2-2.3-2.3-3.6-2.2-8.7c0.1-3.2,0.8-8.2,1.6-10.8c1.8-6.9,1.6-14-0.7-18.9c-2.4-5.4-2.4-9.5,0-13.6c1.5-2.4,2-4.9,2-10.3\n    c0-8.3,3.3-21,7.3-28.1c2.5-4.6,7.5-9.6,9.5-9.6c0.6,0,3.3-1.1,6.2-2.3c5-2.4,5.1-2.4,12.2-1c3.9,0.9,8.3,1.3,9.7,0.9\n    c7.9-2,9.1-9.5,3.4-21.5c-3.3-6.9-3.4-7.5-2-9.7c1-1.5,4.9-3.6,11.1-6c10.7-4.2,14.5-7.2,15.5-12.8c0.6-2.9-0.8-22.4-2-29.7\n    c-0.1-0.8-0.6-4.1-0.9-7.3c-0.4-3.2-1.4-7.7-2.2-9.9c-1.4-3.8-1.4-4.4,0.6-8.7c2-4.5,8.7-12.5,12.1-14.3c1-0.5,3.8-1.1,6.2-1.4\n    c2.7-0.2,5-1.1,5.8-2c0.5-0.8,1.1-1.2,1.3-1.1c0.2-0.2,0.5-0.3,0.8-0.5c0.5-0.3,1-0.6,1.6-0.8c1.4-1.1,2.3-1,3.8,0.5\n    c0.4,0.2,0.8,0.6,1.1,0.9c0.5,0.4,1.1,0.7,1.5,0.7c0.3,0,0.6,0.2,0.8,0.4c0.7,0.3,1.3,0.8,1.7,1.3c1.2,0.6,3.2,3,6,7.1\n    c5.3,7.8,8.1,12,9.4,14.3c0.2,0.2,0.3,0.4,0.5,0.5l0.7,0.7c0.3,0.2,0.5,0.5,0.7,0.8c0.1,0.1,0.2,0.2,0.2,0.3\n    c0.5,0.4,0.9,0.9,1.2,1.4c0.2,0.1,0.3,0.3,0.4,0.4c0.6,20.7,0.7,41.5,1.9,62.2c0.6,9.5,7.5,13.9,13.6,20.3\n    c6.8,7.2,12.7,15.2,17.8,23.8c0.3,0.5,0.6,0.8,0.9,1.1C345.9,463.4,343.1,465.5,341.3,467z\n    M453.5,403.1c-0.9,1-2.4,1.7-3.5,1.7\n    c-1,0-2.8,1.2-4.1,2.6c-4.3,5.2-6.9,7.1-10.8,8.2c-2.2,0.6-6.9,2.7-10.5,4.8c-7.2,4.3-11.1,5.6-12,4c-0.9-1.3-3.9-1.4-7.8-0.2\n    c-1.7,0.5-5.4,1.5-8.3,2c-3.5,0.7-6,1.8-7.6,3.5l-5.2,5.8c-2,2.1-19.3,14.6-24.2,17.6c-0.5,0.3-2.7,1.9-5.4,4\n    c-0.1-0.2-0.1-0.3-0.2-0.5c-4.5-7.6-9.6-14.8-15.5-21.4c-3-3.4-6.2-6.6-9.5-9.8c-1.7-1.6-3.6-3.1-4.7-5.2c-1.1-2.3-0.9-5.4-0.9-7.9\n    c-0.6-19.5-1.2-39-1.8-58.5c0.5-0.5,1.1-1.1,1.7-1.8c1-1.2,4.8-2.8,6.3-2.8c2.9,0,8.5-3.1,9.5-5.4c1-2,1.2-2.2,5.2-1\n    c2.2,0.7,6,2.2,8.4,3.2c2.3,1.1,5.4,2.1,6.7,2.5c2.5,0.6,14.4,11.6,18.3,16.9c2,2.6,3.5,3.3,13.1,5.6c7.5,1.8,11.7,3.2,13.8,5\n    c1.9,1.7,4,2.4,6.7,2.4c3.1,0,4.5,0.7,7.5,3.7c2,2,4,4.4,4.3,5.3c0.4,0.8,2.7,2.4,5.4,3.6c2.5,1.3,6,3.2,7.6,4.5\n    c1.7,1.2,5,2.4,7.3,2.7c2.4,0.2,6.1,1.1,8.1,1.9C454.9,401.4,455,401.6,453.5,403.1z\n    M586.5,388.7c0,0.1-0.1,0.2-0.2,0.3\n    c-0.1,0.2-0.2,0.3-0.4,0.4c-0.4,0.2-0.8,0.3-1.2,0.5c-0.3,0.1-0.6,0.2-0.8,0.2c-0.1,0-0.1,0-0.2,0c-2.5,1.1-9,0.8-14.3-1\n    s-7.5-2-13.7-1.5c-4.4,0.4-8.7,1.5-10.6,2.5c-2.5,1.5-5.2,1.8-12.5,1.8c-9.3,0-14.9,1.4-16.6,4c-0.5,0.8-1.1,3.4-1.4,6l-0.5,4.6\n    l-3.5-2.4c-3-2.2-4.7-2.5-12.3-2.8c-7.2-0.2-9.7-0.7-13.6-2.7c-3.8-2-6.2-2.5-12.1-2.5c-8.8-0.2-17.1-1.7-20.2-3.6\n    c-1.2-0.8-3.8-1.5-5.8-1.5s-4.7-0.8-6-1.9c-1.5-1-4.5-2.7-6.8-3.9c-0.7-0.4-1.4-0.8-2-1.2c-1.6-0.7-2.7-2.3-3.8-3.7\n    c-0.1-0.1-0.1-0.1-0.2-0.2c-0.5-0.5-0.9-1-1.4-1.5c-0.2-0.2-0.4-0.3-0.6-0.5c-1-0.5-2.5-1.7-3.9-3.2c-2.5-2.8-3.8-3.4-6.9-3.4\n    c-2.3,0-5.1-0.9-7.1-2.2c-1.8-1.2-7.8-3.2-13.4-4.6c-10-2.3-10.1-2.4-13.4-6.9c-1.8-2.5-4.9-5.9-6.9-7.3c-2-1.6-4.5-3.8-5.6-5.1\n    c-1.9-2.1-18.5-9-21.7-9c-1.3,0-1.4-1.2-0.8-6.7c0.6-6,0.4-7.1-1.5-9.6l-2-2.8l2-4.6c2.3-5.5,2.4-19.8,0.2-22.5\n    c-0.4-0.6-0.7-1-0.7-1.3c0-0.1-0.1-0.2-0.1-0.2c-0.1-0.1-0.1-0.2-0.1-0.3c-0.1-0.2-0.1-0.4-0.1-0.6v-0.5c-0.1-0.6,0.8-1.6,2.8-3.2\n    c2.1-1.6,4.8-4.6,6-6.8c2.5-4.8,2-8.3-1.8-12.3c-3.1-3.2-2.5-4.9,2.5-7.2c3.4-1.6,4.6-2.9,7.1-8.2c2.8-6,6.6-10.7,8.5-10.7\n    c0.5,0,2.2-1.4,3.9-3.1c2.7-2.7,3.1-2.9,4.3-1.6c1.1,1.6,3.2,2.1,6.6,1.8c2.2-0.1,5.4-3,6.2-5.6c0.7-2.2,12.5-14.1,14-14.1\n    c0.6,0,1.3,0.3,1.6,0.7c1.3,1.2,10.7,4.2,15.3,4.8c4.6,0.6,12.7-1,12.7-2.5c0-0.5,2.2,1.3,4.9,3.9c2.7,2.6,4.9,5.2,4.9,5.8\n    c0,2.6,8.6,4.2,10.5,1.8c0.6-0.6,1.6-2.8,2.2-4.9c1.6-5,3.3-4.1,3.7,1.8c0.2,4.2,0.7,5.1,3.4,6.9c1.8,1.2,5.4,2.8,8,3.7\n    c6.2,2.1,8.9,4.3,4.4,3.6c-1.8-0.3-2.9,0-2.9,0.7c0,0.7-1,2.4-2.2,4c-2,2.8-2,2.9-0.3,4.9c1,1.1,2.5,2.2,3.4,2.4\n    c1,0.3,1.7,1.3,1.5,2.2c-0.1,0.9,0.2,2.5,0.8,3.6c1,2,7.5,8.2,8.6,8.3c0.4,0,2.2,2,4.3,4.4c2.9,3.6,3.7,5.7,4.5,10.8\n    c1.4,9.8,3.3,12.9,15.1,25c16.1,16.3,20.3,20.1,23.4,20.8c1.6,0.4,4.7,1.4,6.9,2.1c5.4,2,10.1,1.2,13.4-2.1c2.9-2.9,6.7-3,7.2-0.1\n    c0.5,2.2-1.4,6-4.4,9.4c-1.5,1.6-2.2,3.7-2.2,5.9c0,1.9-0.4,3.9-1,4.5c-0.8,0.8,0.1,7.7,1.3,8.9c0.3,0.2,4,0.9,8.2,1.4\n    s9.1,1.7,10.8,2.5c3,1.6,3.1,1.8,2.5,6c-0.4,2.4-0.7,5-0.7,5.7c0,1.5,4.4,8.1,5.5,8.1c1.6,0,7.5,5.2,7.5,6.5\n    C586.8,388.2,586.7,388.5,586.5,388.7z");
    			add_location(path4, file$2, 98, 2, 5084);
    			attr_dev(path5, "d", "M279.1,182.3c0,7.9,2.1,15,6.5,23.3c5.9,10.5,6.9,13,7.6,17.8c0.6,3.8,0.3,5.2-1.5,8.1\n      c-3.9,6.3-6.6,6.4-11.7,0.5c-12.5-14.8-19.7-19.7-32.2-21.9c-1.9-0.3-8.8-3.3-15.3-6.6l-11.9-6l-11.1,0.1\n      c-8.9,0.2-11.4-0.1-12.4-1.3c-0.7-0.8-1.9-1.5-2.5-1.5c-0.8,0-1.4-0.5-1.4-1c0-0.6-0.6-1-1.3-1c-1.2,0-1.9-0.6-8.7-8\n      c-2.1-2.2-4.9-4-7.7-4.7c-2.3-0.7-5.6-2.1-7.1-3.2c-3.6-2.5-10.2-2.6-16.4-0.3c-5.6,2.1-12.5,1.7-16.3-1.1c-1.4-1.1-4.6-5-7.1-8.7\n      c-5.5-8-9.6-11.7-14.4-12.8c-2.3-0.6-3.6-1.5-3.8-2.7c-0.2-1.1-0.9-2.4-1.5-2.9c-3.1-2.6-3.8-6-2.5-11.6c1.3-6.1,0.3-10.3-2.5-10.3\n      c-1.4,0-1.4-0.3,0-2.9c2.1-3.9,1.9-5.6-1-8.3c-1.9-2-3.3-2.4-7.2-2.4c-4.5,0-5,0.3-6.9,3.4c-2.3,3.7-3.9,3.7-3.9-0.1\n      c0-1.6-1-2.9-2.8-4.1c-2.4-1.5-2.7-2-1.8-3.6c0.6-1.1,1.4-4.4,1.7-7.3c0.3-3.5,0.9-5.3,1.7-5.2c0.7,0.2,3.3-0.2,5.9-0.7\n      c7.1-1.6,13.5-7.4,15.5-14.3c0.8-2.8,1.2-5.8,0.8-6.4c-0.6-1-0.4-1.1,0.7-0.1c2.1,2.1,7.8,1.6,10.3-0.9c1.3-1.2,2.2-2.8,2.2-3.6\n      c0-1,0.3-1.2,0.8-0.5c0.4,0.5,1.8,1.8,3.1,2.6c1.6,1.1,4.4,1.7,8.3,1.7c3.8,0,7.2,0.7,9.8,2c6.5,3.2,14.4,9.5,15.9,12.7\n      c0.8,1.7,2.4,3.4,3.6,3.9c1.1,0.4,2.6,1.6,3.4,2.4c0.8,1,3.2,2.5,5.4,3.4c5,2.1,6.2,3.7,7,8.5c0.7,4.3,3.8,10.1,5.6,10.1\n      c0.7,0,2.1-0.6,3-1.4c1.6-1.1,2.3-0.9,6.2,1.8c4,2.6,5.6,3.1,13.8,3.6c5.7,0.4,10.5,1.3,12.4,2.2c4.2,2.2,9,2.9,12,1.8\n      c2-0.7,3.2-0.4,6.3,1.6c2.1,1.4,4.8,3.3,6,4.3c1.1,1,2.7,1.8,3.6,1.8c1.8,0,7.2,4.7,7.4,6.3c0.1,0.5,1.1,2.1,2.1,3.3\n      c1.5,1.7,2.7,2.1,4.8,1.9c2-0.3,3,0.1,3.6,1.3c0.4,1,2.6,3.7,5,6.2");
    			add_location(path5, file$2, 290, 4, 26411);
    			set_style(g4, "color", getColor("Kreis 10", /*data*/ ctx[0]));
    			attr_dev(g4, "fill", "currentColor");
    			attr_dev(g4, "stroke-width", "1");
    			attr_dev(g4, "stroke", "currentColor");
    			attr_dev(g4, "class", "Kreis10");
    			add_location(g4, file$2, 284, 2, 26264);
    			attr_dev(path6, "d", "M285.7,181.2c-0.4-6.7-1.4-11.6-3.5-18.1c-1.7-4.9-3.1-9.3-3.2-9.8c-0.1-0.6-2.3-3-5.1-5.7\n      c-2.6-2.5-4.9-5-4.9-5.4c-0.1-0.4-0.6-1.6-1.2-2.6c-1.8-3.4,0.6-9.4,3-7.4c0.6,0.5,3.5,1.9,6.4,3.1c2.9,1.3,8.8,4.2,12.9,6.4\n      c4.2,2.2,8.6,4.4,10,4.8c3.3,0.8,6.3,4.6,5.8,7.3c-0.3,1.9,0.4,2.8,3.1,4.7c6.1,4,9.4,8.6,9.1,12.4c-0.3,4.8,1.3,6,5.8,4.4\n      c3.4-1.3,3.7-1.2,5,0.8c2.5,3.7,6.1,2.6,11.8-3.5c4.4-4.7,5.4-5.3,6.2-3.9c0.5,0.9,1.5,1.7,2.2,1.7c1.1,0,1.1,0.5-0.1,2.8\n      c-1.4,2.7-1.4,4.9,0,8.1c1.1,2.3,6.5,3.1,13,1.9c6.4-1.3,8.7-0.4,10.5,4.1c1.8,4.2,5.3,7.9,9.9,10.3c2.1,1.1,4.8,2.9,6.1,4.1\n      c1.2,1.1,2.1,1.8,2.1,1.5c0-0.4,1.1,0.7,2.4,2.2c1.4,1.7,2.4,3.2,2.4,3.6s0.7,1.3,1.6,2c1.4,1,0.8,1.9-4.8,6.6\n      c-3.5,3.1-6.8,6.9-7.5,8.6c-0.8,1.8-1.9,2.8-2.7,2.6s-1.4-0.7-1.3-1.3c0.3-1-2.3-2.2-5.1-2.3c-1-0.1-3.7,1.9-6,4.2\n      c-2.2,2.4-4.8,4.5-5.5,4.7c-2.7,0.6-5.8,4.3-8.2,9.8c-2,4.5-6.9,9.9-8.7,9.9c-0.1,0-0.1,0.1-0.2,0.1s-0.1,0-0.2,0.1\n      c-0.4,0.2-0.8,0.4-1.1,0.6c-0.1,0.1-0.3,0.1-0.4,0.2c-0.4,0.3-0.8,0.8-1.2,1.2c-2.5,2.7-3.1,7.1-1.2,9.1c0.4,0.4,0.7,0.8,0.7,1\n      c0.1,0.2,0.2,0.4,0.3,0.7c0.2,0.4,0.4,0.7,0.5,1.1c0.2,0.3,0.5,0.6,0.8,0.9c1.4,1.5,2.4,3,2.4,3.4c0,0.5-1.6,2.6-3.5,4.8\n      c-3.1,3.4-4.1,3.9-7.7,3.9c-3.3,0-4.4-0.4-4.9-1.9c-1-3.1-4.4-6.9-6.2-6.9c-1,0-2.5-1.1-3.5-2.3c-1-1.3-2.2-2.1-2.9-2\n      c-0.6,0.3-1.9-1.3-2.7-3.3c-1.5-3.4-16.3-20.1-16.3-18.5c0,0.4-1.8-0.5-3.9-1.9l-4-2.6l2.8-3c4.2-4.4,5.3-7,5.3-12.5");
    			add_location(path6, file$2, 311, 4, 28087);
    			set_style(g5, "color", getColor("Kreis 6", /*data*/ ctx[0]));
    			attr_dev(g5, "fill", "currentColor");
    			attr_dev(g5, "stroke-width", "1");
    			attr_dev(g5, "stroke", "currentColor");
    			attr_dev(g5, "class", "Kreis6");
    			add_location(g5, file$2, 305, 2, 27942);
    			attr_dev(path7, "d", "M137.5,44.4c-6.2-2.3-8.6-4.7-8.6-8.8c0-3.4,4.7-7.4,9.6-8.2c15.6-2.5,19.5-3.7,29-8.8\n      c5.4-2.9,10.8-5.4,12.2-5.4c1.3,0,5.9,1.6,10.3,3.5c4.3,2,11.9,5.5,16.9,7.8c9.5,4.5,14.8,5.4,20.4,3.2c1.5-0.6,9-1.2,16.7-1.2\n      c14.8-0.2,15.8-0.5,15.8-5.3c0-3.1,1.4-3.5,7-1.8c2.7,0.8,6.8,1.5,9,1.5c2.3,0,5.7,0.9,7.9,2.1c3.1,1.8,6,2.2,14.4,2.5\n      c7,0.3,11,0,11.7-0.7c0.6-0.6,3.2-1.1,5.9-1.1c3.9,0,4.9-0.3,5.3-2c0.4-1.6,1.1-1.8,3.1-1.3c1.4,0.3,2.7,1,2.8,1.5\n      c0.2,0.4,1,0.8,1.7,0.8s1.5,0.6,1.8,1.2c0.2,0.9,3.1,1.3,9.9,1.3c10.4,0,12.3,1,12.3,6.2c0.1,1.4,1,5,2,7.9\n      c1.1,2.9,2.1,5.8,2.2,6.3s0.9,1.8,1.8,2.7c1.1,1.2,1.5,2.6,1,3.9c-0.7,2.6-6.7,11.8-7.8,12.4c-0.2,0.4-0.5,0.8-0.9,1.2\n      c-0.2,1-0.3,2.7-0.4,5.7l-0.2,4.4l10.2,5.1c10,5.1,14.1,7.9,15.8,11.1c0.7,1.3-0.1,2.1-3.8,4c-4.9,2.5-9.8,9.1-10.2,13.5\n      c-0.1,2.3,0.7,11.5,1.8,20.8c0.7,5.7-1.1,13.4-3.7,16.2c-1.2,1.4-2.2,4.4-2.7,8.1c-0.6,3.7-1.6,6.7-2.7,7.8c-1.8,1.9-2,1.9-3.6,0.2\n      c-1-1-3.1-1.8-4.8-1.8c-3.4,0.1-11,4.7-11.8,7.3c-0.5,1.6-0.8,1.6-3.4,0.2c-1.7-0.8-3.7-1.2-4.8-0.8c-1.4,0.4-2-0.1-2.3-2.1\n      c-0.5-2.5-8.8-12-10.4-12c-0.4,0-1.1-1.7-1.5-3.6c-0.7-3.8-6.2-10.1-8.9-10.1c-1.8,0-11-4.6-13.3-6.6c-1-0.8-1.8-1.1-1.8-0.6\n      s-0.4,0.4-0.8-0.1c-1.5-2.1-17.8-9.4-19.4-8.8c-3.1,1.1-8.3,8.5-7.8,11c0.6,2.9-0.8,1.7-3-2.8c-1.1-2.2-3.3-4.1-6.5-5.8\n      c-8.5-4.3-11.7-6.3-13-8.1c-1.5-1.9-7-2.2-10-0.7c-1.4,0.8-2.9,0.6-5.6-0.6c-2.1-0.9-7.3-2-11.8-2.3c-5.3-0.6-9.3-1.6-11.5-2.8\n      c-1.9-1.2-4-2.1-4.7-2.1s-2.2-1.2-3.6-2.5c-1.7-1.8-3.1-2.3-4.9-2.1c-2.3,0.4-2.6,0.1-3.1-3.4c-0.7-5-2.4-6.7-11.5-11.6\n      c-4.2-2.2-7.4-4.4-7.2-4.7c0.7-1.1-5.4-7.8-6.9-7.8c-0.8,0-1.4-0.4-1.4-0.9s-0.8-1.2-1.7-1.5c-1-0.3-2.9-1.7-4.3-2.9\n      c-1.5-1.4-2.9-2.1-3.2-1.9c-0.3,0.4-0.6,0.1-0.6-0.5c0-0.7,0.4-1.2,0.8-1.2c0.5,0,1.5-1.8,2.1-3.9c1.2-3.5,1.1-4.4-0.4-7.6\n      c-1-2-2-4.7-2.2-6.1C145.2,47.7,144,46.7,137.5,44.4z");
    			add_location(path7, file$2, 331, 4, 29692);
    			set_style(g6, "color", getColor("Kreis 11", /*data*/ ctx[0]));
    			attr_dev(g6, "fill", "currentColor");
    			attr_dev(g6, "stroke-width", "1");
    			attr_dev(g6, "stroke", "currentColor");
    			attr_dev(g6, "class", "Kreis11");
    			add_location(g6, file$2, 325, 2, 29545);
    			attr_dev(path8, "d", "M388.1,98.6c9-2.5,10.3-3.3,12.9-8.6c3.5-7,4-7.4,8.3-7.4h3.9l-0.6,12.9c-0.3,7.1-0.7,15.1-1,17.7\n      c-0.3,3.7-0.1,4.9,1.2,5.3c1,0.4,3.1,1.9,4.8,3.3c1.8,1.5,4.9,3,6.8,3.3c13,2,19.7,3.6,26.8,6.8c15.6,6.9,29.3,11.8,33.6,12.1\n      c0.7,0.1,0.4,1.7-0.9,4.2c-1.1,2.1-2.2,6.3-2.4,9.1c-0.4,5-0.3,5.2,2.6,6.2l3,1.1l-2,4.2c-2.6,5.8-2.5,6.2,1.9,9.4\n      c2.7,2.1,3.6,3.1,2.8,3.9c-0.6,0.6-1.6,0.8-2.2,0.5c-0.8-0.2-2.3,0.1-3.6,0.8c-1.3,0.8-4.5,1.2-7.3,1c-3.8-0.2-6.3,0.3-9.6,1.9\n      c-5.4,2.6-6.5,5.8-3.7,9.6c1.7,2.2,1.8,2.9,0.7,3.9c-1.9,1.7-9.8,6.3-10.9,6.3c-0.2,0.2-0.5,0.3-0.8,0.5l-0.1,0.1\n      c-0.4,0.5-1,1.2-1.6,2.2c-2.5,3.8-4.7,10.2-3.7,11.2c0.4,0.4-0.2,0.2-1.4-0.4c-1.2-0.6-2.8-2.1-3.7-3.5c-3.3-5.2-8.6-6.3-12.6-2.9\n      c-2.6,2.2-3.6,2.4-7.8,2c-7.1-1-15.5-4.4-18.3-7.6c-6.3-7.2-12.7-13.4-15.7-15c-4.6-2.6-7.4-5.6-9.1-9.5c-0.8-2-2.5-4.2-3.9-5.1\n      c-3.3-2.2-10-2.9-14.7-1.6c-2.1,0.6-4,0.8-4.2,0.6c-0.3-0.2,1.3-2.7,3.4-5.6c6-7.7,7.4-11.2,6.7-15.5c-0.5-3-0.2-4.1,1.9-6.3\n      c1.3-1.4,2.6-4.1,3-6c0.6-3.1,0.1-14.3-1.2-28.6C368.6,105.3,370.6,103.6,388.1,98.6z");
    			add_location(path8, file$2, 355, 4, 31733);
    			set_style(g7, "color", getColor("Kreis 12", /*data*/ ctx[0]));
    			attr_dev(g7, "fill", "currentColor");
    			attr_dev(g7, "stroke-width", "1");
    			attr_dev(g7, "stroke", "currentColor");
    			attr_dev(g7, "class", "Kreis12");
    			add_location(g7, file$2, 349, 2, 31586);
    			attr_dev(path9, "d", "M586.5,388.7c0,0.1-0.1,0.2-0.2,0.3c-0.1,0.2-0.2,0.3-0.4,0.4c-0.4,0.2-0.8,0.3-1.2,0.5\n      c-0.3,0.1-0.6,0.2-0.8,0.2l0,0l0,0c-0.1,0-0.1,0-0.2,0c-2.5,1.1-9,0.8-14.3-1s-7.5-2-13.7-1.5c-4.4,0.4-8.7,1.5-10.6,2.5\n      c-2.5,1.5-5.2,1.9-12.5,1.9c-9.3,0-14.9,1.4-16.6,4c-0.5,0.8-1.1,3.4-1.4,6.1l-0.5,4.6l-3.5-2.4c-3-2.2-4.7-2.5-12.3-2.8\n      c-7.2-0.2-9.7-0.7-13.6-2.7c-3.8-2-6.2-2.5-12.1-2.5c-8.8-0.2-17.1-1.7-20.2-3.6c-1.2-0.8-3.8-1.5-5.8-1.5s-4.7-0.8-6.1-1.9\n      c-1.5-1-4.5-2.7-6.8-3.9c-0.7-0.3-1.4-0.8-2-1.2c-1.6-0.7-2.7-2.3-3.8-3.7c-0.1-0.1-0.1-0.1-0.2-0.2c-0.5-0.5-0.9-1-1.4-1.5\n      c-0.2-0.2-0.4-0.3-0.6-0.5c-1-0.5-2.5-1.7-3.9-3.2c-2.5-2.8-3.8-3.4-6.9-3.4c-2.3,0-5.1-0.9-7.1-2.2c-1.8-1.2-7.8-3.2-13.4-4.6\n      c-10-2.3-10.2-2.4-13.4-6.9c-1.8-2.5-4.9-5.9-6.9-7.3c-2-1.6-4.5-3.8-5.6-5.1c-1.9-2.1-18.5-9-21.7-9c-1.3,0-1.4-1.2-0.8-6.7\n      c0.6-6,0.4-7.1-1.5-9.6l-2.1-2.8l2-4.6c2.3-5.5,2.4-19.8,0.2-22.5c-0.4-0.6-0.6-1-0.7-1.3c0-0.1-0.1-0.2-0.1-0.2\n      c-0.1-0.1-0.1-0.2-0.1-0.3c-0.1-0.2-0.1-0.4-0.1-0.6s0-0.3,0-0.5c-0.1-0.6,0.8-1.6,2.8-3.2c2.1-1.6,4.8-4.6,6.1-6.8\n      c2.5-4.8,2.1-8.3-1.8-12.3c-3.1-3.2-2.5-4.9,2.5-7.2c3.4-1.6,4.6-2.9,7.1-8.2c2.8-6,6.6-10.7,8.5-10.7c0.5,0,2.2-1.4,3.9-3.1\n      c2.7-2.7,3.1-2.9,4.3-1.6c1.1,1.6,3.2,2.1,6.6,1.9c2.1-0.1,5.4-3,6.2-5.6c0.7-2.2,12.5-14.1,14-14.1c0.6,0,1.3,0.3,1.6,0.7\n      c1.3,1.2,10.7,4.2,15.3,4.8c4.6,0.6,12.7-1,12.7-2.5c0-0.5,2.2,1.3,4.9,3.9c2.7,2.6,4.9,5.2,4.9,5.8c0,2.6,8.6,4.2,10.4,1.8\n      c0.6-0.6,1.6-2.8,2.2-4.9c1.6-5,3.3-4.1,3.7,1.9c0.2,4.2,0.7,5.1,3.4,6.9c1.8,1.2,5.4,2.8,8,3.7c6.2,2.1,8.9,4.3,4.4,3.6\n      c-1.8-0.3-2.9,0-2.9,0.7s-1,2.4-2.1,4c-2.1,2.8-2.1,2.9-0.3,4.9c1,1.1,2.5,2.1,3.4,2.4c1,0.3,1.7,1.3,1.5,2.2\n      c-0.1,0.9,0.2,2.5,0.8,3.6c1,2,7.5,8.2,8.6,8.3c0.4,0,2.2,2,4.3,4.4c2.9,3.6,3.7,5.7,4.5,10.8c1.4,9.8,3.3,12.9,15.1,25\n      c16.1,16.3,20.3,20.1,23.4,20.8c1.6,0.4,4.7,1.4,6.9,2.1c5.4,2,10.1,1.2,13.4-2.1c2.9-2.9,6.7-3,7.2-0.1c0.5,2.1-1.4,6-4.4,9.4\n      c-1.5,1.6-2.2,3.7-2.2,5.9c0,2-0.4,3.9-1,4.5c-0.8,0.8,0.1,7.7,1.3,8.9c0.3,0.2,4,0.9,8.2,1.4s9.1,1.7,10.8,2.5\n      c3,1.6,3.1,1.8,2.5,6.1c-0.4,2.4-0.7,5-0.7,5.7c0,1.5,4.4,8.1,5.5,8.1c1.6,0,7.5,5.2,7.5,6.5C586.8,388.3,586.7,388.6,586.5,388.7z\n      ");
    			add_location(path9, file$2, 372, 4, 32969);
    			set_style(g8, "color", getColor("Kreis 7", /*data*/ ctx[0]));
    			attr_dev(g8, "fill", "currentColor");
    			attr_dev(g8, "stroke-width", "1");
    			attr_dev(g8, "stroke", "currentColor");
    			attr_dev(g8, "class", "Kreis7");
    			add_location(g8, file$2, 366, 2, 32824);
    			attr_dev(path10, "d", "M196.6,252.3c-2.2-2.4-2.5-3.1-1.5-4.7c2.5-4.2,0.9-8.8-3.3-8.8c-1.2,0-2.5-0.6-3.1-1.3s-3.7-2.5-7-4.1\n      c-3.2-1.6-5.9-3.4-5.9-4.2c0-2.2,3.9-7,5.7-7c0.9,0,3.2,1,5.1,2.1c1.9,1.2,4.3,2.8,5.4,3.8s9.4,5.6,18.5,10.2\n      c9.2,4.6,17.3,9,18.1,9.8c0.9,0.7,3.1,1.8,5,2.4c1.9,0.7,4.3,1.7,5.4,2.1c6.1,2.6,15.6,5.8,19.2,6.2c2.3,0.4,5.3,1.2,6.6,1.9\n      c7.6,4,15.7,8.4,17.7,9.7c1.3,0.8,3.9,1.8,5.8,2.1c2.6,0.6,7.1,2.2,10.5,4c1.3,0.7-5.2,11.5-9.6,16c-2.9,2.9-4.9,6.2-4.9,8.3\n      c0,0.8-1.3,2.8-2.8,4.6c-1.6,1.8-3.1,4.8-3.5,6.6c-0.8,3.7-3.1,8.8-4,8.8c-1.3,0-9.1-6.5-16.5-13.7c-15.4-15-18.5-17.6-21.4-17.6\n      c-1.3,0-3.7-1-5.6-2.2c-1.9-1.2-6.7-3.7-10.9-5.5c-4.2-1.9-8.9-4.5-10.4-5.9c-6.1-5.5-8.4-7.3-11.5-9.2l-3.1-1.9l2.4-2.9\n      C199.9,258.3,199.9,255.7,196.6,252.3z");
    			add_location(path10, file$2, 399, 4, 35332);
    			set_style(g9, "color", getColor("Kreis 4", /*data*/ ctx[0]));
    			attr_dev(g9, "fill", "currentColor");
    			attr_dev(g9, "stroke-width", "1");
    			attr_dev(g9, "stroke", "currentColor");
    			attr_dev(g9, "class", "Kreis4");
    			add_location(g9, file$2, 393, 2, 35187);
    			attr_dev(path11, "d", "M189.2,210.5c-0.4-1.5,0-2,1.3-2c1,0,2.7-1.1,4-2.5c2.2-2.3,2.6-2.4,12.6-2.1l10.3,0.3l12.7,6.1\n      c7,3.3,14.2,6.3,15.9,6.6c1.8,0.3,5,1.2,7.1,1.9c4.3,1.5,14.5,7.4,14.3,8.3c-0.2,0.5,2.1,3.2,8.6,10.3c1.1,1.2,3,2.7,4.4,3.4\n      c1.3,0.7,5,3.3,8.3,5.9c3.2,2.5,7.3,5.4,9.1,6.4c2.9,1.7,3.1,2.1,3.1,7.2c0,2.9-0.3,6.3-0.6,7.4l-0.6,2.1l-6.3-2.1\n      c-3.5-1.3-6.7-2.7-7-3.2c-0.3-0.6-2.9-1.9-5.9-3c-2.8-1.1-6.8-3-8.8-4.3c-4.5-2.9-8.4-4.3-13.4-4.9c-2.1-0.3-6.3-1.6-9.3-2.9\n      c-23.6-10.9-48.8-24.2-55.5-29.2c-3-2.2-5.7-4.2-5.9-4.4c-0.2-0.1,0.2-0.9,0.9-1.8C189.2,213.1,189.5,211.5,189.2,210.5z");
    			add_location(path11, file$2, 414, 4, 36269);
    			set_style(g10, "color", getColor("Kreis 5", /*data*/ ctx[0]));
    			attr_dev(g10, "fill", "currentColor");
    			attr_dev(g10, "stroke-width", "1");
    			attr_dev(g10, "stroke", "currentColor");
    			attr_dev(g10, "class", "Kreis5");
    			add_location(g10, file$2, 408, 2, 36124);
    			attr_dev(path12, "d", "M124.9,372.3l-2.2-2.1c-6.5-6.2-10.9-7.7-18.1-6.2c-5.6,1.2-14.3-0.7-17.2-3.6c-1.4-1.4-2.3-4-2.8-7.4\n      c-0.9-6.9-2.4-9.1-9.2-13.4c-3-2-6.5-4.4-7.6-5.6l-2.1-2l2.1-2.7c1.1-1.5,3.8-3.9,6-5.4c4.7-3.1,6.2-4.6,9.2-8.8\n      c1.9-2.6,2.1-4.2,2-9.8c-0.3-7.3-0.6-7.5-8.1-5.7c-2.5,0.6-3.6,0.1-6.8-2.8c-2.1-2-6.2-4.8-8.8-6.4c-2.7-1.6-6-3.9-7.2-5.3\n      c-4-4.3-18.4-7.7-28.1-6.7c-4,0.4-5.8,0.1-8.2-1.4l-3-2l2.6-0.7c1.5-0.4,5.6-0.4,9.2-0.1c5.5,0.5,6.9,0.3,9.6-1.4\n      c2.4-1.6,3.2-2.7,3.2-5s0.5-2.9,1.9-2.9c2.9,0,4.3-2.5,3.7-6.8c-0.3-2.4,0-2.7,0.6-3.9c0.3-0.5,0.1-0.3,0.4-0.6\n      c0.1-0.6,0.7-2.4,2.1-4.7c1.6-2.1,3.8-6.4,5.1-9.4c1.2-2.9,2.7-5.7,3.2-6.1c0.1-0.5,0.1-0.4,0.3-0.8c0.6-0.9,2.8-7.1,5-8.9\n      c1.3-1.1,2.3-1.4,3.2-0.8c2.2,1.4,5.4,1,7-0.9c3.4-3.8,3.2-12.3-0.4-15.9c-1.7-1.7-1.7-1.9-0.1-1.9c0.9,0,3.6,0.7,6,1.6\n      c5.3,1.9,8.1,1.3,9.9-2.1c0.7-1.4,2.3-3.1,3.6-3.9c2.6-1.8,2.9-5.5,0.8-7.7c-0.9-0.9-3.4-2-5.7-2.5c-6.6-1.8-12.5-5.2-11.8-6.8\n      c1.1-2.5,0.4-7.1-1.2-8.3c-2.4-1.8-1-9.2,1.9-9.7c1.2-0.2,5-0.9,8.5-1.5s8.6-1.7,11.2-2.5c6.8-2.1,17.2-1.5,20.7,1.1\n      c1.5,1.1,4.8,5,7.4,8.7c6.4,9.4,7.9,10.7,13.6,12.6c6.2,2,13,2.1,18.4,0.1c5.5-2,8.1-1.9,12.8,0.4c2.1,1.1,5.2,2.1,6.6,2.5\n      c2.4,0.5,7.9,5.3,7.9,6.9c0,0.7,4.4,4.3,7,5.9c1.7,0.9,1.4,1.3-2.8,3.4c-3.6,1.9-4.8,2.9-5,5c-0.2,1.6-0.7,2.7-1.2,2.7\n      s-1.2,1-1.5,2.1c-0.4,1.3-2.3,4-4.4,6.2c-3.8,4.1-5.9,8.7-5.9,13.3c0,2.3,1,3.1,7.6,6.7c10.1,5.5,10.9,6.4,10.3,9.9\n      c-0.4,2.1,0.1,3.3,2.3,5.6l2.8,2.8l-3.2,4.1c-1.8,2.3-4.7,6-6.6,8c-2,2.1-3.2,4.3-2.9,4.8s-1.3,2.6-3.5,4.7c-3.6,3.5-3.9,4.3-3.3,7\n      c0.4,1.8,2.3,4.7,4.4,6.6c4.2,4.1,7.8,9.7,7.8,12.1c0,1.6-5.7,9.1-9.9,13.3c-15.5,14.8-16.7,16.4-17.1,24.1\n      c-0.2,4.5-0.5,5.2-4.5,8.1c-2.2,1.8-7.2,5-11,7.2c-7.9,4.7-11.5,7.8-14.3,12.2L124.9,372.3z");
    			add_location(path12, file$2, 427, 4, 37029);
    			set_style(g11, "color", getColor("Kreis 9", /*data*/ ctx[0]));
    			attr_dev(g11, "fill", "currentColor");
    			attr_dev(g11, "stroke-width", "1");
    			attr_dev(g11, "stroke", "currentColor");
    			attr_dev(g11, "class", "Kreis9");
    			add_location(g11, file$2, 421, 2, 36884);
    			attr_dev(path13, "d", "M182.5,467.9c-2.2-2.4-3.8-5-3.8-6.4c0-3.2-2.5-9.1-4-9.1c-0.8,0-0.5-0.8,0.6-2c1.4-1.5,1.7-3,1.3-7.3\n      l-0.5-5.4L163,424.6c-7.2-7.3-15.1-14.6-17.7-16.3c-4.1-2.6-4.5-3.3-4-5.8c0.3-1.7,0-3.4-0.7-4.3c-0.4-0.9-0.4-1.1-0.7-1.4\n      c-0.2-0.3-0.5-1.1-2.5-2.5c-3.8-2.6-3.9-2.7-3.6-8.9c0.1-3.2-0.3-4.4-2-5.6c-4.5-3.1,1.3-10.4,15.4-19.4\n      c15.5-9.9,15.8-10.2,15.8-18.2c0-5,2.1-8.9,6.3-11.8c3.8-2.6,12.9-12.4,16.4-17.7c5.2-7.6,4.5-14.7-1.9-20.8\n      c-1.3-1.2-2.3-2.5-2.3-2.9c0-0.5-0.7-1.5-1.5-2.2c-2-2-1.9-2.4,1-5.5c1.4-1.5,2.4-3,2.4-3.5c0-1.3,5.1-7,6.2-7c0.6,0,2.4,1.1,4,2.4\n      c1.7,1.3,3.4,2.8,4.1,3.4c0.7,0.5,1.7,1,2.2,1c0.6,0,1.3,0.7,1.6,1.5c0.4,0.8,1,1.5,1.5,1.5c0.4,0,2.7,1.4,5.2,2.9\n      c2.3,1.7,6.2,3.6,8.5,4.5c2.3,0.8,5.8,2.3,7.7,3.4c1.9,1.2,5.5,2.9,8.1,3.9c2.5,1,6,3.4,7.6,5.3s3.4,3.4,3.8,3.4\n      c0.4,0,4.4,3.7,9,8.1c4.5,4.5,9.7,9,11.3,10.1c3.4,2,3.5,3,0.7,4.7c-3.5,2.1-11.3,10.6-12.7,14c-1.7,3.9-2,12.2-0.6,14.8\n      c1.3,2.2,4.1,22.6,4.7,33.6c0.6,10.1-0.3,12.1-6.6,14.7c-11.5,4.9-16.5,7.4-18.4,9.3c-3,3-2.6,9.3,1,18.6c3.4,9,3.4,11.3-0.1,11\n      c-17.3-1.8-17.6-1.7-25.6,2.1c-5.2,2.5-8.7,5-10.9,7.8c-4.2,5.1-9,15-8.5,17.8C187.7,472.8,186.4,472,182.5,467.9z");
    			add_location(path13, file$2, 450, 4, 38968);
    			set_style(g12, "color", getColor("Kreis 3", /*data*/ ctx[0]));
    			attr_dev(g12, "fill", "currentColor");
    			attr_dev(g12, "stroke-width", "1");
    			attr_dev(g12, "stroke", "currentColor");
    			attr_dev(g12, "class", "Kreis3");
    			add_location(g12, file$2, 444, 2, 38823);
    			attr_dev(text_1, "transform", "matrix(0.5909 0.8068 -0.8068 0.5909 335 415)");
    			set_style(text_1, "font-family", "serif");
    			set_style(text_1, "font-size", "10px");
    			set_style(text_1, "fill", "#03254c");
    			add_location(text_1, file$2, 462, 2, 40173);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "viewBox", "0 0 600 568");
    			set_style(svg, "enable-background", "new 0 0 600 568");
    			add_location(svg, file$2, 30, 0, 769);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g0);
    			append_dev(g0, path0);
    			append_dev(svg, g1);
    			append_dev(g1, path1);
    			append_dev(svg, g2);
    			append_dev(g2, path2);
    			append_dev(svg, g3);
    			append_dev(g3, path3);
    			append_dev(svg, path4);
    			append_dev(svg, g4);
    			append_dev(g4, path5);
    			append_dev(svg, g5);
    			append_dev(g5, path6);
    			append_dev(svg, g6);
    			append_dev(g6, path7);
    			append_dev(svg, g7);
    			append_dev(g7, path8);
    			append_dev(svg, g8);
    			append_dev(g8, path9);
    			append_dev(svg, g9);
    			append_dev(g9, path10);
    			append_dev(svg, g10);
    			append_dev(g10, path11);
    			append_dev(svg, g11);
    			append_dev(g11, path12);
    			append_dev(svg, g12);
    			append_dev(g12, path13);
    			append_dev(svg, text_1);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1) {
    				set_style(g0, "color", getColor("Kreis 8", /*data*/ ctx[0]));
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(g1, "color", getColor("Kreis 2", /*data*/ ctx[0]));
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(g2, "color", getColor("Kreis 1", /*data*/ ctx[0]));
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(g4, "color", getColor("Kreis 10", /*data*/ ctx[0]));
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(g5, "color", getColor("Kreis 6", /*data*/ ctx[0]));
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(g6, "color", getColor("Kreis 11", /*data*/ ctx[0]));
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(g7, "color", getColor("Kreis 12", /*data*/ ctx[0]));
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(g8, "color", getColor("Kreis 7", /*data*/ ctx[0]));
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(g9, "color", getColor("Kreis 4", /*data*/ ctx[0]));
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(g10, "color", getColor("Kreis 5", /*data*/ ctx[0]));
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(g11, "color", getColor("Kreis 9", /*data*/ ctx[0]));
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(g12, "color", getColor("Kreis 3", /*data*/ ctx[0]));
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getValue(data, districtName) {
    	return data.districts.find(district => district.name === districtName).totalReports;
    }

    function getColor(district, data) {
    	let value = getValue(data, district);
    	console.log(value);
    	const buckets = data.legend.buckets;

    	const bucket = buckets.find((bucket, index) => {
    		if (index === 0) {
    			return value <= bucket.to;
    		} else if (index === buckets.length - 1) {
    			return bucket.from < value;
    		} else {
    			return bucket.from < value && value <= bucket.to;
    		}
    	});

    	if (bucket) {
    		console.log(bucket.color.colorClass);
    		return bucket.color.colorClass;
    	} else {
    		return "s-color-gray-4";
    	}
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Map", slots, []);
    	let { data } = $$props;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Map> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ data, getValue, getColor });

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data];
    }

    class Map$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Map",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console_1.warn("<Map> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/ColoredSvgMap.svelte generated by Svelte v3.35.0 */
    const file$1 = "src/components/ColoredSvgMap.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let legend;
    	let t;
    	let map;
    	let current;

    	legend = new Legend({
    			props: { data: /*data*/ ctx[0] },
    			$$inline: true
    		});

    	map = new Map$1({
    			props: { data: /*data*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(legend.$$.fragment);
    			t = space();
    			create_component(map.$$.fragment);
    			attr_dev(div, "class", "map-container svelte-xnx8y1");
    			add_location(div, file$1, 16, 0, 243);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(legend, div, null);
    			append_dev(div, t);
    			mount_component(map, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const legend_changes = {};
    			if (dirty & /*data*/ 1) legend_changes.data = /*data*/ ctx[0];
    			legend.$set(legend_changes);
    			const map_changes = {};
    			if (dirty & /*data*/ 1) map_changes.data = /*data*/ ctx[0];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(legend.$$.fragment, local);
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(legend.$$.fragment, local);
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(legend);
    			destroy_component(map);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ColoredSvgMap", slots, []);
    	let { data } = $$props;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ColoredSvgMap> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ Legend, Map: Map$1, data });

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data];
    }

    class ColoredSvgMap extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColoredSvgMap",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<ColoredSvgMap> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<ColoredSvgMap>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ColoredSvgMap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.35.0 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (105:8) {#each data as entry}
    function create_each_block(ctx) {
    	let div;
    	let t0_value = /*entry*/ ctx[4].year + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*entry*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "slider svelte-4hdkjs");
    			toggle_class(div, "active-year", /*activeYear*/ ctx[2] === /*entry*/ ctx[4].year);
    			add_location(div, file, 105, 10, 1944);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*entry*/ ctx[4].year + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*activeYear, data*/ 5) {
    				toggle_class(div, "active-year", /*activeYear*/ ctx[2] === /*entry*/ ctx[4].year);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(105:8) {#each data as entry}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let div5;
    	let div3;
    	let div2;
    	let t2;
    	let coloredsvgmap;
    	let t3;
    	let div4;
    	let p;
    	let raw_value = getText(/*texts*/ ctx[1], /*activeYear*/ ctx[2]) + "";
    	let t4;
    	let footer;
    	let t5;
    	let a;
    	let current;
    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	coloredsvgmap = new ColoredSvgMap({
    			props: {
    				data: getData(/*data*/ ctx[0], /*activeYear*/ ctx[2])
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("\n    Graffiti in der Stadt Zuerich*");
    			t1 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			create_component(coloredsvgmap.$$.fragment);
    			t3 = space();
    			div4 = element("div");
    			p = element("p");
    			t4 = space();
    			footer = element("footer");
    			t5 = text("Repository auf\n  ");
    			a = element("a");
    			a.textContent = "github";
    			attr_dev(div0, "class", "zueri-flagge svelte-4hdkjs");
    			add_location(div0, file, 98, 4, 1736);
    			attr_dev(div1, "class", "header svelte-4hdkjs");
    			add_location(div1, file, 97, 2, 1711);
    			attr_dev(div2, "class", "slider-container svelte-4hdkjs");
    			add_location(div2, file, 103, 6, 1873);
    			attr_dev(div3, "class", "map svelte-4hdkjs");
    			add_location(div3, file, 102, 4, 1849);
    			add_location(p, file, 116, 6, 2259);
    			attr_dev(div4, "class", "texts svelte-4hdkjs");
    			add_location(div4, file, 115, 4, 2233);
    			attr_dev(div5, "class", "component-container svelte-4hdkjs");
    			add_location(div5, file, 101, 2, 1811);
    			attr_dev(main, "class", " svelte-4hdkjs");
    			add_location(main, file, 96, 0, 1693);
    			attr_dev(a, "href", "https://github.com/philipkueng/graffiti-in-zurich");
    			set_style(a, "color", "#949494");
    			set_style(a, "text-decoration", "underline");
    			add_location(a, file, 124, 2, 2394);
    			attr_dev(footer, "class", "related-info svelte-4hdkjs");
    			add_location(footer, file, 122, 0, 2345);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(main, t1);
    			append_dev(main, div5);
    			append_dev(div5, div3);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div3, t2);
    			mount_component(coloredsvgmap, div3, null);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, p);
    			p.innerHTML = raw_value;
    			insert_dev(target, t4, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, t5);
    			append_dev(footer, a);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*activeYear, data*/ 5) {
    				each_value = /*data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const coloredsvgmap_changes = {};
    			if (dirty & /*data, activeYear*/ 5) coloredsvgmap_changes.data = getData(/*data*/ ctx[0], /*activeYear*/ ctx[2]);
    			coloredsvgmap.$set(coloredsvgmap_changes);
    			if ((!current || dirty & /*texts, activeYear*/ 6) && raw_value !== (raw_value = getText(/*texts*/ ctx[1], /*activeYear*/ ctx[2]) + "")) p.innerHTML = raw_value;		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(coloredsvgmap.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(coloredsvgmap.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			destroy_component(coloredsvgmap);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(footer);
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

    function getData(data, activeYear) {
    	return data.find(stats => stats.year === activeYear);
    }

    function getText(texts, activeYear) {
    	let text = texts.find(text => text.year === activeYear);
    	if (text) return text.text;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { data } = $$props;
    	let { texts } = $$props;
    	let activeYear = 2018;
    	const writable_props = ["data", "texts"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = entry => $$invalidate(2, activeYear = entry.year);

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("texts" in $$props) $$invalidate(1, texts = $$props.texts);
    	};

    	$$self.$capture_state = () => ({
    		ColoredSvgMap,
    		data,
    		texts,
    		activeYear,
    		getData,
    		getText
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("texts" in $$props) $$invalidate(1, texts = $$props.texts);
    		if ("activeYear" in $$props) $$invalidate(2, activeYear = $$props.activeYear);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, texts, activeYear, click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { data: 0, texts: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<App> was created without expected prop 'data'");
    		}

    		if (/*texts*/ ctx[1] === undefined && !("texts" in props)) {
    			console.warn("<App> was created without expected prop 'texts'");
    		}
    	}

    	get data() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get texts() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set texts(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var data = [
    	{
    		year: 2018,
    		totalReports: 199,
    		districts: [
    			{
    				name: "Kreis 1",
    				totalReports: 24,
    				coordinates: [
    					{
    						lon: 8.5384426724,
    						lat: 47.3819806831
    					},
    					{
    						lon: 8.5425461585,
    						lat: 47.371651106
    					},
    					{
    						lon: 8.540807899,
    						lat: 47.3733947745
    					},
    					{
    						lon: 8.5408220678,
    						lat: 47.373439615
    					},
    					{
    						lon: 8.5460942678,
    						lat: 47.3716261361
    					},
    					{
    						lon: 8.5445635634,
    						lat: 47.3667744191
    					},
    					{
    						lon: 8.5406790423,
    						lat: 47.3735669117
    					},
    					{
    						lon: 8.5465463457,
    						lat: 47.3736277207
    					},
    					{
    						lon: 8.5446499428,
    						lat: 47.3702996967
    					},
    					{
    						lon: 8.5475803432,
    						lat: 47.3743194204
    					},
    					{
    						lon: 8.5268861868,
    						lat: 47.3731579749
    					},
    					{
    						lon: 8.5441812067,
    						lat: 47.3713206372
    					},
    					{
    						lon: 8.5434044349,
    						lat: 47.3702576458
    					},
    					{
    						lon: 8.548686007,
    						lat: 47.3733643087
    					},
    					{
    						lon: 8.5435302923,
    						lat: 47.3699416113
    					},
    					{
    						lon: 8.5473131279,
    						lat: 47.3742050485
    					},
    					{
    						lon: 8.5418770186,
    						lat: 47.3700293762
    					},
    					{
    						lon: 8.5435040025,
    						lat: 47.369950858
    					},
    					{
    						lon: 8.5371613568,
    						lat: 47.3737893176
    					},
    					{
    						lon: 8.5476340484,
    						lat: 47.3743548854
    					},
    					{
    						lon: 8.5385093166,
    						lat: 47.3794344291
    					},
    					{
    						lon: 8.5264249145,
    						lat: 47.3810510337
    					},
    					{
    						lon: 8.5281679325,
    						lat: 47.3808007356
    					},
    					{
    						lon: 8.5295554584,
    						lat: 47.3806527148
    					}
    				]
    			},
    			{
    				name: "Kreis 2",
    				totalReports: 27,
    				coordinates: [
    					{
    						lon: 8.5278567486,
    						lat: 47.3500222772
    					},
    					{
    						lon: 8.5306595922,
    						lat: 47.3673204983
    					},
    					{
    						lon: 8.5257749738,
    						lat: 47.3524346161
    					},
    					{
    						lon: 8.5371758575,
    						lat: 47.3365850765
    					},
    					{
    						lon: 8.5329838409,
    						lat: 47.3431644238
    					},
    					{
    						lon: 8.5330103038,
    						lat: 47.343164173
    					},
    					{
    						lon: 8.5311979558,
    						lat: 47.3645179148
    					},
    					{
    						lon: 8.5268216933,
    						lat: 47.3596208927
    					},
    					{
    						lon: 8.5349854137,
    						lat: 47.3561974687
    					},
    					{
    						lon: 8.5263519246,
    						lat: 47.3619010933
    					},
    					{
    						lon: 8.5312572589,
    						lat: 47.3525537763
    					},
    					{
    						lon: 8.5338630247,
    						lat: 47.3524661223
    					},
    					{
    						lon: 8.5251882833,
    						lat: 47.3613183673
    					},
    					{
    						lon: 8.5333966698,
    						lat: 47.340066154
    					},
    					{
    						lon: 8.526002243,
    						lat: 47.3544923715
    					},
    					{
    						lon: 8.5252417772,
    						lat: 47.3613448495
    					},
    					{
    						lon: 8.5261068335,
    						lat: 47.3544284203
    					},
    					{
    						lon: 8.5311860937,
    						lat: 47.3626470343
    					},
    					{
    						lon: 8.5182633434,
    						lat: 47.3331474423
    					},
    					{
    						lon: 8.5352997633,
    						lat: 47.3592528448
    					},
    					{
    						lon: 8.5294854422,
    						lat: 47.3642912339
    					},
    					{
    						lon: 8.5322003634,
    						lat: 47.3527157565
    					},
    					{
    						lon: 8.5249594501,
    						lat: 47.3663308169
    					},
    					{
    						lon: 8.5321560961,
    						lat: 47.3531389495
    					},
    					{
    						lon: 8.5331700811,
    						lat: 47.3503048516
    					},
    					{
    						lon: 8.5352997633,
    						lat: 47.3592528448
    					},
    					{
    						lon: 8.5315946058,
    						lat: 47.3412436135
    					}
    				]
    			},
    			{
    				name: "Kreis 3",
    				totalReports: 10,
    				coordinates: [
    					{
    						lon: 8.508832941,
    						lat: 47.3814761952
    					},
    					{
    						lon: 8.5189286806,
    						lat: 47.3751486293
    					},
    					{
    						lon: 8.5178637507,
    						lat: 47.3755273829
    					},
    					{
    						lon: 8.5091620879,
    						lat: 47.3800609188
    					},
    					{
    						lon: 8.5189138007,
    						lat: 47.3750678125
    					},
    					{
    						lon: 8.5145224086,
    						lat: 47.3713758285
    					},
    					{
    						lon: 8.5186956552,
    						lat: 47.3754116664
    					},
    					{
    						lon: 8.513848506,
    						lat: 47.3701317833
    					},
    					{
    						lon: 8.5187078013,
    						lat: 47.3753575822
    					},
    					{
    						lon: 8.5189415555,
    						lat: 47.3751305187
    					}
    				]
    			},
    			{
    				name: "Kreis 4",
    				totalReports: 19,
    				coordinates: [
    					{
    						lon: 8.5204605143,
    						lat: 47.3768973342
    					},
    					{
    						lon: 8.5199569547,
    						lat: 47.3762274161
    					},
    					{
    						lon: 8.519509575,
    						lat: 47.3750622393
    					},
    					{
    						lon: 8.5217251463,
    						lat: 47.3765706552
    					},
    					{
    						lon: 8.5237851176,
    						lat: 47.3756338211
    					},
    					{
    						lon: 8.5224479948,
    						lat: 47.3749987263
    					},
    					{
    						lon: 8.5205790564,
    						lat: 47.3736040142
    					},
    					{
    						lon: 8.5209297541,
    						lat: 47.3758764918
    					},
    					{
    						lon: 8.5209703861,
    						lat: 47.3759210866
    					},
    					{
    						lon: 8.5231761808,
    						lat: 47.3710880102
    					},
    					{
    						lon: 8.5276698563,
    						lat: 47.3732765208
    					},
    					{
    						lon: 8.5188046823,
    						lat: 47.377524496
    					},
    					{
    						lon: 8.5208637386,
    						lat: 47.3758861054
    					},
    					{
    						lon: 8.5208236545,
    						lat: 47.3758684907
    					},
    					{
    						lon: 8.5234591941,
    						lat: 47.3784883317
    					},
    					{
    						lon: 8.52088967,
    						lat: 47.3758588771
    					},
    					{
    						lon: 8.5191204378,
    						lat: 47.377422597
    					},
    					{
    						lon: 8.5212081712,
    						lat: 47.3798047427
    					},
    					{
    						lon: 8.5235624987,
    						lat: 47.3809610143
    					}
    				]
    			},
    			{
    				name: "Kreis 5",
    				totalReports: 13,
    				coordinates: [
    					{
    						lon: 8.5131587016,
    						lat: 47.3910877491
    					},
    					{
    						lon: 8.5298134266,
    						lat: 47.38613729
    					},
    					{
    						lon: 8.5315685842,
    						lat: 47.3864715089
    					},
    					{
    						lon: 8.5210531307,
    						lat: 47.3852122442
    					},
    					{
    						lon: 8.5595313322,
    						lat: 47.3538659154
    					},
    					{
    						lon: 8.5201319357,
    						lat: 47.3920301397
    					},
    					{
    						lon: 8.5149781761,
    						lat: 47.386078555
    					},
    					{
    						lon: 8.5155035258,
    						lat: 47.3865144182
    					},
    					{
    						lon: 8.5285425381,
    						lat: 47.3809860993
    					},
    					{
    						lon: 8.5353805604,
    						lat: 47.3812002332
    					},
    					{
    						lon: 8.5305382758,
    						lat: 47.3820826469
    					},
    					{
    						lon: 8.5353216747,
    						lat: 47.3809129485
    					},
    					{
    						lon: 8.5287744433,
    						lat: 47.3819643776
    					}
    				]
    			},
    			{
    				name: "Kreis 6",
    				totalReports: 44,
    				coordinates: [
    					{
    						lon: 8.5399813821,
    						lat: 47.3827396048
    					},
    					{
    						lon: 8.5473788331,
    						lat: 47.3862758925
    					},
    					{
    						lon: 8.5472350817,
    						lat: 47.3870058766
    					},
    					{
    						lon: 8.5401778269,
    						lat: 47.3845547455
    					},
    					{
    						lon: 8.5479379987,
    						lat: 47.386414447
    					},
    					{
    						lon: 8.5462020347,
    						lat: 47.3838225161
    					},
    					{
    						lon: 8.5394578089,
    						lat: 47.383680087
    					},
    					{
    						lon: 8.546355327,
    						lat: 47.3797282615
    					},
    					{
    						lon: 8.5392032483,
    						lat: 47.3835385905
    					},
    					{
    						lon: 8.5409089816,
    						lat: 47.3834053921
    					},
    					{
    						lon: 8.5409731426,
    						lat: 47.3833058336
    					},
    					{
    						lon: 8.5405201449,
    						lat: 47.3831752283
    					},
    					{
    						lon: 8.5480266604,
    						lat: 47.3849473905
    					},
    					{
    						lon: 8.5473150547,
    						lat: 47.3863934411
    					},
    					{
    						lon: 8.5466874711,
    						lat: 47.3867862518
    					},
    					{
    						lon: 8.5478929318,
    						lat: 47.3848857087
    					},
    					{
    						lon: 8.5526068214,
    						lat: 47.384831358
    					},
    					{
    						lon: 8.539734823,
    						lat: 47.3804212136
    					},
    					{
    						lon: 8.5412914285,
    						lat: 47.3807661716
    					},
    					{
    						lon: 8.5405495721,
    						lat: 47.3807552598
    					},
    					{
    						lon: 8.5354321676,
    						lat: 47.3862819798
    					},
    					{
    						lon: 8.5378254037,
    						lat: 47.3950744273
    					},
    					{
    						lon: 8.5369152502,
    						lat: 47.3952629829
    					},
    					{
    						lon: 8.546355327,
    						lat: 47.3797282615
    					},
    					{
    						lon: 8.528495651,
    						lat: 47.3897027871
    					},
    					{
    						lon: 8.5405867506,
    						lat: 47.3889584491
    					},
    					{
    						lon: 8.5405859799,
    						lat: 47.3831566101
    					},
    					{
    						lon: 8.5481228688,
    						lat: 47.3800261291
    					},
    					{
    						lon: 8.5400073071,
    						lat: 47.3827123723
    					},
    					{
    						lon: 8.5333310548,
    						lat: 47.3981214442
    					},
    					{
    						lon: 8.5393375207,
    						lat: 47.3836272624
    					},
    					{
    						lon: 8.5390971307,
    						lat: 47.3835306062
    					},
    					{
    						lon: 8.5392976104,
    						lat: 47.3836186475
    					},
    					{
    						lon: 8.5372202425,
    						lat: 47.3952780739
    					},
    					{
    						lon: 8.5387951532,
    						lat: 47.3958477709
    					},
    					{
    						lon: 8.5414846159,
    						lat: 47.3811421228
    					},
    					{
    						lon: 8.5368794372,
    						lat: 47.3851708288
    					},
    					{
    						lon: 8.5466036829,
    						lat: 47.3859415141
    					},
    					{
    						lon: 8.5389312574,
    						lat: 47.3864016265
    					},
    					{
    						lon: 8.5365679314,
    						lat: 47.3854796231
    					},
    					{
    						lon: 8.5393779899,
    						lat: 47.3881514167
    					},
    					{
    						lon: 8.546376418,
    						lat: 47.3839287857
    					},
    					{
    						lon: 8.5472362258,
    						lat: 47.3845142168
    					},
    					{
    						lon: 8.5456479752,
    						lat: 47.379465188
    					}
    				]
    			},
    			{
    				name: "Kreis 7",
    				totalReports: 9,
    				coordinates: [
    					{
    						lon: 8.5982036688,
    						lat: 47.3566503502
    					},
    					{
    						lon: 8.5859942854,
    						lat: 47.3582925164
    					},
    					{
    						lon: 8.5869908509,
    						lat: 47.3560068076
    					},
    					{
    						lon: 8.5779915479,
    						lat: 47.3561049539
    					},
    					{
    						lon: 8.5766573406,
    						lat: 47.3556143772
    					},
    					{
    						lon: 8.5981476008,
    						lat: 47.3565069887
    					},
    					{
    						lon: 8.5762336978,
    						lat: 47.3618162746
    					},
    					{
    						lon: 8.5563952077,
    						lat: 47.3766451611
    					},
    					{
    						lon: 8.5655842339,
    						lat: 47.3640615531
    					}
    				]
    			},
    			{
    				name: "Kreis 8",
    				totalReports: 6,
    				coordinates: [
    					{
    						lon: 8.5716311059,
    						lat: 47.3582904162
    					},
    					{
    						lon: 8.5504445455,
    						lat: 47.3599085966
    					},
    					{
    						lon: 8.5610045646,
    						lat: 47.3502804953
    					},
    					{
    						lon: 8.5681553948,
    						lat: 47.357317001
    					},
    					{
    						lon: 8.5609535082,
    						lat: 47.3497412771
    					},
    					{
    						lon: 8.5575043894,
    						lat: 47.3600922748
    					}
    				]
    			},
    			{
    				name: "Kreis 9",
    				totalReports: 15,
    				coordinates: [
    					{
    						lon: 8.4961923519,
    						lat: 47.3784893036
    					},
    					{
    						lon: 8.4916952604,
    						lat: 47.3774239925
    					},
    					{
    						lon: 8.4884189879,
    						lat: 47.3912701832
    					},
    					{
    						lon: 8.5035563507,
    						lat: 47.3811921366
    					},
    					{
    						lon: 8.4944161787,
    						lat: 47.3971252687
    					},
    					{
    						lon: 8.4765722457,
    						lat: 47.3842171767
    					},
    					{
    						lon: 8.5031736793,
    						lat: 47.3912071555
    					},
    					{
    						lon: 8.4880448837,
    						lat: 47.3924519279
    					},
    					{
    						lon: 8.4829876775,
    						lat: 47.3925966889
    					},
    					{
    						lon: 8.4932175186,
    						lat: 47.3921169963
    					},
    					{
    						lon: 8.4901525589,
    						lat: 47.3938719698
    					},
    					{
    						lon: 8.4885628948,
    						lat: 47.3911789256
    					},
    					{
    						lon: 8.4886486534,
    						lat: 47.3928422237
    					},
    					{
    						lon: 8.5033964511,
    						lat: 47.3950639718
    					},
    					{
    						lon: 8.4848336925,
    						lat: 47.395539346
    					}
    				]
    			},
    			{
    				name: "Kreis 10",
    				totalReports: 14,
    				coordinates: [
    					{
    						lon: 8.5127083234,
    						lat: 47.397658318
    					},
    					{
    						lon: 8.4942501082,
    						lat: 47.4067964038
    					},
    					{
    						lon: 8.5119408736,
    						lat: 47.3963881534
    					},
    					{
    						lon: 8.4961947568,
    						lat: 47.4039721916
    					},
    					{
    						lon: 8.4894452662,
    						lat: 47.4077126973
    					},
    					{
    						lon: 8.5302436044,
    						lat: 47.3967923951
    					},
    					{
    						lon: 8.530256665,
    						lat: 47.3967832766
    					},
    					{
    						lon: 8.5237399509,
    						lat: 47.3935794456
    					},
    					{
    						lon: 8.5154584111,
    						lat: 47.3980464972
    					},
    					{
    						lon: 8.5214381341,
    						lat: 47.3930793243
    					},
    					{
    						lon: 8.5035322016,
    						lat: 47.4045074855
    					},
    					{
    						lon: 8.5192180118,
    						lat: 47.3926863342
    					},
    					{
    						lon: 8.5301152096,
    						lat: 47.3969914992
    					},
    					{
    						lon: 8.5132276204,
    						lat: 47.3945052266
    					}
    				]
    			},
    			{
    				name: "Kreis 11",
    				totalReports: 17,
    				coordinates: [
    					{
    						lon: 8.5032142575,
    						lat: 47.4224104141
    					},
    					{
    						lon: 8.5384289137,
    						lat: 47.4223866319
    					},
    					{
    						lon: 8.5330486753,
    						lat: 47.4172655593
    					},
    					{
    						lon: 8.5554619624,
    						lat: 47.404152277
    					},
    					{
    						lon: 8.5492148206,
    						lat: 47.4190812978
    					},
    					{
    						lon: 8.538838553,
    						lat: 47.4146290305
    					},
    					{
    						lon: 8.5167247824,
    						lat: 47.4148013996
    					},
    					{
    						lon: 8.5326454005,
    						lat: 47.4163428901
    					},
    					{
    						lon: 8.5329980781,
    						lat: 47.4173829734
    					},
    					{
    						lon: 8.5351961863,
    						lat: 47.4166515382
    					},
    					{
    						lon: 8.5366568089,
    						lat: 47.4167905894
    					},
    					{
    						lon: 8.5323217738,
    						lat: 47.4147808198
    					},
    					{
    						lon: 8.5455556295,
    						lat: 47.4120013187
    					},
    					{
    						lon: 8.5384267339,
    						lat: 47.4088041665
    					},
    					{
    						lon: 8.5458413518,
    						lat: 47.4129970322
    					},
    					{
    						lon: 8.5456242923,
    						lat: 47.4172177834
    					},
    					{
    						lon: 8.547280558,
    						lat: 47.4063808676
    					}
    				]
    			},
    			{
    				name: "Kreis 12",
    				totalReports: 1,
    				coordinates: [
    					{
    						lon: 8.5715794579,
    						lat: 47.4050748166
    					}
    				]
    			}
    		],
    		legend: {
    			maxValue: 44,
    			minValue: 1,
    			buckets: [
    				{
    					from: 1,
    					to: 1,
    					color: {
    						colorClass: "#e3e4e9"
    					}
    				},
    				{
    					from: 1,
    					to: 10,
    					color: {
    						colorClass: "#c1c8ee"
    					}
    				},
    				{
    					from: 10,
    					to: 15,
    					color: {
    						colorClass: "#a1abf1"
    					}
    				},
    				{
    					from: 15,
    					to: 19,
    					color: {
    						colorClass: "#818ef2"
    					}
    				},
    				{
    					from: 19,
    					to: 27,
    					color: {
    						colorClass: "#6070f1"
    					}
    				},
    				{
    					from: 27,
    					to: 44,
    					color: {
    						colorClass: "#3952ee"
    					}
    				}
    			]
    		}
    	},
    	{
    		year: 2019,
    		totalReports: 318,
    		districts: [
    			{
    				name: "Kreis 1",
    				totalReports: 71,
    				coordinates: [
    					{
    						lon: 8.5434042485,
    						lat: 47.3702486524
    					},
    					{
    						lon: 8.5425381798,
    						lat: 47.3699870784
    					},
    					{
    						lon: 8.5419930187,
    						lat: 47.3692366943
    					},
    					{
    						lon: 8.5420036505,
    						lat: 47.3691106605
    					},
    					{
    						lon: 8.5427840914,
    						lat: 47.3709921854
    					},
    					{
    						lon: 8.5428051422,
    						lat: 47.3720084366
    					},
    					{
    						lon: 8.541063476,
    						lat: 47.3710266112
    					},
    					{
    						lon: 8.5477134835,
    						lat: 47.3743541227
    					},
    					{
    						lon: 8.5380835907,
    						lat: 47.3722783544
    					},
    					{
    						lon: 8.5367339526,
    						lat: 47.369754562
    					},
    					{
    						lon: 8.5446766058,
    						lat: 47.3703084365
    					},
    					{
    						lon: 8.5463962612,
    						lat: 47.3702289901
    					},
    					{
    						lon: 8.5402963148,
    						lat: 47.3665813278
    					},
    					{
    						lon: 8.5410220869,
    						lat: 47.3709460498
    					},
    					{
    						lon: 8.5424044951,
    						lat: 47.3699253899
    					},
    					{
    						lon: 8.5425913185,
    						lat: 47.3699955657
    					},
    					{
    						lon: 8.5432787684,
    						lat: 47.3699440172
    					},
    					{
    						lon: 8.5381820316,
    						lat: 47.37769249
    					},
    					{
    						lon: 8.5424046813,
    						lat: 47.3699343833
    					},
    					{
    						lon: 8.5427421409,
    						lat: 47.3708846446
    					},
    					{
    						lon: 8.5429803248,
    						lat: 47.377907577
    					},
    					{
    						lon: 8.5403571148,
    						lat: 47.3778516688
    					},
    					{
    						lon: 8.5429153258,
    						lat: 47.3728529275
    					},
    					{
    						lon: 8.5428512147,
    						lat: 47.3710365195
    					},
    					{
    						lon: 8.5427980512,
    						lat: 47.3723053444
    					},
    					{
    						lon: 8.5475648588,
    						lat: 47.3742116272
    					},
    					{
    						lon: 8.543079062,
    						lat: 47.3711692684
    					},
    					{
    						lon: 8.5427660096,
    						lat: 47.3707584842
    					},
    					{
    						lon: 8.5429801385,
    						lat: 47.3778985836
    					},
    					{
    						lon: 8.5412113912,
    						lat: 47.3660148952
    					},
    					{
    						lon: 8.5296765663,
    						lat: 47.3691018318
    					},
    					{
    						lon: 8.5401554728,
    						lat: 47.3732210951
    					},
    					{
    						lon: 8.5407739829,
    						lat: 47.3730352922
    					},
    					{
    						lon: 8.5388943944,
    						lat: 47.3775597754
    					},
    					{
    						lon: 8.5414331355,
    						lat: 47.3728940737
    					},
    					{
    						lon: 8.5433453317,
    						lat: 47.3699613709
    					},
    					{
    						lon: 8.5424044951,
    						lat: 47.3699253899
    					},
    					{
    						lon: 8.5434782719,
    						lat: 47.3699870847
    					},
    					{
    						lon: 8.5435308515,
    						lat: 47.3699685914
    					},
    					{
    						lon: 8.5423793224,
    						lat: 47.3699885966
    					},
    					{
    						lon: 8.5419462978,
    						lat: 47.3669793549
    					},
    					{
    						lon: 8.5427684191,
    						lat: 47.3715140542
    					},
    					{
    						lon: 8.5412151113,
    						lat: 47.366194763
    					},
    					{
    						lon: 8.5429801385,
    						lat: 47.3778985836
    					},
    					{
    						lon: 8.5441515503,
    						lat: 47.3698906908
    					},
    					{
    						lon: 8.5439220324,
    						lat: 47.3715929723
    					},
    					{
    						lon: 8.5429013736,
    						lat: 47.3709011126
    					},
    					{
    						lon: 8.5305631128,
    						lat: 47.3684278133
    					},
    					{
    						lon: 8.5419336137,
    						lat: 47.3778815982
    					},
    					{
    						lon: 8.5417001067,
    						lat: 47.3787563562
    					},
    					{
    						lon: 8.541552285,
    						lat: 47.372892936
    					},
    					{
    						lon: 8.5435709387,
    						lat: 47.3699861983
    					},
    					{
    						lon: 8.5473795107,
    						lat: 47.3742134065
    					},
    					{
    						lon: 8.5419468538,
    						lat: 47.3778814718
    					},
    					{
    						lon: 8.538610661,
    						lat: 47.3824198446
    					},
    					{
    						lon: 8.5358487267,
    						lat: 47.3782094077
    					},
    					{
    						lon: 8.5415060285,
    						lat: 47.373217203
    					},
    					{
    						lon: 8.5417980768,
    						lat: 47.3719730835
    					},
    					{
    						lon: 8.5417456658,
    						lat: 47.3675209812
    					},
    					{
    						lon: 8.5413140962,
    						lat: 47.3664996537
    					},
    					{
    						lon: 8.543517427,
    						lat: 47.3699597247
    					},
    					{
    						lon: 8.5457681616,
    						lat: 47.3718631365
    					},
    					{
    						lon: 8.538801708,
    						lat: 47.3756356995
    					},
    					{
    						lon: 8.5383750833,
    						lat: 47.3735708801
    					},
    					{
    						lon: 8.538473498,
    						lat: 47.3776987104
    					},
    					{
    						lon: 8.5292580948,
    						lat: 47.3687099979
    					},
    					{
    						lon: 8.5453116469,
    						lat: 47.3696457068
    					},
    					{
    						lon: 8.5431594392,
    						lat: 47.3699361632
    					},
    					{
    						lon: 8.5456774729,
    						lat: 47.3751472367
    					},
    					{
    						lon: 8.5406891574,
    						lat: 47.3727752423
    					},
    					{
    						lon: 8.5452414073,
    						lat: 47.3783806716
    					}
    				]
    			},
    			{
    				name: "Kreis 2",
    				totalReports: 54,
    				coordinates: [
    					{
    						lon: 8.5184115932,
    						lat: 47.3332809838
    					},
    					{
    						lon: 8.5144160431,
    						lat: 47.332643652
    					},
    					{
    						lon: 8.5303090657,
    						lat: 47.3644273739
    					},
    					{
    						lon: 8.5311641939,
    						lat: 47.3441351513
    					},
    					{
    						lon: 8.5330141054,
    						lat: 47.3446393519
    					},
    					{
    						lon: 8.5327246136,
    						lat: 47.3440753975
    					},
    					{
    						lon: 8.525006901,
    						lat: 47.3660605164
    					},
    					{
    						lon: 8.5305772109,
    						lat: 47.3439068294
    					},
    					{
    						lon: 8.5358609298,
    						lat: 47.3588607215
    					},
    					{
    						lon: 8.5358231698,
    						lat: 47.3583123744
    					},
    					{
    						lon: 8.5184115932,
    						lat: 47.3332809838
    					},
    					{
    						lon: 8.5316759273,
    						lat: 47.3671669619
    					},
    					{
    						lon: 8.5323468531,
    						lat: 47.3501777249
    					},
    					{
    						lon: 8.5375769638,
    						lat: 47.3644034203
    					},
    					{
    						lon: 8.5269258721,
    						lat: 47.3549963949
    					},
    					{
    						lon: 8.5322684245,
    						lat: 47.3560343347
    					},
    					{
    						lon: 8.5285246529,
    						lat: 47.3470835412
    					},
    					{
    						lon: 8.5289319171,
    						lat: 47.3469357727
    					},
    					{
    						lon: 8.5290146146,
    						lat: 47.3464492509
    					},
    					{
    						lon: 8.5260701617,
    						lat: 47.3565246405
    					},
    					{
    						lon: 8.53013257,
    						lat: 47.3409336189
    					},
    					{
    						lon: 8.5329557171,
    						lat: 47.3430837335
    					},
    					{
    						lon: 8.5332118091,
    						lat: 47.3400858975
    					},
    					{
    						lon: 8.5337490977,
    						lat: 47.3398289353
    					},
    					{
    						lon: 8.53003216,
    						lat: 47.3631886596
    					},
    					{
    						lon: 8.5329856504,
    						lat: 47.3406727312
    					},
    					{
    						lon: 8.5325427972,
    						lat: 47.3552131743
    					},
    					{
    						lon: 8.5342371778,
    						lat: 47.3552151003
    					},
    					{
    						lon: 8.5305473764,
    						lat: 47.3469744765
    					},
    					{
    						lon: 8.5331224019,
    						lat: 47.3473368875
    					},
    					{
    						lon: 8.5271270392,
    						lat: 47.351882167
    					},
    					{
    						lon: 8.5307150113,
    						lat: 47.3648553033
    					},
    					{
    						lon: 8.5263867619,
    						lat: 47.3642574947
    					},
    					{
    						lon: 8.5327926963,
    						lat: 47.3473939839
    					},
    					{
    						lon: 8.5310608736,
    						lat: 47.3545975413
    					},
    					{
    						lon: 8.532490511,
    						lat: 47.3565359611
    					},
    					{
    						lon: 8.5301200686,
    						lat: 47.3642492572
    					},
    					{
    						lon: 8.5258543013,
    						lat: 47.3615189876
    					},
    					{
    						lon: 8.5250801962,
    						lat: 47.3612114424
    					},
    					{
    						lon: 8.5313899841,
    						lat: 47.3629059649
    					},
    					{
    						lon: 8.5311791235,
    						lat: 47.3629529357
    					},
    					{
    						lon: 8.5283373477,
    						lat: 47.3605870731
    					},
    					{
    						lon: 8.5281518626,
    						lat: 47.360579828
    					},
    					{
    						lon: 8.527739173,
    						lat: 47.3598191322
    					},
    					{
    						lon: 8.5269293781,
    						lat: 47.3545196176
    					},
    					{
    						lon: 8.5327078025,
    						lat: 47.3406753649
    					},
    					{
    						lon: 8.5307329986,
    						lat: 47.3469907112
    					},
    					{
    						lon: 8.5217937878,
    						lat: 47.3408502492
    					},
    					{
    						lon: 8.5249414482,
    						lat: 47.3660971126
    					},
    					{
    						lon: 8.5314930729,
    						lat: 47.3621224104
    					},
    					{
    						lon: 8.5324631889,
    						lat: 47.3623021243
    					},
    					{
    						lon: 8.5312787135,
    						lat: 47.3619985065
    					},
    					{
    						lon: 8.5247380815,
    						lat: 47.3665128016
    					},
    					{
    						lon: 8.5251610782,
    						lat: 47.3612826427
    					}
    				]
    			},
    			{
    				name: "Kreis 3",
    				totalReports: 12,
    				coordinates: [
    					{
    						lon: 8.5128077235,
    						lat: 47.3598780301
    					},
    					{
    						lon: 8.5100005402,
    						lat: 47.3782901102
    					},
    					{
    						lon: 8.5187284832,
    						lat: 47.3698433845
    					},
    					{
    						lon: 8.508941724,
    						lat: 47.3862335777
    					},
    					{
    						lon: 8.5098976014,
    						lat: 47.3797572631
    					},
    					{
    						lon: 8.4939344995,
    						lat: 47.3580911051
    					},
    					{
    						lon: 8.5087201559,
    						lat: 47.3850932572
    					},
    					{
    						lon: 8.5088865877,
    						lat: 47.3861261478
    					},
    					{
    						lon: 8.5187736343,
    						lat: 47.3753389764
    					},
    					{
    						lon: 8.508968389,
    						lat: 47.3862423258
    					},
    					{
    						lon: 8.5139393644,
    						lat: 47.3706976295
    					},
    					{
    						lon: 8.5115563862,
    						lat: 47.3726897173
    					}
    				]
    			},
    			{
    				name: "Kreis 4",
    				totalReports: 15,
    				coordinates: [
    					{
    						lon: 8.5261170706,
    						lat: 47.3808920201
    					},
    					{
    						lon: 8.5267767266,
    						lat: 47.3807688723
    					},
    					{
    						lon: 8.5320034217,
    						lat: 47.3734514651
    					},
    					{
    						lon: 8.5234332016,
    						lat: 47.3733073916
    					},
    					{
    						lon: 8.5209569638,
    						lat: 47.3759122173
    					},
    					{
    						lon: 8.5217541845,
    						lat: 47.3766963144
    					},
    					{
    						lon: 8.5241732527,
    						lat: 47.3784366484
    					},
    					{
    						lon: 8.519043003,
    						lat: 47.3775222673
    					},
    					{
    						lon: 8.5161839271,
    						lat: 47.3821724476
    					},
    					{
    						lon: 8.5160921478,
    						lat: 47.382218279
    					},
    					{
    						lon: 8.5159996411,
    						lat: 47.3822281368
    					},
    					{
    						lon: 8.5200393565,
    						lat: 47.373761985
    					},
    					{
    						lon: 8.5153883875,
    						lat: 47.3827825353
    					},
    					{
    						lon: 8.52765566,
    						lat: 47.3758222741
    					},
    					{
    						lon: 8.5247736459,
    						lat: 47.3786558827
    					}
    				]
    			},
    			{
    				name: "Kreis 5",
    				totalReports: 21,
    				coordinates: [
    					{
    						lon: 8.5174132313,
    						lat: 47.3853272435
    					},
    					{
    						lon: 8.5258968622,
    						lat: 47.3902219997
    					},
    					{
    						lon: 8.5313571555,
    						lat: 47.384557553
    					},
    					{
    						lon: 8.5090065427,
    						lat: 47.3940766603
    					},
    					{
    						lon: 8.5126877911,
    						lat: 47.3880967734
    					},
    					{
    						lon: 8.5124319984,
    						lat: 47.3885489039
    					},
    					{
    						lon: 8.5145002344,
    						lat: 47.3886466002
    					},
    					{
    						lon: 8.5125591943,
    						lat: 47.3869735859
    					},
    					{
    						lon: 8.5134544155,
    						lat: 47.388017684
    					},
    					{
    						lon: 8.5129814872,
    						lat: 47.3882109787
    					},
    					{
    						lon: 8.5131458304,
    						lat: 47.3897925809
    					},
    					{
    						lon: 8.5163484509,
    						lat: 47.3857239688
    					},
    					{
    						lon: 8.5133080207,
    						lat: 47.3879830655
    					},
    					{
    						lon: 8.513114448,
    						lat: 47.3895500062
    					},
    					{
    						lon: 8.520566812,
    						lat: 47.3880052733
    					},
    					{
    						lon: 8.5118263468,
    						lat: 47.3920176264
    					},
    					{
    						lon: 8.5126034756,
    						lat: 47.3858847714
    					},
    					{
    						lon: 8.5310859657,
    						lat: 47.4159078868
    					},
    					{
    						lon: 8.5312460674,
    						lat: 47.4159603438
    					},
    					{
    						lon: 8.5218396924,
    						lat: 47.3900262335
    					},
    					{
    						lon: 8.5211302075,
    						lat: 47.385094586
    					}
    				]
    			},
    			{
    				name: "Kreis 6",
    				totalReports: 36,
    				coordinates: [
    					{
    						lon: 8.5465811638,
    						lat: 47.3797620763
    					},
    					{
    						lon: 8.5466719639,
    						lat: 47.3828555314
    					},
    					{
    						lon: 8.5493844345,
    						lat: 47.383369192
    					},
    					{
    						lon: 8.5437883448,
    						lat: 47.4002706813
    					},
    					{
    						lon: 8.5466208854,
    						lat: 47.3797616954
    					},
    					{
    						lon: 8.5394453105,
    						lat: 47.3837161866
    					},
    					{
    						lon: 8.5400602722,
    						lat: 47.3827118673
    					},
    					{
    						lon: 8.5403376987,
    						lat: 47.3839595435
    					},
    					{
    						lon: 8.5395391159,
    						lat: 47.3837692634
    					},
    					{
    						lon: 8.5481811026,
    						lat: 47.3783704638
    					},
    					{
    						lon: 8.5482812735,
    						lat: 47.3787293073
    					},
    					{
    						lon: 8.5333442999,
    						lat: 47.3981213187
    					},
    					{
    						lon: 8.5466721509,
    						lat: 47.3828645247
    					},
    					{
    						lon: 8.5393643752,
    						lat: 47.3836449968
    					},
    					{
    						lon: 8.5317283538,
    						lat: 47.3974889704
    					},
    					{
    						lon: 8.5334653541,
    						lat: 47.3982101226
    					},
    					{
    						lon: 8.5333582842,
    						lat: 47.3981571665
    					},
    					{
    						lon: 8.5482855042,
    						lat: 47.3846570607
    					},
    					{
    						lon: 8.5337525078,
    						lat: 47.3870445058
    					},
    					{
    						lon: 8.5479863733,
    						lat: 47.384920792
    					},
    					{
    						lon: 8.5436318708,
    						lat: 47.3831455076
    					},
    					{
    						lon: 8.5360562166,
    						lat: 47.3876433093
    					},
    					{
    						lon: 8.541734679,
    						lat: 47.3817064282
    					},
    					{
    						lon: 8.5418148698,
    						lat: 47.381741643
    					},
    					{
    						lon: 8.5395391159,
    						lat: 47.3837692634
    					},
    					{
    						lon: 8.5462894249,
    						lat: 47.3861154346
    					},
    					{
    						lon: 8.528786446,
    						lat: 47.3896730586
    					},
    					{
    						lon: 8.5408403563,
    						lat: 47.3832891103
    					},
    					{
    						lon: 8.5410260215,
    						lat: 47.3813803731
    					},
    					{
    						lon: 8.5405859799,
    						lat: 47.3831566101
    					},
    					{
    						lon: 8.5483054876,
    						lat: 47.3849806933
    					},
    					{
    						lon: 8.5466617288,
    						lat: 47.3798152745
    					},
    					{
    						lon: 8.5372149438,
    						lat: 47.3943786162
    					},
    					{
    						lon: 8.5486157272,
    						lat: 47.3858862207
    					},
    					{
    						lon: 8.5463418996,
    						lat: 47.3797193951
    					},
    					{
    						lon: 8.5334852525,
    						lat: 47.3985337564
    					}
    				]
    			},
    			{
    				name: "Kreis 7",
    				totalReports: 14,
    				coordinates: [
    					{
    						lon: 8.5551675168,
    						lat: 47.3673470303
    					},
    					{
    						lon: 8.5520744877,
    						lat: 47.3701294148
    					},
    					{
    						lon: 8.5665321304,
    						lat: 47.3638094285
    					},
    					{
    						lon: 8.5625758314,
    						lat: 47.3689392837
    					},
    					{
    						lon: 8.5862619122,
    						lat: 47.3565807568
    					},
    					{
    						lon: 8.5648028253,
    						lat: 47.367181517
    					},
    					{
    						lon: 8.5569383774,
    						lat: 47.369713621
    					},
    					{
    						lon: 8.564218568,
    						lat: 47.3702365842
    					},
    					{
    						lon: 8.585571536,
    						lat: 47.3583326973
    					},
    					{
    						lon: 8.5959246533,
    						lat: 47.3608200371
    					},
    					{
    						lon: 8.6017881225,
    						lat: 47.3510552026
    					},
    					{
    						lon: 8.5617954047,
    						lat: 47.360806217
    					},
    					{
    						lon: 8.5628752391,
    						lat: 47.360534848
    					},
    					{
    						lon: 8.5655040126,
    						lat: 47.3602663545
    					}
    				]
    			},
    			{
    				name: "Kreis 8",
    				totalReports: 17,
    				coordinates: [
    					{
    						lon: 8.5500836565,
    						lat: 47.3552975312
    					},
    					{
    						lon: 8.5499194811,
    						lat: 47.3556769101
    					},
    					{
    						lon: 8.5489077862,
    						lat: 47.356676115
    					},
    					{
    						lon: 8.5490832098,
    						lat: 47.3568363418
    					},
    					{
    						lon: 8.5496682122,
    						lat: 47.3556883233
    					},
    					{
    						lon: 8.5531764927,
    						lat: 47.3525421679
    					},
    					{
    						lon: 8.551985267,
    						lat: 47.3525446654
    					},
    					{
    						lon: 8.5600194849,
    						lat: 47.3544188797
    					},
    					{
    						lon: 8.5600194849,
    						lat: 47.3544188797
    					},
    					{
    						lon: 8.5528770024,
    						lat: 47.3527789342
    					},
    					{
    						lon: 8.568181293,
    						lat: 47.357289762
    					},
    					{
    						lon: 8.5499068088,
    						lat: 47.3557040177
    					},
    					{
    						lon: 8.5573777204,
    						lat: 47.3597336936
    					},
    					{
    						lon: 8.58173387,
    						lat: 47.3509856405
    					},
    					{
    						lon: 8.5833333607,
    						lat: 47.3508888356
    					},
    					{
    						lon: 8.559500698,
    						lat: 47.3599649725
    					},
    					{
    						lon: 8.5721862587,
    						lat: 47.3576283154
    					}
    				]
    			},
    			{
    				name: "Kreis 9",
    				totalReports: 15,
    				coordinates: [
    					{
    						lon: 8.4942749964,
    						lat: 47.3726150711
    					},
    					{
    						lon: 8.4944101668,
    						lat: 47.3921420857
    					},
    					{
    						lon: 8.4968317481,
    						lat: 47.3846810409
    					},
    					{
    						lon: 8.4930561024,
    						lat: 47.3919925391
    					},
    					{
    						lon: 8.4943204896,
    						lat: 47.3922958204
    					},
    					{
    						lon: 8.4944244796,
    						lat: 47.3921959251
    					},
    					{
    						lon: 8.4944767418,
    						lat: 47.3921594675
    					},
    					{
    						lon: 8.4955438496,
    						lat: 47.3825160282
    					},
    					{
    						lon: 8.4764396525,
    						lat: 47.3842093728
    					},
    					{
    						lon: 8.4866666563,
    						lat: 47.376930019
    					},
    					{
    						lon: 8.5017964612,
    						lat: 47.3932167324
    					},
    					{
    						lon: 8.480865531,
    						lat: 47.380265691
    					},
    					{
    						lon: 8.5036831893,
    						lat: 47.3809121203
    					},
    					{
    						lon: 8.4829269469,
    						lat: 47.3922014577
    					},
    					{
    						lon: 8.4740673114,
    						lat: 47.3943500307
    					}
    				]
    			},
    			{
    				name: "Kreis 10",
    				totalReports: 21,
    				coordinates: [
    					{
    						lon: 8.5055131738,
    						lat: 47.3916173406
    					},
    					{
    						lon: 8.5181304119,
    						lat: 47.3971940248
    					},
    					{
    						lon: 8.5043870127,
    						lat: 47.4048504116
    					},
    					{
    						lon: 8.5037472661,
    						lat: 47.4053240488
    					},
    					{
    						lon: 8.5034828655,
    						lat: 47.40535347
    					},
    					{
    						lon: 8.5294571157,
    						lat: 47.3926710852
    					},
    					{
    						lon: 8.4838076922,
    						lat: 47.4121173689
    					},
    					{
    						lon: 8.521966689,
    						lat: 47.3923637602
    					},
    					{
    						lon: 8.5217400637,
    						lat: 47.3909896398
    					},
    					{
    						lon: 8.5191869647,
    						lat: 47.392461748
    					},
    					{
    						lon: 8.5064881039,
    						lat: 47.3999467276
    					},
    					{
    						lon: 8.506621642,
    						lat: 47.3999994637
    					},
    					{
    						lon: 8.5096232104,
    						lat: 47.3990541946
    					},
    					{
    						lon: 8.5095018325,
    						lat: 47.398947379
    					},
    					{
    						lon: 8.5036888256,
    						lat: 47.4043891073
    					},
    					{
    						lon: 8.5304575485,
    						lat: 47.3968893196
    					},
    					{
    						lon: 8.4862603744,
    						lat: 47.4014001505
    					},
    					{
    						lon: 8.5191623009,
    						lat: 47.3925519293
    					},
    					{
    						lon: 8.5035978962,
    						lat: 47.4044798952
    					},
    					{
    						lon: 8.4969043073,
    						lat: 47.4050091159
    					},
    					{
    						lon: 8.4810943754,
    						lat: 47.4068618322
    					}
    				]
    			},
    			{
    				name: "Kreis 11",
    				totalReports: 35,
    				coordinates: [
    					{
    						lon: 8.5032688806,
    						lat: 47.4224908656
    					},
    					{
    						lon: 8.5330593379,
    						lat: 47.4171395282
    					},
    					{
    						lon: 8.5380194234,
    						lat: 47.4173173402
    					},
    					{
    						lon: 8.5339210671,
    						lat: 47.4165107111
    					},
    					{
    						lon: 8.5468975507,
    						lat: 47.4070771606
    					},
    					{
    						lon: 8.5453602837,
    						lat: 47.4128037481
    					},
    					{
    						lon: 8.5521363929,
    						lat: 47.4212659729
    					},
    					{
    						lon: 8.5350381151,
    						lat: 47.4166980125
    					},
    					{
    						lon: 8.5464985866,
    						lat: 47.413377522
    					},
    					{
    						lon: 8.5167246003,
    						lat: 47.4147924063
    					},
    					{
    						lon: 8.5032146171,
    						lat: 47.4224284007
    					},
    					{
    						lon: 8.5479632698,
    						lat: 47.4137142819
    					},
    					{
    						lon: 8.5454509228,
    						lat: 47.4171654732
    					},
    					{
    						lon: 8.5282064026,
    						lat: 47.4137762607
    					},
    					{
    						lon: 8.5349582464,
    						lat: 47.41668078
    					},
    					{
    						lon: 8.5167246003,
    						lat: 47.4147924063
    					},
    					{
    						lon: 8.5458957319,
    						lat: 47.4149754202
    					},
    					{
    						lon: 8.5483049081,
    						lat: 47.4154830262
    					},
    					{
    						lon: 8.5330242084,
    						lat: 47.417364736
    					},
    					{
    						lon: 8.5403903222,
    						lat: 47.4127702695
    					},
    					{
    						lon: 8.5323217738,
    						lat: 47.4147808198
    					},
    					{
    						lon: 8.5586934969,
    						lat: 47.4078719544
    					},
    					{
    						lon: 8.5382534651,
    						lat: 47.4170992338
    					},
    					{
    						lon: 8.5323902364,
    						lat: 47.4148881123
    					},
    					{
    						lon: 8.512471929,
    						lat: 47.4148499781
    					},
    					{
    						lon: 8.5559072476,
    						lat: 47.4178024822
    					},
    					{
    						lon: 8.5513985762,
    						lat: 47.4208413153
    					},
    					{
    						lon: 8.5230529268,
    						lat: 47.4170988999
    					},
    					{
    						lon: 8.5584461357,
    						lat: 47.4175350505
    					},
    					{
    						lon: 8.5380210942,
    						lat: 47.4173982795
    					},
    					{
    						lon: 8.5531134555,
    						lat: 47.4204560004
    					},
    					{
    						lon: 8.5362494604,
    						lat: 47.4073136955
    					},
    					{
    						lon: 8.5461000256,
    						lat: 47.4139660188
    					},
    					{
    						lon: 8.5367511759,
    						lat: 47.4130117833
    					},
    					{
    						lon: 8.5225152781,
    						lat: 47.4147742376
    					}
    				]
    			},
    			{
    				name: "Kreis 12",
    				totalReports: 7,
    				coordinates: [
    					{
    						lon: 8.5663504577,
    						lat: 47.4071678434
    					},
    					{
    						lon: 8.5681682009,
    						lat: 47.4166578957
    					},
    					{
    						lon: 8.5625573741,
    						lat: 47.413906123
    					},
    					{
    						lon: 8.5680633479,
    						lat: 47.4167128905
    					},
    					{
    						lon: 8.555099526,
    						lat: 47.4115137483
    					},
    					{
    						lon: 8.5587318379,
    						lat: 47.4128458575
    					},
    					{
    						lon: 8.5681680101,
    						lat: 47.4166489025
    					}
    				]
    			}
    		],
    		legend: {
    			maxValue: 71,
    			minValue: 7,
    			buckets: [
    				{
    					from: 7,
    					to: 7,
    					color: {
    						colorClass: "#e3e4e9"
    					}
    				},
    				{
    					from: 7,
    					to: 17,
    					color: {
    						colorClass: "#c1c8ee"
    					}
    				},
    				{
    					from: 17,
    					to: 21,
    					color: {
    						colorClass: "#a1abf1"
    					}
    				},
    				{
    					from: 21,
    					to: 36,
    					color: {
    						colorClass: "#818ef2"
    					}
    				},
    				{
    					from: 36,
    					to: 54,
    					color: {
    						colorClass: "#6070f1"
    					}
    				},
    				{
    					from: 54,
    					to: 71,
    					color: {
    						colorClass: "#3952ee"
    					}
    				}
    			]
    		}
    	},
    	{
    		year: 2020,
    		totalReports: 344,
    		districts: [
    			{
    				name: "Kreis 1",
    				totalReports: 82,
    				coordinates: [
    					{
    						lon: 8.5439664275,
    						lat: 47.3769266705
    					},
    					{
    						lon: 8.543079638,
    						lat: 47.369918936
    					},
    					{
    						lon: 8.5442837446,
    						lat: 47.3698804302
    					},
    					{
    						lon: 8.5427484993,
    						lat: 47.3699131068
    					},
    					{
    						lon: 8.5406305486,
    						lat: 47.3737832578
    					},
    					{
    						lon: 8.5424865154,
    						lat: 47.3706891944
    					},
    					{
    						lon: 8.5432103417,
    						lat: 47.3698367297
    					},
    					{
    						lon: 8.5421110285,
    						lat: 47.3755771481
    					},
    					{
    						lon: 8.5304682381,
    						lat: 47.3683207685
    					},
    					{
    						lon: 8.5406742078,
    						lat: 47.373333084
    					},
    					{
    						lon: 8.5319356089,
    						lat: 47.3740188002
    					},
    					{
    						lon: 8.5282455388,
    						lat: 47.3807100526
    					},
    					{
    						lon: 8.5420444603,
    						lat: 47.3698028978
    					},
    					{
    						lon: 8.5430527891,
    						lat: 47.3699012024
    					},
    					{
    						lon: 8.5458450904,
    						lat: 47.3698294927
    					},
    					{
    						lon: 8.5435043753,
    						lat: 47.3699688447
    					},
    					{
    						lon: 8.5446821249,
    						lat: 47.3769558006
    					},
    					{
    						lon: 8.5402161344,
    						lat: 47.3723120068
    					},
    					{
    						lon: 8.5443067453,
    						lat: 47.3767345157
    					},
    					{
    						lon: 8.5453780237,
    						lat: 47.3696540659
    					},
    					{
    						lon: 8.5433783313,
    						lat: 47.3702758858
    					},
    					{
    						lon: 8.543563293,
    						lat: 47.3702561262
    					},
    					{
    						lon: 8.5386606558,
    						lat: 47.3822754467
    					},
    					{
    						lon: 8.5434235943,
    						lat: 47.3769318635
    					},
    					{
    						lon: 8.5443707123,
    						lat: 47.3772646167
    					},
    					{
    						lon: 8.5431977716,
    						lat: 47.3768980425
    					},
    					{
    						lon: 8.5475117151,
    						lat: 47.3742031422
    					},
    					{
    						lon: 8.5447568979,
    						lat: 47.3767302061
    					},
    					{
    						lon: 8.5475533227,
    						lat: 47.3666557995
    					},
    					{
    						lon: 8.5410581373,
    						lat: 47.3733294204
    					},
    					{
    						lon: 8.5407928005,
    						lat: 47.3733049671
    					},
    					{
    						lon: 8.5401690834,
    						lat: 47.3732389556
    					},
    					{
    						lon: 8.5438961148,
    						lat: 47.3716202058
    					},
    					{
    						lon: 8.5420845468,
    						lat: 47.3698205052
    					},
    					{
    						lon: 8.5308420269,
    						lat: 47.3684701518
    					},
    					{
    						lon: 8.5419913219,
    						lat: 47.3697944103
    					},
    					{
    						lon: 8.5412777629,
    						lat: 47.3660232567
    					},
    					{
    						lon: 8.5428420748,
    						lat: 47.3712345003
    					},
    					{
    						lon: 8.5429729782,
    						lat: 47.3705226315
    					},
    					{
    						lon: 8.5420709364,
    						lat: 47.3698026449
    					},
    					{
    						lon: 8.5406693361,
    						lat: 47.3737379121
    					},
    					{
    						lon: 8.5407253042,
    						lat: 47.3732426451
    					},
    					{
    						lon: 8.539551666,
    						lat: 47.3760423306
    					},
    					{
    						lon: 8.5420575122,
    						lat: 47.369793778
    					},
    					{
    						lon: 8.5298238402,
    						lat: 47.3691813968
    					},
    					{
    						lon: 8.5428402119,
    						lat: 47.3711445666
    					},
    					{
    						lon: 8.5423016585,
    						lat: 47.3668770127
    					},
    					{
    						lon: 8.5423096564,
    						lat: 47.37429794
    					},
    					{
    						lon: 8.5485516781,
    						lat: 47.3662774071
    					},
    					{
    						lon: 8.5471386679,
    						lat: 47.3753670975
    					},
    					{
    						lon: 8.5448445367,
    						lat: 47.376486498
    					},
    					{
    						lon: 8.5434038757,
    						lat: 47.3702306657
    					},
    					{
    						lon: 8.531693972,
    						lat: 47.3706299214
    					},
    					{
    						lon: 8.5427627816,
    						lat: 47.3737988765
    					},
    					{
    						lon: 8.5283621509,
    						lat: 47.3689253427
    					},
    					{
    						lon: 8.5407956257,
    						lat: 47.3728012119
    					},
    					{
    						lon: 8.5459532579,
    						lat: 47.3750366515
    					},
    					{
    						lon: 8.5434814407,
    						lat: 47.3701399721
    					},
    					{
    						lon: 8.5447434715,
    						lat: 47.3767213395
    					},
    					{
    						lon: 8.5431726773,
    						lat: 47.3699360366
    					},
    					{
    						lon: 8.5398830323,
    						lat: 47.3683663111
    					},
    					{
    						lon: 8.5432951807,
    						lat: 47.3694581216
    					},
    					{
    						lon: 8.5428420748,
    						lat: 47.3712345003
    					},
    					{
    						lon: 8.5447190449,
    						lat: 47.37682052
    					},
    					{
    						lon: 8.5419411617,
    						lat: 47.3699298168
    					},
    					{
    						lon: 8.5408742569,
    						lat: 47.3669985862
    					},
    					{
    						lon: 8.5419156162,
    						lat: 47.3699750366
    					},
    					{
    						lon: 8.5408619493,
    						lat: 47.3670436795
    					},
    					{
    						lon: 8.5429741058,
    						lat: 47.3699379354
    					},
    					{
    						lon: 8.5428523325,
    						lat: 47.3710904798
    					},
    					{
    						lon: 8.539933382,
    						lat: 47.3682398988
    					},
    					{
    						lon: 8.541909124,
    						lat: 47.3690216118
    					},
    					{
    						lon: 8.542876201,
    						lat: 47.3709643194
    					},
    					{
    						lon: 8.5472711658,
    						lat: 47.3740975094
    					},
    					{
    						lon: 8.5468343886,
    						lat: 47.3728333838
    					},
    					{
    						lon: 8.5474977276,
    						lat: 47.3741672959
    					},
    					{
    						lon: 8.5422619465,
    						lat: 47.3668773922
    					},
    					{
    						lon: 8.5428646393,
    						lat: 47.3710453863
    					},
    					{
    						lon: 8.5435341768,
    						lat: 47.3765170293
    					},
    					{
    						lon: 8.5330395889,
    						lat: 47.3716786059
    					},
    					{
    						lon: 8.5467725384,
    						lat: 47.3704952355
    					},
    					{
    						lon: 8.5481119603,
    						lat: 47.3674150242
    					}
    				]
    			},
    			{
    				name: "Kreis 2",
    				totalReports: 61,
    				coordinates: [
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5304531447,
    						lat: 47.3384928827
    					},
    					{
    						lon: 8.5338397276,
    						lat: 47.3474650131
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5293345776,
    						lat: 47.3685653534
    					},
    					{
    						lon: 8.523888476,
    						lat: 47.3475409933
    					},
    					{
    						lon: 8.5264219865,
    						lat: 47.3517089079
    					},
    					{
    						lon: 8.5204002387,
    						lat: 47.3510908447
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5290852132,
    						lat: 47.3641420959
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5342419646,
    						lat: 47.3586692041
    					},
    					{
    						lon: 8.5360506671,
    						lat: 47.3603611129
    					},
    					{
    						lon: 8.5334638507,
    						lat: 47.3588115116
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5332077503,
    						lat: 47.3502055473
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5275815359,
    						lat: 47.3320074634
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5191926805,
    						lat: 47.335261617
    					},
    					{
    						lon: 8.5234192376,
    						lat: 47.3478962155
    					},
    					{
    						lon: 8.5334066178,
    						lat: 47.3502216522
    					},
    					{
    						lon: 8.5306573476,
    						lat: 47.3575157956
    					},
    					{
    						lon: 8.5315667469,
    						lat: 47.3676537331
    					},
    					{
    						lon: 8.5232704576,
    						lat: 47.3640079545
    					},
    					{
    						lon: 8.5299492637,
    						lat: 47.3571986635
    					},
    					{
    						lon: 8.5299492637,
    						lat: 47.3571986635
    					},
    					{
    						lon: 8.5306319827,
    						lat: 47.3575700065
    					},
    					{
    						lon: 8.5326026935,
    						lat: 47.3407123419
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5187053177,
    						lat: 47.3366784266
    					},
    					{
    						lon: 8.5259765079,
    						lat: 47.3545285945
    					},
    					{
    						lon: 8.5235108914,
    						lat: 47.3484980318
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.529436008,
    						lat: 47.3554044781
    					},
    					{
    						lon: 8.533618534,
    						lat: 47.3502286378
    					},
    					{
    						lon: 8.5334738323,
    						lat: 47.3476933636
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5293261166,
    						lat: 47.35715058
    					},
    					{
    						lon: 8.5287409,
    						lat: 47.3686699047
    					},
    					{
    						lon: 8.5300064232,
    						lat: 47.3380023698
    					},
    					{
    						lon: 8.5406743639,
    						lat: 47.3387555619
    					},
    					{
    						lon: 8.5306833783,
    						lat: 47.3426285052
    					},
    					{
    						lon: 8.5349271201,
    						lat: 47.3469239755
    					},
    					{
    						lon: 8.5310136531,
    						lat: 47.3626306753
    					},
    					{
    						lon: 8.5247570437,
    						lat: 47.3661438226
    					}
    				]
    			},
    			{
    				name: "Kreis 3",
    				totalReports: 17,
    				color: "#dbb78a",
    				coordinates: [
    					{
    						lon: 8.4953823428,
    						lat: 47.368359267
    					},
    					{
    						lon: 8.5189941487,
    						lat: 47.3751120366
    					},
    					{
    						lon: 8.5114493893,
    						lat: 47.3726367405
    					},
    					{
    						lon: 8.5122281101,
    						lat: 47.3731692115
    					},
    					{
    						lon: 8.5179294021,
    						lat: 47.3754997842
    					},
    					{
    						lon: 8.5197480963,
    						lat: 47.3737647114
    					},
    					{
    						lon: 8.5172451746,
    						lat: 47.3685169729
    					},
    					{
    						lon: 8.51249364,
    						lat: 47.3718894385
    					},
    					{
    						lon: 8.519604968,
    						lat: 47.3686658189
    					},
    					{
    						lon: 8.511648334,
    						lat: 47.3726528828
    					},
    					{
    						lon: 8.5014516785,
    						lat: 47.3639769328
    					},
    					{
    						lon: 8.5088860458,
    						lat: 47.3860991676
    					},
    					{
    						lon: 8.5002993124,
    						lat: 47.3765806587
    					},
    					{
    						lon: 8.5091510704,
    						lat: 47.3861057074
    					},
    					{
    						lon: 8.5226930473,
    						lat: 47.3551441534
    					},
    					{
    						lon: 8.4947369503,
    						lat: 47.367861445
    					},
    					{
    						lon: 8.4956473197,
    						lat: 47.3677002008
    					}
    				]
    			},
    			{
    				name: "Kreis 4",
    				totalReports: 12,
    				coordinates: [
    					{
    						lon: 8.5145273361,
    						lat: 47.3827725669
    					},
    					{
    						lon: 8.531325836,
    						lat: 47.3733409402
    					},
    					{
    						lon: 8.5155335219,
    						lat: 47.3834108381
    					},
    					{
    						lon: 8.520053143,
    						lat: 47.3737888413
    					},
    					{
    						lon: 8.5224652555,
    						lat: 47.3719402248
    					},
    					{
    						lon: 8.5217063678,
    						lat: 47.3723881039
    					},
    					{
    						lon: 8.5271132038,
    						lat: 47.3758453771
    					},
    					{
    						lon: 8.5240266942,
    						lat: 47.37839305
    					},
    					{
    						lon: 8.5195487461,
    						lat: 47.3750348874
    					},
    					{
    						lon: 8.5269671468,
    						lat: 47.3777717077
    					},
    					{
    						lon: 8.5234819495,
    						lat: 47.3750519863
    					},
    					{
    						lon: 8.5241341864,
    						lat: 47.3771687054
    					}
    				]
    			},
    			{
    				name: "Kreis 5",
    				totalReports: 13,
    				coordinates: [
    					{
    						lon: 8.5377753517,
    						lat: 47.3823738241
    					},
    					{
    						lon: 8.5217866576,
    						lat: 47.386113873
    					},
    					{
    						lon: 8.5341977967,
    						lat: 47.3803569198
    					},
    					{
    						lon: 8.5152112665,
    						lat: 47.3858155263
    					},
    					{
    						lon: 8.5130126741,
    						lat: 47.3897578388
    					},
    					{
    						lon: 8.5130475074,
    						lat: 47.3895146484
    					},
    					{
    						lon: 8.5107201353,
    						lat: 47.390363811
    					},
    					{
    						lon: 8.51302084,
    						lat: 47.3895059013
    					},
    					{
    						lon: 8.5203582158,
    						lat: 47.3881691377
    					},
    					{
    						lon: 8.5211565087,
    						lat: 47.3850853445
    					},
    					{
    						lon: 8.5204654353,
    						lat: 47.3882310994
    					},
    					{
    						lon: 8.5109519668,
    						lat: 47.3906944766
    					},
    					{
    						lon: 8.5203847011,
    						lat: 47.3881688898
    					}
    				]
    			},
    			{
    				name: "Kreis 6",
    				totalReports: 21,
    				coordinates: [
    					{
    						lon: 8.5399673974,
    						lat: 47.3827037576
    					},
    					{
    						lon: 8.5479336928,
    						lat: 47.3862076005
    					},
    					{
    						lon: 8.5484859289,
    						lat: 47.3860133994
    					},
    					{
    						lon: 8.5400589711,
    						lat: 47.3826489139
    					},
    					{
    						lon: 8.5469407153,
    						lat: 47.3798575739
    					},
    					{
    						lon: 8.5540433909,
    						lat: 47.3863916459
    					},
    					{
    						lon: 8.547919041,
    						lat: 47.3848674678
    					},
    					{
    						lon: 8.5463147875,
    						lat: 47.3860612208
    					},
    					{
    						lon: 8.5479192282,
    						lat: 47.3848764611
    					},
    					{
    						lon: 8.547905612,
    						lat: 47.3848586016
    					},
    					{
    						lon: 8.5345315516,
    						lat: 47.3978761942
    					},
    					{
    						lon: 8.5399499456,
    						lat: 47.4049307862
    					},
    					{
    						lon: 8.5465416291,
    						lat: 47.3797714506
    					},
    					{
    						lon: 8.5479054248,
    						lat: 47.3848496083
    					},
    					{
    						lon: 8.5507441303,
    						lat: 47.3856948454
    					},
    					{
    						lon: 8.5296952437,
    						lat: 47.3894216133
    					},
    					{
    						lon: 8.5399535985,
    						lat: 47.3826769038
    					},
    					{
    						lon: 8.5463291512,
    						lat: 47.3861150538
    					},
    					{
    						lon: 8.5522887233,
    						lat: 47.3911579969
    					},
    					{
    						lon: 8.5463018042,
    						lat: 47.3797017893
    					},
    					{
    						lon: 8.550106902,
    						lat: 47.3862586753
    					}
    				]
    			},
    			{
    				name: "Kreis 7",
    				totalReports: 11,
    				coordinates: [
    					{
    						lon: 8.5563687282,
    						lat: 47.3766454173
    					},
    					{
    						lon: 8.5507667046,
    						lat: 47.3658333251
    					},
    					{
    						lon: 8.5661912145,
    						lat: 47.3639656762
    					},
    					{
    						lon: 8.5516513342,
    						lat: 47.3657168608
    					},
    					{
    						lon: 8.5709499457,
    						lat: 47.3586299214
    					},
    					{
    						lon: 8.5687599782,
    						lat: 47.3602345355
    					},
    					{
    						lon: 8.5672276093,
    						lat: 47.3847794081
    					},
    					{
    						lon: 8.5673094456,
    						lat: 47.3673819277
    					},
    					{
    						lon: 8.597000768,
    						lat: 47.3646502264
    					},
    					{
    						lon: 8.5554122072,
    						lat: 47.3796590511
    					},
    					{
    						lon: 8.5757652583,
    						lat: 47.3621986881
    					}
    				]
    			},
    			{
    				name: "Kreis 8",
    				totalReports: 30,
    				coordinates: [
    					{
    						lon: 8.5570112457,
    						lat: 47.3605648026
    					},
    					{
    						lon: 8.5498881387,
    						lat: 47.3554433363
    					},
    					{
    						lon: 8.5810438118,
    						lat: 47.3509025178
    					},
    					{
    						lon: 8.5511838143,
    						lat: 47.354099568
    					},
    					{
    						lon: 8.5488160789,
    						lat: 47.3567219728
    					},
    					{
    						lon: 8.5514143338,
    						lat: 47.3537285428
    					},
    					{
    						lon: 8.5729218683,
    						lat: 47.3573602297
    					},
    					{
    						lon: 8.5834008785,
    						lat: 47.3509511331
    					},
    					{
    						lon: 8.5629789611,
    						lat: 47.3503872182
    					},
    					{
    						lon: 8.5614681268,
    						lat: 47.3509236453
    					},
    					{
    						lon: 8.562282182,
    						lat: 47.3512395543
    					},
    					{
    						lon: 8.5628837528,
    						lat: 47.3515215459
    					},
    					{
    						lon: 8.5629756286,
    						lat: 47.3514846703
    					},
    					{
    						lon: 8.5606513072,
    						lat: 47.3536211614
    					},
    					{
    						lon: 8.5785534875,
    						lat: 47.3514308673
    					},
    					{
    						lon: 8.5594655399,
    						lat: 47.3538845445
    					},
    					{
    						lon: 8.5632034425,
    						lat: 47.3516173802
    					},
    					{
    						lon: 8.5572327506,
    						lat: 47.3585027541
    					},
    					{
    						lon: 8.5816799729,
    						lat: 47.3509411977
    					},
    					{
    						lon: 8.5614820949,
    						lat: 47.3503298235
    					},
    					{
    						lon: 8.5589796516,
    						lat: 47.3546988306
    					},
    					{
    						lon: 8.5488688309,
    						lat: 47.3567124704
    					},
    					{
    						lon: 8.5491422662,
    						lat: 47.3564939561
    					},
    					{
    						lon: 8.5506229983,
    						lat: 47.3545007597
    					},
    					{
    						lon: 8.5509070229,
    						lat: 47.354156206
    					},
    					{
    						lon: 8.5489098462,
    						lat: 47.3567750425
    					},
    					{
    						lon: 8.5511705801,
    						lat: 47.3540996955
    					},
    					{
    						lon: 8.5826108196,
    						lat: 47.3517595435
    					},
    					{
    						lon: 8.5527698166,
    						lat: 47.352717002
    					},
    					{
    						lon: 8.5617490315,
    						lat: 47.3504351701
    					}
    				]
    			},
    			{
    				name: "Kreis 9",
    				totalReports: 10,
    				coordinates: [
    					{
    						lon: 8.4742119503,
    						lat: 47.3942947647
    					},
    					{
    						lon: 8.4976588973,
    						lat: 47.3749857821
    					},
    					{
    						lon: 8.4887161136,
    						lat: 47.3929045758
    					},
    					{
    						lon: 8.5062385947,
    						lat: 47.3775783462
    					},
    					{
    						lon: 8.4888577766,
    						lat: 47.3839622354
    					},
    					{
    						lon: 8.5012267773,
    						lat: 47.3799272925
    					},
    					{
    						lon: 8.4730055194,
    						lat: 47.3949262234
    					},
    					{
    						lon: 8.4998689078,
    						lat: 47.3922090174
    					},
    					{
    						lon: 8.488729003,
    						lat: 47.3928864686
    					},
    					{
    						lon: 8.4864945367,
    						lat: 47.3769315803
    					}
    				]
    			},
    			{
    				name: "Kreis 10",
    				totalReports: 17,
    				coordinates: [
    					{
    						lon: 8.509669465,
    						lat: 47.3967420435
    					},
    					{
    						lon: 8.5210101274,
    						lat: 47.3928764478
    					},
    					{
    						lon: 8.5294573981,
    						lat: 47.3978612363
    					},
    					{
    						lon: 8.5307441473,
    						lat: 47.3882513378
    					},
    					{
    						lon: 8.533851805,
    						lat: 47.3886536865
    					},
    					{
    						lon: 8.5247295384,
    						lat: 47.3914383177
    					},
    					{
    						lon: 8.5210496762,
    						lat: 47.3928670823
    					},
    					{
    						lon: 8.5249303115,
    						lat: 47.4038855841
    					},
    					{
    						lon: 8.5210231885,
    						lat: 47.3928673304
    					},
    					{
    						lon: 8.4867026019,
    						lat: 47.4009823718
    					},
    					{
    						lon: 8.5081550394,
    						lat: 47.3965311936
    					},
    					{
    						lon: 8.5261331788,
    						lat: 47.3953109848
    					},
    					{
    						lon: 8.527777185,
    						lat: 47.3921382324
    					},
    					{
    						lon: 8.5191728091,
    						lat: 47.3924169051
    					},
    					{
    						lon: 8.5248304045,
    						lat: 47.3931374374
    					},
    					{
    						lon: 8.5242759926,
    						lat: 47.3932325982
    					},
    					{
    						lon: 8.5228486648,
    						lat: 47.3907903464
    					}
    				]
    			},
    			{
    				name: "Kreis 11",
    				totalReports: 65,
    				coordinates: [
    					{
    						lon: 8.5536035409,
    						lat: 47.4204422799
    					},
    					{
    						lon: 8.5487103914,
    						lat: 47.415227272
    					},
    					{
    						lon: 8.538293586,
    						lat: 47.4171168422
    					},
    					{
    						lon: 8.5331416094,
    						lat: 47.4172736744
    					},
    					{
    						lon: 8.5323373765,
    						lat: 47.4142499662
    					},
    					{
    						lon: 8.5323720898,
    						lat: 47.4133591308
    					},
    					{
    						lon: 8.5560993518,
    						lat: 47.4181154521
    					},
    					{
    						lon: 8.5536289124,
    						lat: 47.420388065
    					},
    					{
    						lon: 8.5487876381,
    						lat: 47.4151185897
    					},
    					{
    						lon: 8.5271997352,
    						lat: 47.4105565339
    					},
    					{
    						lon: 8.5534829673,
    						lat: 47.4203804775
    					},
    					{
    						lon: 8.5124851783,
    						lat: 47.414849855
    					},
    					{
    						lon: 8.5031741442,
    						lat: 47.4223927935
    					},
    					{
    						lon: 8.5468719883,
    						lat: 47.4134908783
    					},
    					{
    						lon: 8.5492782557,
    						lat: 47.4297487775
    					},
    					{
    						lon: 8.5537076629,
    						lat: 47.4203513254
    					},
    					{
    						lon: 8.5031736049,
    						lat: 47.4223658136
    					},
    					{
    						lon: 8.5446238849,
    						lat: 47.4086101089
    					},
    					{
    						lon: 8.5484472784,
    						lat: 47.4153197488
    					},
    					{
    						lon: 8.5452919066,
    						lat: 47.4165283483
    					},
    					{
    						lon: 8.5394341583,
    						lat: 47.4152350221
    					},
    					{
    						lon: 8.5536147203,
    						lat: 47.4203432267
    					},
    					{
    						lon: 8.512498065,
    						lat: 47.4148317453
    					},
    					{
    						lon: 8.5334981236,
    						lat: 47.4197889007
    					},
    					{
    						lon: 8.5325397726,
    						lat: 47.4163618797
    					},
    					{
    						lon: 8.5330083713,
    						lat: 47.4172389558
    					},
    					{
    						lon: 8.5190020226,
    						lat: 47.4146991847
    					},
    					{
    						lon: 8.5389916862,
    						lat: 47.4092125616
    					},
    					{
    						lon: 8.5033267403,
    						lat: 47.4227331965
    					},
    					{
    						lon: 8.5532190842,
    						lat: 47.4204369921
    					},
    					{
    						lon: 8.5520808889,
    						lat: 47.4148080695
    					},
    					{
    						lon: 8.5535217777,
    						lat: 47.420335128
    					},
    					{
    						lon: 8.5485127757,
    						lat: 47.4152831398
    					},
    					{
    						lon: 8.5213531788,
    						lat: 47.4149740226
    					},
    					{
    						lon: 8.5330908276,
    						lat: 47.4173820953
    					},
    					{
    						lon: 8.5126537258,
    						lat: 47.4297799295
    					},
    					{
    						lon: 8.5507936469,
    						lat: 47.4147215157
    					},
    					{
    						lon: 8.5323085245,
    						lat: 47.4147809452
    					},
    					{
    						lon: 8.5033226049,
    						lat: 47.4225263507
    					},
    					{
    						lon: 8.5531371336,
    						lat: 47.4203208467
    					},
    					{
    						lon: 8.5213385238,
    						lat: 47.4103417322
    					},
    					{
    						lon: 8.5210843535,
    						lat: 47.4147876452
    					},
    					{
    						lon: 8.5559441495,
    						lat: 47.4151395909
    					},
    					{
    						lon: 8.5533758328,
    						lat: 47.4203275403
    					},
    					{
    						lon: 8.540390985,
    						lat: 47.414083538
    					},
    					{
    						lon: 8.5063505495,
    						lat: 47.4162199441
    					},
    					{
    						lon: 8.5066363878,
    						lat: 47.419239613
    					},
    					{
    						lon: 8.4968930684,
    						lat: 47.4264531997
    					},
    					{
    						lon: 8.4936004467,
    						lat: 47.4261774601
    					},
    					{
    						lon: 8.4921388813,
    						lat: 47.4266675166
    					},
    					{
    						lon: 8.5062436551,
    						lat: 47.4280762814
    					},
    					{
    						lon: 8.508758337,
    						lat: 47.4245899819
    					},
    					{
    						lon: 8.5317646696,
    						lat: 47.4134638217
    					},
    					{
    						lon: 8.5537337875,
    						lat: 47.4203330833
    					},
    					{
    						lon: 8.506193625,
    						lat: 47.418308226
    					},
    					{
    						lon: 8.5060635542,
    						lat: 47.4190919889
    					},
    					{
    						lon: 8.5063993222,
    						lat: 47.4193137624
    					},
    					{
    						lon: 8.5067079667,
    						lat: 47.4201654328
    					},
    					{
    						lon: 8.5499174955,
    						lat: 47.4209994818
    					},
    					{
    						lon: 8.5537593471,
    						lat: 47.4202878616
    					},
    					{
    						lon: 8.5503597525,
    						lat: 47.41298065
    					},
    					{
    						lon: 8.5487495771,
    						lat: 47.4151999106
    					},
    					{
    						lon: 8.5529531305,
    						lat: 47.4203945806
    					},
    					{
    						lon: 8.5535214012,
    						lat: 47.4203171416
    					},
    					{
    						lon: 8.5454541001,
    						lat: 47.4173183583
    					}
    				]
    			},
    			{
    				name: "Kreis 12",
    				totalReports: 5,
    				coordinates: [
    					{
    						lon: 8.5924613478,
    						lat: 47.4026554227
    					},
    					{
    						lon: 8.5608475938,
    						lat: 47.4101178197
    					},
    					{
    						lon: 8.5915376999,
    						lat: 47.3985448605
    					},
    					{
    						lon: 8.5755336891,
    						lat: 47.4096954524
    					},
    					{
    						lon: 8.5573816079,
    						lat: 47.4034500842
    					}
    				]
    			}
    		],
    		legend: {
    			maxValue: 82,
    			minValue: 5,
    			buckets: [
    				{
    					from: 5,
    					to: 5,
    					color: {
    						colorClass: "#e3e4e9"
    					}
    				},
    				{
    					from: 5,
    					to: 13,
    					color: {
    						colorClass: "#c1c8ee"
    					}
    				},
    				{
    					from: 13,
    					to: 21,
    					color: {
    						colorClass: "#a1abf1"
    					}
    				},
    				{
    					from: 21,
    					to: 30,
    					color: {
    						colorClass: "#818ef2"
    					}
    				},
    				{
    					from: 30,
    					to: 65,
    					color: {
    						colorClass: "#6070f1"
    					}
    				},
    				{
    					from: 65,
    					to: 82,
    					color: {
    						colorClass: "#3952ee"
    					}
    				}
    			]
    		}
    	}
    ];

    var texts = [
    	{
    		year: 2018,
    		text: "Von 2018 bis 2020 sind beim 2013 eingeführen Service der Stadt Zürich <a href='https://www.zueriwieneu.ch/'>züri-wie-neu</a> insgesamt <span style='font-weight: bold;'>681 Meldungen</span> mit dem Tag 'Graffiti' eingegangen.</br></br>2018 wurden insgesamt 199 Fälle gemeldet.</br></br> Die meisten Meldungen kamen im Jahr 2018 vom <div style='width: 11px;height: 11px; display: inline-flex; background: #3952ee;margin-right: 4px;'></div>Kreis 6. <div style='width: 11px;height: 11px; display: inline-flex; background: #3952ee;margin-right: 4px;'></div>Kreis 6 ist mit 29'415 einer der einwohnerreichsten Kreisen in der Stadt Zürich.<br/></br><div style='width: 11px;height: 11px; display: inline-flex; background: #6070f1;margin-right: 4px;'></div>Kreis 1 und <div style='width: 11px;height: 11px; display: inline-flex; background: #6070f1;margin-right: 4px;'></div>Kreis 2 halten dabei stark mit, hingegen in <div style='width: 11px;height: 11px; display: inline-flex; background: rgb(129, 142, 242);margin-right: 4px;'></div>Kreis 4 und <div style='width: 11px;height: 11px; display: inline-flex; background: rgb(161, 171, 241);margin-right: 4px;'></div>Kreis 5 die Melderate, trotz erhöhtem Graffiti-Aufkommen, eher klein ist."
    	},
    	{
    		year: 2019,
    		text: "2019 wurden insgesamt 318 Fälle gemeldet. Dies entspricht einem Anstieg von 59.8% auf das Jahr 2018.</br></br> Die meisten Meldungen kamen im Jahr 2019 vom <div style='width: 11px;height: 11px; display: inline-flex; background: #3952ee;margin-right: 4px;'></div>Kreis 1. Da der grösste Teil vom <div style='width: 11px;height: 11px; display: inline-flex; background: #3952ee;margin-right: 4px;'></div>Kreis 1 die Altstadt, der Bahnhof und der Paradeplatz ist, ist die Tolleranz natürlich klein und somit einerseits motivierend für die Sprayer, andererseits Ärgerlich für die Stadt."
    	},
    	{
    		year: 2020,
    		text: "2020 wurden insgesamt 344 Fälle gemeldet. Dies entspricht einem Angstieg von 8.18% auf das Jahr 2018 und einem Anstieg von 72.9% auf das Jahr 2019.</br></br> Ein ähnliches Bild, wie 2019, zeigt sich im Jahr 2020. <div style='width: 11px;height: 11px; display: inline-flex; background: #3952ee;margin-right: 4px;'></div>Kreis 1 hebt sich von den anderen Kreisen enorm ab. Ausserdem werden vermehrt auch aus dem Seebecken-Bereich (<div style='width: 11px;height: 11px; display: inline-flex; background: rgb(96, 112, 241);margin-right: 4px;'></div>Kreis 2 und <div style='width: 11px;height: 11px; display: inline-flex; background: rgb(96, 112, 241);margin-right: 4px;'></div>Kreis 8) Meldungen getätigt."
    	}
    ];

    function resolveImages(filename) {
    	const images = [
    		"karte.svg",
    	];
    	if (images.includes(filename)) {
    		return `images/${filename}`;
    	}
    	return null;
    }

    const app = new App({
    	target: document.body,
    	props: {
    		data,
    		texts,
    		resolveImages,
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
