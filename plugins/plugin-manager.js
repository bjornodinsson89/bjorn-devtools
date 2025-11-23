// plugins/plugin-manager.js — patched & stabilized
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("pluginManager", {
        name: "Plugins",
        tab: "pluginManager",

        onLoad(api) {
            this.api = api;
            this.registry = DevTools.plugins.registry;
            this._logCache = {};

            /*===========================================================
            =  COMMAND: plugin.log <id>
            ===========================================================*/
            api.commands.register("plugin.log", (id) => {
                if (!id) return api.log("Usage: plugin.log <id>");

                const logs = this._logCache[id];
                if (!logs) return api.log("No logs for plugin.");

                api.log("--- Logs for " + id + " ---");
                logs.forEach(line => api.log(line));
            }, "Show plugin log history.");

            /*===========================================================
            =  COMMAND: plugin.disable <id>
            ===========================================================*/
            api.commands.register("plugin.disable", (id) => {
                if (!id) return api.log("Usage: plugin.disable <id>");

                const rec = this.registry[id];
                if (!rec) return api.log("Unknown plugin: " + id);

                if (id === "pluginManager")
                    return api.log("Cannot disable Plugin Manager.");

                rec.disabled = true;

                api.log("Disabled: " + id);
                this.refreshTabs();
                this.render && this.render();
            }, "Disable a plugin.");

            /*===========================================================
            =  COMMAND: plugin.enable <id>
            ===========================================================*/
            api.commands.register("plugin.enable", (id) => {
                if (!id) return api.log("Usage: plugin.enable <id>");

                const rec = this.registry[id];
                if (!rec) return api.log("Unknown plugin: " + id);

                rec.disabled = false;

                api.log("Enabled: " + id);
                this.refreshTabs();
                this.render && this.render();
            }, "Enable a plugin.");

            /*===========================================================
            =  COMMAND: plugin.reload <id>
            ===========================================================*/
            api.commands.register("plugin.reload", (id) => {
                if (!id) return api.log("Usage: plugin.reload <id>");
                this.reloadPlugin(id);
            }, "Reload a plugin");

            api.log("[pluginManager] ready");
        },

        /*===========================================================
        =  LOG BUFFERING
        ===========================================================*/
        logFor(id, msg) {
            if (!this._logCache[id]) this._logCache[id] = [];
            this._logCache[id].push(msg);
        },

        /*===========================================================
        =  PLUGIN RELOAD LOGIC (safe, full cleanup)
        ===========================================================*/
        async reloadPlugin(id) {
            const api = this.api;
            const rec = this.registry[id];

            if (!rec) return api.log("Unknown plugin: " + id);
            if (!rec.src) return api.log("Plugin has no src URL.");

            api.log(`Reloading plugin '${id}'...`);

            // Clear previous plugin instance
            rec.plugin = null;
            rec.status = "pending";

            // Attempt reload
            await DevTools.plugins.load({
                id,
                src: rec.src,
                name: rec.id
            });

            if (rec.status === "loaded") {
                api.log(`Reload complete: ${id}`);
            } else {
                api.log(`Reload failed: ${id} (status=${rec.status})`);
            }

            this.refreshTabs();
            this.render && this.render();
        },

        /*===========================================================
        =  TAB REFRESH
        ===========================================================*/
        refreshTabs() {
            const root = this.api.ui.getRoot();
            if (!root) return;

            const tabBar = root.querySelector(".bdt-tabs");
            if (!tabBar) return;

            // remove existing plugin tabs
            tabBar.querySelectorAll(".bdt-tab").forEach(btn => {
                const id = btn.dataset.tab;
                if (id !== "CONSOLE" && !this.registry[id]) {
                    btn.remove();
                }
            });

            // rebuild missing plugin tabs
            Object.values(this.registry).forEach(rec => {
                if (!rec.plugin) return;
                if (rec.disabled) return;
                if (!rec.plugin.tab) return;

                if (!tabBar.querySelector(`[data-tab="${rec.id}"]`)) {
                    this.api.ui.addTab(rec.id, rec.plugin.name || rec.id);
                }
            });
        },

        /*===========================================================
        =  UI MOUNT
        ===========================================================*/
        onMount(view, api) {
            const reg = this.registry;

            view.innerHTML = `
                <div class="bdt-pm-header" style="font-size:12px;margin-bottom:8px;">Plugin Manager</div>
                <div class="bdt-pm-list"></div>
            `;

            const list = view.querySelector(".bdt-pm-list");

            const getStatusColor = (status) => {
                return status === "loaded" ? "#3dff88" :
                    status === "error" ? "#ff4444" :
                        status === "loading" ? "#ffd27a" :
                            "#bbb";
            };

            const render = () => {
                list.innerHTML = "";

                Object.values(reg).forEach(rec => {
                    // Guard broken entries
                    if (!rec || !rec.id) return;

                    const row = document.createElement("div");
                    row.style.cssText = `
                        padding:6px 0;
                        border-bottom:1px solid rgba(255,255,255,0.08);
                        font-size:11px;
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                    `;

                    const nameBox = document.createElement("div");
                    nameBox.style.cssText = "flex:1;";

                    const statusColor = getStatusColor(rec.status);

                    nameBox.innerHTML = `
                        <span style="color:${statusColor};">●</span>
                        <strong>${rec.id}</strong>
                        <span style="opacity:0.6;">[${rec.status}]</span>
                        ${rec.disabled ? "<span style='color:#ff5555;'>(disabled)</span>" : ""}
                    `;

                    const controls = document.createElement("div");
                    controls.style.cssText = "display:flex;gap:6px;";

                    /*------------------------------
                    | Reload Button
                    ------------------------------*/
                    const btnReload = document.createElement("button");
                    btnReload.textContent = "Reload";
                    btnReload.style.cssText = `
                        padding:2px 6px;font-size:10px;
                        background:#000;border:1px solid #555;color:#bbb;
                        cursor:pointer;border-radius:4px;
                    `;
                    btnReload.onclick = () => this.reloadPlugin(rec.id);

                    /*------------------------------
                    | Info Button
                    ------------------------------*/
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

                    /*------------------------------
                    | Disable/Enable Button
                    ------------------------------*/
                    const btnToggle = document.createElement("button");
                    btnToggle.textContent = rec.disabled ? "Enable" : "Disable";
                    btnToggle.style.cssText = `
                        padding:2px 6px;font-size:10px;
                        background:#111;border:1px solid #555;color:#bbb;
                        cursor:pointer;border-radius:4px;
                    `;
                    btnToggle.onclick = () => {
                        if (rec.id === "pluginManager") {
                            return api.log("Cannot disable Plugin Manager.");
                        }
                        rec.disabled = !rec.disabled;
                        this.refreshTabs();
                        render();
                    };

                    controls.append(btnReload, btnInfo, btnToggle);
                    row.append(nameBox, controls);
                    list.appendChild(row);
                });
            };

            this.render = render;
            render();
        }
    });
})();
