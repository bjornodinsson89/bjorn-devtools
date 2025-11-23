// Enhanced Unified Unsafe Feature Registry for Bjorn DevTools
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.api || !DevTools.api.unsafe || !DevTools.unsafe) return;

    const unsafeTools = DevTools.unsafe;
    const apiUnsafe = DevTools.api.unsafe;

    const PLUGIN_BASE = typeof window.PLUGIN_BASE !== "undefined"
        ? window.PLUGIN_BASE
        : "https://raw.githubusercontent.com/bjornodinsson89/bjorn-devtools/main/plugins/";

    const SafeStorage = {
        get: k => { try { return localStorage.getItem(k); } catch { return null; } },
        set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
    };

    unsafeTools.features = unsafeTools.features || Object.create(null);

    function registerFeatures(pluginId, list) {
        if (!pluginId || !Array.isArray(list)) return;
        const b = unsafeTools.features[pluginId] || (unsafeTools.features[pluginId] = []);
        list.forEach(f => { if (typeof f === "string" && !b.includes(f)) b.push(f); });
    }

    unsafeTools.registerFeatures = registerFeatures;

    unsafeTools.isUnsafeFeature = (pluginId, feature) => {
        const b = unsafeTools.features[pluginId];
        return !!(b && b.includes(feature));
    };

    unsafeTools.isUnsafe = unsafeTools.isUnsafeFeature;

    const origUnsafeRegister = unsafeTools.register?.bind(unsafeTools);
    if (origUnsafeRegister) {
        unsafeTools.register = function (id, labelOrFeatures) {
            if (Array.isArray(labelOrFeatures)) {
                registerFeatures(id, labelOrFeatures);
                return origUnsafeRegister(id, id);
            }
            return origUnsafeRegister(id, labelOrFeatures);
        };
    }

    const origApiUnsafeRegister = apiUnsafe.register?.bind(apiUnsafe);
    if (origApiUnsafeRegister) {
        apiUnsafe.register = function (id, labelOrFeatures) {
            if (Array.isArray(labelOrFeatures)) {
                registerFeatures(id, labelOrFeatures);
                return origApiUnsafeRegister(id, id);
            }
            return origApiUnsafeRegister(id, labelOrFeatures);
        };
    }

    const prevEnsureUnsafe = DevTools.api.ensureUnsafe?.bind(DevTools.api) || (() => true);

    DevTools.api.ensureUnsafe = function (toolId) {
        if (typeof toolId === "string" && toolId.includes(".")) {
            const [p, f] = toolId.split(".");
            if (!unsafeTools.isUnsafeFeature(p, f) && this.log) {
                this.log(`SAFE: '${toolId}' not declared; using legacy gating.`);
            }
        }
        return prevEnsureUnsafe(toolId);
    };

    const CACHE_KEY = "__bdt_unsafe_manifest_cache";

    function applyManifest(map) {
        for (const pluginId in map) {
            const list = map[pluginId];
            if (Array.isArray(list)) unsafeTools.register(pluginId, list);
        }
    }

    (function loadCached() {
        const cached = SafeStorage.get(CACHE_KEY);
        if (!cached) return;
        try {
            const obj = JSON.parse(cached);
            if (obj && typeof obj === "object") applyManifest(obj);
        } catch {}
    })();

    (function fetchManifest() {
        const url = PLUGIN_BASE.replace(/\/+$/, "") + "/../manifest.json";
        fetch(url)
            .then(r => r.json())
            .then(json => {
                if (json && json.unsafe) {
                    SafeStorage.set(CACHE_KEY, JSON.stringify(json.unsafe));
                    applyManifest(json.unsafe);
                }
            })
            .catch(() => {});
    })();

    function validatePluginUnsafeUsage(pluginId) {
        const rec = DevTools.plugins.registry[pluginId];
        if (!rec || !rec.plugin) return;
        const t = rec.plugin.toString?.() || "";
        const m = t.match(/ensureUnsafe\(["'`](.+?)["'`]\)/g) || [];
        m.forEach(x => {
            const id = x.split(/ensureUnsafe\(["'`]/)[1].split(/["'`]\)/)[0];
            const [p, f] = id.split(".");
            if (f && !unsafeTools.isUnsafeFeature(p, f)) {
                DevTools.api.log?.(`[unsafe] WARNING: Plugin '${pluginId}' calls ensureUnsafe("${id}") but it is undeclared.`);
            }
        });
    }

    const origLoadDefaults = DevTools.plugins.loadDefaults;
    DevTools.plugins.loadDefaults = function () {
        return origLoadDefaults.call(DevTools.plugins).then(() => {
            const regs = DevTools.plugins.registry;
            for (const id in regs) validatePluginUnsafeUsage(id);
        });
    };

})();
