// Bjorn Dev Tools — Commands Pack Plugin
(function() {
    if (!window.BjornDevTools) {
        console.error("[BjornDevTools][CommandsPack] Core not loaded.");
        return;
    }

    const DevTools = window.BjornDevTools;
    const api = DevTools.api;

    // Register plugin
    DevTools.plugins.register({
        id: "commands",
        title: "Command Pack",

        init(api) {
            const cmd = DevTools.commands.register;

            /*******************************
             * BASIC UTILITIES
             *******************************/
            cmd("clear", () => {
                const root = api.ui.getPanelRoot("CONSOLE");
                if (root) root.innerHTML = "";
            }, "Clear console output");

            cmd("echo", (args) => {
                api.log.info(args);
            }, "Echo text");

            cmd("log", (args) => {
                api.log.info(args);
            }, "Alias of echo");

            /*******************************
             * DOM COMMANDS
             *******************************/
            cmd("find", (selector) => {
                const el = document.querySelector(selector);
                if (!el) return api.log.warn("Not found: " + selector);
                api.log.info("Found: " + selector);
                api.log.info(el.outerHTML);
            }, "Find element via selector");

            cmd("highlight", (selector) => {
                const el = document.querySelector(selector);
                if (!el) return api.log.warn("Not found: " + selector);
                api.dom.highlight(el);
                api.log.info("Highlighted: " + selector);
            }, "Highlight element");

            cmd("copyhtml", (selector) => {
                const el = document.querySelector(selector);
                if (!el) return api.log.warn("Not found: " + selector);
                navigator.clipboard.writeText(el.outerHTML);
                api.log.info("Copied outerHTML of " + selector);
            }, "Copy outerHTML to clipboard");

            /*******************************
             * STORAGE SHORTCUTS
             *******************************/
            cmd("ls.get", (key) => {
                const v = localStorage.getItem(key);
                api.log.info(key + " = " + v);
            }, "localStorage get");

            cmd("ls.set", (args) => {
                const [key, ...rest] = args.split(" ");
                localStorage.setItem(key, rest.join(" "));
                api.log.info("localStorage set: " + key);
            }, "localStorage set");

            cmd("ls.del", (key) => {
                localStorage.removeItem(key);
                api.log.info("localStorage removed: " + key);
            }, "localStorage delete");

            cmd("ss.get", (key) => {
                const v = sessionStorage.getItem(key);
                api.log.info(key + " = " + v);
            }, "sessionStorage get");

            cmd("ss.set", (args) => {
                const [key, ...rest] = args.split(" ");
                sessionStorage.setItem(key, rest.join(" "));
                api.log.info("sessionStorage set: " + key);
            }, "sessionStorage set");

            cmd("ss.del", (key) => {
                sessionStorage.removeItem(key);
                api.log.info("sessionStorage removed: " + key);
            }, "sessionStorage delete");

            /*******************************
             * NETWORK SHORTCUTS
             *******************************/
            cmd("fetchtext", async (url) => {
                try {
                    const res = await fetch(url);
                    const text = await res.text();
                    api.log.info(text.substring(0, 2000));
                } catch (e) {
                    api.log.error("Fetch error: " + e);
                }
            }, "Fetch text and print");

            cmd("headers", async (url) => {
                try {
                    const res = await fetch(url);
                    const h = [...res.headers.entries()];
                    api.log.info(JSON.stringify(h, null, 2));
                } catch (e) {
                    api.log.error("Headers error: " + e);
                }
            }, "Fetch headers");

            cmd("ping", async (url) => {
                const start = performance.now();
                try {
                    await fetch(url, { method: "HEAD" });
                    const ms = Math.round(performance.now() - start);
                    api.log.info("Ping: " + ms + "ms");
                } catch (e) {
                    api.log.error("Ping error: " + e);
                }
            }, "Ping a URL");

            /*******************************
             * EVAL + DEBUG
             *******************************/
            cmd("eval", (code) => {
                if (api.state.safeMode()) {
                    api.log.warn("Eval blocked in SAFE MODE");
                    return;
                }
                try {
                    const out = Function("return (" + code + ")")();
                    api.log.info(JSON.stringify(out, null, 2));
                } catch (e) {
                    api.log.error("Eval error: " + e);
                }
            }, "Unsafe JS eval");

            cmd("time", (expr) => {
                if (!expr) return api.log.warn("Usage: time <expression>");
                const fn = new Function("return (" + expr + ")");
                const t0 = performance.now();
                try {
                    fn();
                    api.log.info("Took " + (performance.now() - t0).toFixed(2) + "ms");
                } catch (e) {
                    api.log.error("Time error: " + e);
                }
            }, "Benchmark expression");

            /*******************************
             * PLUGIN UTILITIES
             *******************************/
            cmd("plugin.list", () => {
                const statuses = DevTools.plugins.statuses();
                Object.keys(statuses).forEach(id => {
                    const s = statuses[id];
                    api.log.info(`${id}: ${s.status}`);
                });
            }, "List plugins");

            cmd("plugin.status", () => {
                const statuses = DevTools.plugins.statuses();
                api.log.info(JSON.stringify(statuses, null, 2));
            }, "Detailed plugin status");

            cmd("plugin.reload", (id) => {
                if (!id) return api.log.warn("Usage: plugin.reload <id>");
                api.log.info("Reloading plugin: " + id);
                // core command will reload all; specific reload comes later
                DevTools.commands._execute("reloadPlugins");
            }, "Reload a plugin");

            /*******************************
             * SAFE/UNSAFE TOOL CONTROLS
             *******************************/
            cmd("unsafe.list", () => {
                api.unsafe.list();
            }, "List unsafe tools");

            cmd("unsafe.enable", (id) => {
                api.unsafe.enable(id);
            }, "Enable unsafe tool");

            cmd("unsafe.disable", (id) => {
                api.unsafe.disable(id);
            }, "Disable unsafe tool");

            /*******************************
             * ENV INFO
             *******************************/
            cmd("env", () => {
                api.log.info("UserAgent: " + navigator.userAgent);
                api.log.info("Platform: " + navigator.platform);
                api.log.info("Lang: " + navigator.language);
                api.log.info("Screen: " + screen.width + "x" + screen.height);
            }, "Show environment info");

            cmd("ua", () => {
                api.log.info(navigator.userAgent);
            }, "UserAgent");

            cmd("platform", () => {
                api.log.info(navigator.platform);
            }, "Platform");

            api.log.info("[CommandsPack] initialized.");
        }
    });
})();
