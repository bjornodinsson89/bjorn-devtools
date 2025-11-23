// plugins/commands.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.definePlugin) return;

    DevTools.definePlugin("commands", {
        tab: null,

        onLoad(api) {
            const log = api.log;
            
            api.commands.register("tab", (a) => api.ui.switchTab((a||"").toUpperCase()), "Switch Tab (CONSOLE, NETWORK...)");
            
            api.commands.register("theme", (a) => {
                const p = DevTools.plugins.registry.themes?.plugin;
                if(p) a ? p.setTheme(a) : p.next();
                else log("Themes plugin missing");
            }, "Set theme or cycle next");

            api.commands.register("fetch", async (url) => {
                if(!url) return log("Usage: fetch <url>");
                try {
                    const r = await fetch(url);
                    const t = await r.text();
                    log(`[HTTP] ${r.status} (${t.length}b)`);
                    log(t.substring(0, 500));
                } catch(e) { log("Error: " + e.message); }
            }, "Simple fetch");

            api.commands.register("net.clear", () => {
                const p = DevTools.plugins.registry.networkInspector?.plugin;
                if(p && p.clear) { p.clear(); log("Network log cleared."); }
                else log("Network inspector not active.");
            }, "Clear Network Inspector logs");

            api.commands.register("highlight", (s) => {
                const el = document.querySelector(s);
                el ? api.dom.highlight(el) : log("Not found: "+s);
            }, "Highlight element");
            
            api.commands.register("highlight.clear", () => api.dom.clearHighlight(), "Clear highlights");
            
            api.commands.register("dom.remove", (s) => {
                const el = document.querySelector(s);
                if(el) { el.remove(); log(`Removed <${el.tagName}>`); } 
                else log("Not found.");
            }, "Delete an element");

            api.commands.register("dom.text", (args) => {
                const parts = args.split(" ");
                const sel = parts.shift();
                const txt = parts.join(" ");
                const el = document.querySelector(sel);
                if(el) { el.innerText = txt; log("Updated text."); }
                else log("Not found.");
            }, "Change element text");

            api.commands.register("cookie", () => log(document.cookie || "No cookies."), "Show cookies");
            api.commands.register("cookie.clear", () => {
                const C = document.cookie.split("; ");
                for (const c of C) document.cookie = c.split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
                log("Cookies cleared.");
            }, "Nuke all cookies");

            api.commands.register("storage.clear", () => {
                localStorage.clear(); sessionStorage.clear(); log("Local & Session storage cleared.");
            }, "Clear Local/Session Storage");

            api.commands.register("ua", () => log(navigator.userAgent), "User Agent");
            api.commands.register("viewport", () => { log(`Viewport: ${window.innerWidth} x ${window.innerHeight}`); }, "Screen dimensions");
            api.commands.register("page.reload", () => location.reload(), "Refresh page");
        }
    });
})();
