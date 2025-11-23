// plugins/commands.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("commands", {
        name: "Commands",
        tab: null,

        onLoad(api) {
            const log = api.log;
            const reg = api.commands.register;

            /*===========================================================
            =  HELP
            ===========================================================*/
            reg("help", () => {
                log("Available Commands:");
                Object.entries(DevTools.commands).forEach(([k,v])=>{
                    log(`  ${k}  — ${v.desc||""}`);
                });
            }, "List commands.");

            /*===========================================================
            =  SHORTCUTS / ALIASES
            ===========================================================*/
            reg("?", () => DevTools.commands.help.handler(), "Help alias");

            /*===========================================================
            =  PAGE INFORMATION
            ===========================================================*/
            reg("url", () => log(location.href), "Show page URL");
            reg("title", () => log(document.title), "Show page title");
            reg("scroll.y", () => log(String(window.scrollY)), "Current scroll Y");
            reg("scroll.x", () => log(String(window.scrollX)), "Current scroll X");

            /*===========================================================
            =  PAGE CONTROLS
            ===========================================================*/
            reg("scroll.to", (arg) => {
                const y = Number(arg || 0);
                window.scrollTo({ top:y, behavior:"smooth" });
                log("Scrolling to: " + y);
            }, "Scroll to Y position");

            reg("page.reload", () => location.reload(), "Reload page");

            /*===========================================================
            =  CLIPBOARD
            ===========================================================*/
            reg("copy", async (txt) => {
                if (!txt) return log("Usage: copy <text>");
                await navigator.clipboard.writeText(txt);
                log("Copied to clipboard.");
            }, "Copy text");

            /*===========================================================
            =  DOM HELPERS
            ===========================================================*/
            reg("inspect", (selector) => {
                if (!selector) return log("Usage: inspect <selector>");
                const el = document.querySelector(selector);
                if (!el) return log("Not found.");
                log(el.outerHTML);
            }, "Show element outerHTML");

            reg("highlight", (selector) => {
                if (!selector) return log("Usage: highlight <selector>");
                const el = document.querySelector(selector);
                if (!el) return log("Not found.");
                const r = el.getBoundingClientRect();
                const box = document.createElement("div");
                box.style.cssText = `
                    position:fixed;left:${r.left}px;top:${r.top}px;
                    width:${r.width}px;height:${r.height}px;
                    border:2px solid #6fb6ff;border-radius:4px;
                    background:rgba(111,182,255,0.15);
                    z-index:2147483646;pointer-events:none;
                `;
                document.body.appendChild(box);
                setTimeout(()=>box.remove(),1500);
                log("Highlighted.");
            }, "Highlight an element");

            /*===========================================================
            =  NETWORK HELPERS
            ===========================================================*/
            reg("fetch", async (url) => {
                if (!url) return log("Usage: fetch <url>");
                if (!api.ensureUnsafe("fetch")) return;
                try {
                    const res = await window.fetch(url);
                    const txt = await res.text();
                    log(txt.slice(0, 2000));
                } catch (e) {
                    log("ERR: " + e.message);
                }
            }, "Fetch URL (UNSAFE)");

            /*===========================================================
            =  JS EXECUTION (UNSAFE)
            ===========================================================*/
            reg("eval", (code) => {
                if (!api.ensureUnsafe("eval")) return;
                try {
                    const r = eval(code);
                    log(String(r));
                } catch (e) {
                    log("ERR: " + e.message);
                }
            }, "Eval JS (UNSAFE)");

            /*===========================================================
            =  UTILITIES
            ===========================================================*/
            reg("echo", (txt) => log(txt), "Print text");
            reg("time", () => log(new Date().toLocaleString()), "Current time");

            log("[commands] ready");
        },

        onMount() {}
    });
})();
