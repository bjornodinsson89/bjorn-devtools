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
            this._logCache = {}; // per-plugin logs

            api.commands.register("plugin.log", (id) => {
                if (!id) return api.log("Usage: plugin.log <id>");
                if (!this._logCache[id]) return api.log("No logs for plugin.");
                api.log("--- Logs for " + id + " ---");
                this._logCache[id].forEach(line => api.log(line));
            }, "Show plugin log history.");

            api.commands.register("plugin.disable", (id) => {
                if (!id) return api.log("Usage: plugin.disable <id>");
                const rec = this.registry[id];
                if (!rec) return api.log("Unknown plugin.");
                rec.disabled = true;
                api.log("Disabled: " + id);
            }, "Disable a plugin.");

            api.commands.register("plugin.enable", (id) => {
                if (!id) return api.log("Usage: plugin.enable <id>");
                const rec = this.registry[id];
                if (!rec) return api.log("Unknown plugin.");
                rec.disabled = false;
                api.log("Enabled: " + id);
            }, "Enable a plugin.");

            api.log("[pluginManager] ready");
        },

        logFor(id, msg) {
            if (!this._logCache[id]) this._logCache[id] = [];
            this._logCache[id].push(msg);
        },

        reloadPlugin(id) {
            const api = this.api;
            const rec = this.registry[id];
            if (!rec) return api.log("Unknown plugin: " + id);

            api.log(`Reloading plugin '${id}'...`);
            rec.plugin = null;
            rec.status = "pending";

            DevTools.plugins.load({ id, src: rec.src, name: rec.id })
                .then(() => api.log("Reload complete: " + id));
        },

        onMount(view, api) {
            const reg = this.registry;

            view.innerHTML = `
                <div class="bdt-pm-header" style="font-size:12px;margin-bottom:8px;">Plugin Manager</div>
                <div class="bdt-pm-list"></div>
            `;

            const list = view.querySelector(".bdt-pm-list");

            const render = () => {
                list.innerHTML = "";

                Object.values(reg).forEach(rec => {
                    const row = document.createElement("div");
                    row.style.cssText = `
                        padding:6px 0;
                        border-bottom:1px solid rgba(255,255,255,0.08);
                        font-size:11px;
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                    `;

                    const name = document.createElement("div");
                    name.style.cssText = "flex:1;";

                    const statusColor =
                        rec.status === "loaded" ? "#3dff88" :
                        rec.status === "error" ? "#ff4444" :
                        rec.status === "loading" ? "#ffd27a" :
                        "#bbb";

                    name.innerHTML = `
                        <span style="color:${statusColor};">●</span>
                        <strong>${rec.id}</strong>
                        <span style="opacity:0.6;">[${rec.status}]</span>
                        ${rec.disabled ? "<span style='color:#ff5555;'>(disabled)</span>" : ""}
                    `;

                    const controls = document.createElement("div");
                    controls.style.cssText = "display:flex;gap:6px;";

                    const btnReload = document.createElement("button");
                    btnReload.textContent = "Reload";
                    btnReload.style.cssText = `
                        padding:2px 6px;font-size:10px;
                        background:#000;border:1px solid #555;color:#bbb;
                        cursor:pointer;border-radius:4px;
                    `;
                    btnReload.onclick = () => this.reloadPlugin(rec.id);

                    const btnInfo = document.createElement("button");
                    btnInfo.textContent = "Info";
                    btnInfo.style.cssText = `
                        padding:2px 6px;font-size:10px;
                        background:#000;border:1px solid #555;color:#bbb;
                        cursor:pointer;border-radius:4px;
                    `;
                    btnInfo.onclick = () => {
                        api.log("Plugin Info: " + rec.id);
                        api.log(JSON.stringify({
                            id: rec.id,
                            status: rec.status,
                            src: rec.src,
                            disabled: rec.disabled || false
                        }, null, 2));
                    };

                    const btnToggle = document.createElement("button");
                    btnToggle.textContent = rec.disabled ? "Enable" : "Disable";
                    btnToggle.style.cssText = `
                        padding:2px 6px;font-size:10px;
                        background:#111;border:1px solid #555;color:#bbb;
                        cursor:pointer;border-radius:4px;
                    `;
                    btnToggle.onclick = () => {
                        rec.disabled = !rec.disabled;
                        render();
                    };

                    controls.append(btnReload, btnInfo, btnToggle);
                    row.append(name, controls);
                    list.appendChild(row);
                });
            };

            this.render = render;
            render();
        }
    });
})();
