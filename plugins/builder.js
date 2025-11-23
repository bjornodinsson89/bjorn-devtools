// plugins/builder.js — patched & improved
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("builder", {
        name: "Builder",
        tab: "builder",

        onLoad(api) {
            this.api = api;
            this.boundErrorListener = null;

            /*===========================================
            =  COMMANDS
            ============================================*/
            api.commands.register("builder.save", name => {
                if (!name) return api.log("Usage: builder.save <name>");
                this.saveSnippet(name);
            }, "Save builder snippet");

            api.commands.register("builder.load", name => {
                if (!name) return api.log("Usage: builder.load <name>");
                this.loadSnippet(name);
            }, "Load builder snippet");

            api.commands.register("builder.list", () => {
                const keys = Object.keys(localStorage)
                    .filter(k => k.startsWith("__bdt_builder_"));
                api.log("Snippets:");
                keys.forEach(k => api.log("- " + k.replace("__bdt_builder_", "")));
            }, "List builder snippets");

            api.commands.register("builder.export", name => {
                if (!name) return api.log("Usage: builder.export <name>");
                const sn = this.getSnippet(name);
                if (!sn) return api.log("Not found.");
                api.log("Export:");
                api.log(JSON.stringify(sn, null, 2));
            }, "Export builder snippet as JSON");

            api.commands.register("builder.import", json => {
                if (!this.api.ensureUnsafe("builder.import")) return;
                try {
                    const obj = JSON.parse(json);
                    if (!obj.name || !obj.html || obj.css === undefined || obj.js === undefined)
                        return api.log("Import requires {name, html, css, js}");

                    this.setSnippet(obj.name, obj);
                    api.log("Imported snippet: " + obj.name);
                } catch (e) {
                    api.log("ERR: " + e.message);
                }
            }, "Import builder snippet (UNSAFE)");

            api.log("[builder] ready");
        },

        /*===========================================
        =  STORAGE HELPERS
        ============================================*/
        keyName(name) { return "__bdt_builder_" + name; },

        saveSnippet(name) {
            const html = this.html.value;
            const css = this.css.value;
            const js = this.js.value;

            const obj = { name, html, css, js };
            this.setSnippet(name, obj);
            this.api.log("Saved snippet: " + name);
        },

        loadSnippet(name) {
            const sn = this.getSnippet(name);
            if (!sn) return this.api.log("Snippet not found: " + name);

            this.html.value = sn.html;
            this.css.value = sn.css;
            this.js.value = sn.js;

            this.api.log("Loaded snippet: " + name);
            this.runSandbox();
        },

        getSnippet(name) {
            try {
                const raw = localStorage.getItem(this.keyName(name));
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        },

        setSnippet(name, obj) {
            try {
                localStorage.setItem(this.keyName(name), JSON.stringify(obj));
            } catch (e) {
                this.api.log("ERR: unable to save snippet.");
            }
        },

        /*===========================================
        =  SANDBOX SETUP
        ============================================*/
        onMount(view, api) {
            // NEW: secure iframe with sandbox
            view.innerHTML = `
                <div style="display:flex;gap:6px;margin-bottom:6px;">
                    <button class="bdt-b-run">Run</button>
                    <label style="font-size:11px;display:flex;align-items:center;gap:4px;">
                        <input type="checkbox" class="bdt-b-auto"> Auto-Run
                    </label>
                </div>

                <div style="display:flex;gap:6px;height:40%;">
                    <textarea class="bdt-b-html" placeholder="HTML"
                        style="flex:1;background:#000;color:#fff;font-family:ui-monospace,monospace;font-size:11px;padding:6px;border:1px solid #444;"></textarea>
                    <textarea class="bdt-b-css" placeholder="CSS"
                        style="flex:1;background:#000;color:#fff;font-family:ui-monospace,monospace;font-size:11px;padding:6px;border:1px solid #444;"></textarea>
                    <textarea class="bdt-b-js" placeholder="JS"
                        style="flex:1;background:#000;color:#fff;font-family:ui-monospace,monospace;font-size:11px;padding:6px;border:1px solid #444;"></textarea>
                </div>

                <iframe class="bdt-b-frame" sandbox="allow-scripts"
                    style="width:100%;height:55%;margin-top:6px;
                    background:#fff;border:1px solid #333;border-radius:4px;"></iframe>
            `;

            this.html = view.querySelector(".bdt-b-html");
            this.css = view.querySelector(".bdt-b-css");
            this.js = view.querySelector(".bdt-b-js");
            this.frame = view.querySelector(".bdt-b-frame");
            this.runBtn = view.querySelector(".bdt-b-run");
            this.auto = view.querySelector(".bdt-b-auto");

            this.runBtn.onclick = () => this.runSandbox();

            const autoHandler = () => {
                if (this.auto.checked) this.runSandbox();
            };

            this.html.addEventListener("input", autoHandler);
            this.css.addEventListener("input", autoHandler);
            this.js.addEventListener("input", autoHandler);
        },

        /*===========================================
        =  SANDBOX RUNNER
        ============================================*/
        runSandbox() {
            const safe = this.api.state.safe();

            // Clean old listeners
            if (this.boundErrorListener) {
                window.removeEventListener("message", this.boundErrorListener);
                this.boundErrorListener = null;
            }

            const doc = this.frame.contentDocument;

            const html = this.html.value;
            const css = this.css.value;
            const js = this.js.value.replace(/<\/script/gi, "<\\/script"); // prevent break-out

            if (safe) {
                this.api.log("SAFE MODE: JS execution blocked.");
                return this.loadHTMLCSSOnly();
            }

            const full = `
<!DOCTYPE html>
<html>
<head>
<style>${css}</style>
</head>
<body>
${html}
<script>
try {
${js}
} catch(e){
    parent.postMessage({bdtSandboxError: e.message}, "*");
}
</script>
</body>
</html>
            `;

            doc.open();
            doc.write(full);
            doc.close();

            // error listener
            this.boundErrorListener = (e) => {
                if (e.data && e.data.bdtSandboxError) {
                    this.api.log("Sandbox ERR: " + e.data.bdtSandboxError);
                }
            };
            window.addEventListener("message", this.boundErrorListener);
        },

        loadHTMLCSSOnly() {
            const doc = this.frame.contentDocument;

            const full = `
<!DOCTYPE html>
<html>
<head><style>${this.css.value}</style></head>
<body>${this.html.value}</body>
</html>
            `;

            doc.open();
            doc.write(full);
            doc.close();
        }
    });
})();
