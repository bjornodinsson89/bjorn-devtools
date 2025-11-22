// plugins/commands.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.definePlugin) return;

    DevTools.definePlugin("commands", {
        // no tab, this plugin just extends the console
        tab: null,

        onLoad(api) {
            const log = api.log;
            const isSafeMode = api.state.safeMode;
            const unsafe = api.unsafe;

            /****************************
             * SAFE COMMANDS
             ****************************/

            // Switch active tab
            api.commands.register("tab", (args) => {
                const t = (args || "").trim().toUpperCase();
                if (!t) {
                    log("Usage: tab <CONSOLE|NETWORK|ELEMENTS|STORAGE|PERF|ADVANCED>");
                    return;
                }
                api.ui.switchTab(t);
            }, "Switch active DevTools tab.");

            // Show plugin statuses
            api.commands.register("plugins", () => {
                const statuses = DevTools.plugins.statuses();
                log("Plugins:");
                Object.entries(statuses).forEach(([id, s]) => {
                    log(`  ${id}  [${s.status}]  tab=${s.tab || "-"}${s.error ? "  err=" + s.error : ""}`);
                });
            }, "List plugin load status.");

            // Basic fetch helper (safe)
            api.commands.register("fetch", async (args) => {
                const url = (args || "").trim();
                if (!url) {
                    log("Usage: fetch <url>");
                    return;
                }
                try {
                    const res = await fetch(url, { method: "GET" });
                    const text = await res.text();
                    log(`[fetch] ${res.status} ${res.statusText} (${url})`);
                    const preview = text.length > 300 ? text.slice(0, 300) + "…" : text;
                    log(preview);
                } catch (e) {
                    log("[fetch] Error: " + e.message);
                }
            }, "HTTP GET and text body preview.");

            // Inspect a DOM element
            api.commands.register("inspect", (args) => {
                const sel = (args || "").trim();
                if (!sel) {
                    log("Usage: inspect <css selector>");
                    return;
                }
                const el = document.querySelector(sel);
                if (!el) {
                    log(`[inspect] No match for selector: ${sel}`);
                    return;
                }
                const rect = el.getBoundingClientRect();
                log(`[inspect] ${el.tagName.toLowerCase()}#${el.id || "-"}${el.className ? "." + String(el.className).trim().replace(/\s+/g, ".") : ""}`);
                log(`  size: ${Math.round(rect.width)}x${Math.round(rect.height)}  at (${Math.round(rect.left)},${Math.round(rect.top)})`);
                log("  outerHTML:");
                const outer = el.outerHTML;
                log("    " + outer.slice(0, 280) + (outer.length > 280 ? "…" : ""));
            }, "Inspect first element that matches selector.");

            // Highlight an element on screen
            api.commands.register("highlight", (args) => {
                const sel = (args || "").trim();
                if (!sel) {
                    log("Usage: highlight <css selector>");
                    return;
                }
                const el = document.querySelector(sel);
                if (!el) {
                    log(`[highlight] No match for selector: ${sel}`);
                    return;
                }
                api.dom.highlight(el);
                log("[highlight] Element highlighted. Use 'highlight.clear' to remove.");
            }, "Highlight an element.");

            // Clear highlight
            api.commands.register("highlight.clear", () => {
                api.dom.clearHighlight();
                log("[highlight] Cleared.");
            }, "Clear highlight overlay.");

            // Reload page
            api.commands.register("page.reload", () => {
                log("[page.reload] Reloading…");
                location.reload();
            }, "Reload the current page.");

            /****************************
             * THEME COMMAND (delegates to themes plugin if present)
             ****************************/
            api.commands.register("theme", (args) => {
                const name = (args || "").trim();
                if (!name) {
                    log("Usage: theme <name>");
                    log("Example: theme odin | theme dev | theme matrix (if themes plugin supports them)");
                    return;
                }
                // If themes plugin exposes an api hook, use it
                const themes = DevTools.plugins.registry["themes"]?.plugin;
                if (themes && typeof themes.setTheme === "function") {
                    try {
                        themes.setTheme(name);
                        log(`[theme] Switched to theme: ${name}`);
                    } catch (e) {
                        log("[theme] Error: " + e.message);
                    }
                } else {
                    log("[theme] Themes plugin not available or does not expose setTheme(name).");
                }
            }, "Switch visual theme (delegated to themes plugin).");

            /****************************
             * UNSAFE COMMANDS (eval, etc)
             ****************************/

            // JS eval – gated by safe mode + unsafe.eval
            api.commands.register("eval", (args) => {
                const code = (args || "").trim();
                if (!code) {
                    log("Usage: eval <javascript>");
                    return;
                }

                if (isSafeMode()) {
                    log("[eval] SAFE mode is ON. Run 'safe off' then 'unsafe allow on' and 'unsafe on eval' to enable.");
                    return;
                }
                if (!unsafe.isToolEnabled("eval")) {
                    log("[eval] Unsafe 'eval' tool is OFF. Use 'unsafe list' then 'unsafe on eval'.");
                    return;
                }

                try {
                    // eslint-disable-next-line no-eval
                    const result = eval(code);
                    log("[eval] Result: " + String(result));
                } catch (e) {
                    log("[eval] Error: " + e.message);
                }
            }, "Execute JavaScript (unsafe, gated).");

            // Could add more unsafe commands later (profilers, mutation hooks, etc.)

            log("[commands] Commands plugin loaded. Type 'help' + 'plugins' + 'unsafe' for more.");
        },

        onMount(view, api) {
            // Commands plugin does not render into a specific tab; no-op here.
        }
    });
})();
