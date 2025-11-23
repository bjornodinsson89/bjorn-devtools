// plugins/commands.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    // unsafe: fetch & eval
    DevTools.unsafe.register("commands", ["fetch","eval"]);

    DevTools.registerPlugin("commands", {
        name: "Commands",
        tab: null,

        onLoad(api) {
            const log = api.log;
            const reg = api.commands.register;

            const isInsideDevtools = (el) => {
                const root = el?.getRootNode?.();
                return root && root.host && root.host.id === "bjorn-devtools-host";
            };

            reg("help", () => {
                log("Available Commands:");
                Object.entries(DevTools.commands).forEach(([k, v]) => {
                    log(`  ${k} — ${v.desc || ""}`);
                });
            }, "List commands.");

            reg("?", () => DevTools.commands.help.handler(), "Help alias");

            reg("url", () => log(location.href), "Show page URL");
            reg("title", () => log(document.title), "Show page title");
            reg("scroll.y", () => log(String(window.scrollY)), "Current scroll Y");
            reg("scroll.x", () => log(String(window.scrollX)), "Current scroll X");

            reg("scroll.to", (arg) => {
                const y = Number(arg || 0);
                if (Number.isNaN(y)) return log("Invalid number");
                window.scrollTo({ top: y, behavior: "smooth" });
                log("Scrolling to: " + y);
            }, "Scroll to Y position");

            reg("page.reload", () => location.reload(), "Reload page");

            reg("copy", async (txt) => {
                if (!txt) return log("Usage: copy <text>");
                try { await navigator.clipboard.writeText(txt); log("Copied."); }
                catch { log("ERR: Clipboard blocked."); }
            }, "Copy text");

            reg("inspect", (selector) => {
                if (!selector) return log("Usage: inspect <selector>");
                let el = null;
                try { el = document.querySelector(selector); }
                catch { return log("Invalid selector."); }
                if (!el) return log("Not found.");
                if (isInsideDevtools(el)) return log("Cannot inspect DevTools UI.");

                const html = el.outerHTML;
                const max = 2000;
                log(html.length > max ? html.slice(0, max) + "… (truncated)" : html);
            }, "Show element outerHTML");

            reg("highlight", (selector) => {
                if (!selector) return log("Usage: highlight <selector>");
                let el = null;
                try { el = document.querySelector(selector); }
                catch { return log("Invalid selector."); }
                if (!el) return log("Not found.");
                if (isInsideDevtools(el)) return log("Cannot highlight DevTools UI.");
                const r = el.getBoundingClientRect();
                const box = document.createElement("div");
                box.style.cssText = `
                    position:fixed;left:${r.left}px;top:${r.top}px;
                    width:${r.width}px;height:${r.height}px;
                    border:2px solid #6fb6ff;border-radius:4px;
                    background:rgba(111,182,255,0.15);
                    z-index:2147483646;pointer-events:none;`;
                document.body.appendChild(box);
                setTimeout(() => box.remove(), 1500);
                log("Highlighted.");
            }, "Highlight an element");

            reg("commands.fetch", async (url) => {
                if (!url) return log("Usage: commands.fetch <url>");
                if (!api.ensureUnsafe("commands.fetch")) return;
                try {
                    const res = await window.fetch(url);
                    const txt = await res.text();
                    log(txt.length > 2000 ? txt.slice(0, 2000) + "… (truncated)" : txt);
                } catch (e) { log("ERR: " + e.message); }
            }, "Fetch URL (UNSAFE)");

            reg("commands.eval", (code) => {
                if (!api.ensureUnsafe("commands.eval")) return;
                try { log(String(eval(code))); }
                catch (e) { log("ERR: " + e.message); }
            }, "Eval JS (UNSAFE)");

            reg("echo", (txt) => log(txt), "Print text");
            reg("time", () => log(new Date().toLocaleString()), "Current time");

            log("[commands] ready");
        },

        onMount() {}
    });
})();
