// plugins/plugin-manager.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("pluginManager", {
        name: "Plugins",
        tab: "pluginManager",

        onLoad(api) {
            this.api = api;
            this.registry = DevTools.plugins && DevTools.plugins.registry
                ? DevTools.plugins.registry
                : {};
            api.log && api.log("[pluginManager] ready");
        },

        onUnload() {
            // no global hooks to drop yet
        },

        onMount(view) {
            view.innerHTML = `<div class="bdt-pm-list" style="padding:10px;"></div>`;
            const list = view.querySelector(".bdt-pm-list");

            const renderRow = (rec) => {
                const row = document.createElement("div");
                row.style.cssText = `
                    padding: 10px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-family: var(--bdt-font-ui, system-ui);
                    font-size: 13px;
                    color: var(--bdt-text,#fff);
                `;

                const statusColor = rec.disabled
                    ? "#ef5350"
                    : (rec.status === "loaded" ? "#66bb6a" :
                       rec.status === "pending" ? "#ffa726" :
                       "#ef5350");

                row.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="color:${statusColor};font-size:16px;">●</span>
                        <span style="font-weight:600;">${rec.id}</span>
                        <span style="opacity:0.5;font-size:11px;font-family:monospace;">[${rec.status}]</span>
                        ${rec.disabled ? `<span style="opacity:0.7;font-size:10px;margin-left:4px;">(disabled)</span>` : ""}
                    </div>
                `;

                const controls = document.createElement("div");
                controls.style.cssText = "display:flex;gap:8px;";

                const makeBtn = (txt, color, onClick) => {
                    const b = document.createElement("button");
                    b.textContent = txt;
                    b.style.cssText = `
                        padding: 4px 10px;
                        background: rgba(255,255,255,0.05);
                        color: ${color};
                        border: 1px solid rgba(255,255,255,0.12);
                        border-radius: 4px;
                        font-size: 11px;
                        cursor: pointer;
                        transition: background 0.15s ease, transform 0.1s ease;
                    `;
                    b.onmouseover = () => { b.style.background = "rgba(255,255,255,0.12)"; };
                    b.onmouseout = () => { b.style.background = "rgba(255,255,255,0.05)"; };
                    b.onclick = () => {
                        try { onClick(); }
                        catch (e) {
                            this.api && this.api.log && this.api.log(`[pluginManager] ${txt} error: ${e.message}`);
                        }
                    };
                    return b;
                };

                // Reload button
                controls.appendChild(makeBtn("Reload", "#64b5f6", () => {
                    if (!DevTools.plugins || !DevTools.plugins.load) {
                        this.api.log && this.api.log("pluginManager: plugins.load is not available.");
                        return;
                    }
                    this.api.log && this.api.log(`Reloading ${rec.id}...`);

                    const meta = {
                        id: rec.id,
                        src: rec.src || (DevTools.plugins.defaults || []).find(p => p.id === rec.id)?.src || rec.src
                    };

                    if (!meta.src) {
                        this.api.log && this.api.log(`No src found for plugin '${rec.id}', cannot reload.`);
                        return;
                    }

                    DevTools.plugins.unload(rec.id);

                    rec.status = "pending";
                    rec.plugin = null;

                    DevTools.plugins.load(meta).then(() => {
                        this.api.log && this.api.log(`Reloaded: ${rec.id}`);
                        this.render(list);
                    });
                }));

                // Enable / Disable toggle
                controls.appendChild(makeBtn(
                    rec.disabled ? "Enable" : "Disable",
                    rec.disabled ? "#66bb6a" : "#ef5350",
                    () => {
                        if (!rec.disabled) {
                            DevTools.plugins.unload(rec.id);
                        }
                        rec.disabled = !rec.disabled;
                        this.render(list);
                    }
                ));

                row.appendChild(controls);
                return row;
            };

            this.render = (container) => {
                container.innerHTML = "";
                const values = Object.values(this.registry || {});
                if (!values.length) {
                    container.innerHTML = `<div style="opacity:0.6;">No plugins registered.</div>`;
                    return;
                }
                values.forEach(rec => {
                    container.appendChild(renderRow(rec));
                });
            };

            this.render(list);
        }
    });
})();
