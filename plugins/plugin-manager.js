// plugins/plugin-manager.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("pluginManager", {
        name: "Plugins",
        tab: "pluginManager",

        onLoad(api) {
            this.api = api;
            this.registry = DevTools.plugins.registry;

            api.commands.register("plugin.disable", (id) => {
                const rec = this.registry[id];
                if (!rec) return api.log("Unknown plugin: " + id);
                rec.disabled = true;
                api.log("Disabled: " + id);
                DevTools.api.ui.switchTab("CONSOLE");
                this.render && this.render();
            });

            api.commands.register("plugin.enable", (id) => {
                const rec = this.registry[id];
                if (!rec) return api.log("Unknown plugin: " + id);
                rec.disabled = false;
                api.log("Enabled: " + id);
                this.render && this.render();
            });

            api.commands.register("plugin.reload", (id) => {
                const rec = this.registry[id];
                if (!rec) return api.log("Unknown plugin: " + id);
                api.log("Reloading: " + id);
                rec.plugin = null;
                DevTools.plugins.load({ id, src: rec.src });
            });

            api.log("[pluginManager] ready");
        },

        onMount(view) {
            view.innerHTML = `<div class="bdt-pm-list" style="font-size:11px;"></div>`;
            const list = view.querySelector(".bdt-pm-list");

            this.render = () => {
                list.innerHTML = "";
                Object.values(this.registry).forEach(rec => {
                    const row = document.createElement("div");
                    row.style.cssText = `
                        padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.08);
                        display:flex;justify-content:space-between;`;

                    row.innerHTML = `
                        <div>
                            <span style="color:${rec.disabled ? "#f55" : "#3dff88"};">●</span>
                            <b>${rec.id}</b> <span style="opacity:0.6;">[${rec.status}]</span>
                        </div>
                    `;

                    const c = document.createElement("div");
                    c.style.cssText = "display:flex;gap:6px;";

                    const mk = (txt,fn) => {
                        const b = document.createElement("button");
                        b.textContent = txt;
                        b.style.cssText = `
                            padding:2px 6px;background:#000;color:#ddd;border:1px solid #444;
                            border-radius:4px;font-size:10px;cursor:pointer;`;
                        b.onclick = fn;
                        return b;
                    };

                    c.appendChild(mk("Reload", () => {
                        rec.plugin=null;
                        DevTools.plugins.load({ id:rec.id, src:rec.src });
                    }));

                    c.appendChild(mk(rec.disabled?"Enable":"Disable", () => {
                        rec.disabled=!rec.disabled;
                        this.render();
                    }));

                    row.appendChild(c);
                    list.appendChild(row);
                });
            };

            this.render();
        }
    });
})();
