// plugins/commands.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("commands", {
        name: "Commands",
        tab: null,

        onLoad(api) {
            const log = api.log;

            api.commands.register("help", () => {
                log("Available commands:");
                Object.keys(DevTools.commands).forEach(k => {
                    const d = DevTools.commands[k].desc || "";
                    log(`  ${k}  — ${d}`);
                });
            }, "List all commands.");

            api.commands.register("echo", (txt) => log(txt), "Print text");

            api.commands.register("time", () => {
                log(new Date().toLocaleString());
            }, "Print current time");

            api.commands.register("goto", (url) => {
                if (!url) return log("Usage: goto <url>");
                location.href = url;
            }, "Navigate to URL.");

            api.commands.register("copy", (txt) => {
                navigator.clipboard.writeText(txt);
                log("Copied.");
            }, "Copy text to clipboard.");

            api.commands.register("css", (code) => {
                const s = document.createElement("style");
                s.textContent = code;
                document.head.appendChild(s);
                log("Custom CSS applied.");
            }, "Inject CSS into page.");

            api.commands.register("script", async (url) => {
                if (!url) return log("Usage: script <url>");
                const el = document.createElement("script");
                el.src = url;
                document.body.appendChild(el);
                log("Script injected: " + url);
            }, "Run remote script.");

            log("[commands] ready");
        },

        onMount() {}
    });
})();
