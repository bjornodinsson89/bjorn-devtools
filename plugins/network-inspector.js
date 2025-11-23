// plugins/network-inspector.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    // Viewing network is safe — body access is restricted in SAFE mode
    DevTools.registerPlugin("networkInspector", {
        name: "Network",
        tab: "networkInspector",

        onLoad(api) {
            this.api = api;
            this.entries = [];
            this.maxEntries = 300;
            this.render = null;
            this.filter = "";
            this.methodFilter = "";
            this.statusFilter = "";

            api.commands.register("net.search", (q) => {
                this.filter = (q || "").toLowerCase();
                this.render && this.render();
            }, "Filter network logs");

            api.log("[networkInspector] ready");

            // patch once
            if (!window.__bdt_fetch_patch__) {
                window.__bdt_fetch_patch__ = true;
                const orig = window.fetch;
                window.fetch = async (...args) => {
                    const start = performance.now();
                    let res, err;
                    try { res = await orig(...args); } catch (e) { err = e; }
                    const end = performance.now();

                    const entry = {
                        type: "fetch",
                        url: String(args[0]),
                        method: (args[1]?.method || "GET").toUpperCase(),
                        status: res ? res.status : -1,
                        ms: end - start,
                        time: new Date(),
                        body: null,
                        size: null
                    };

                    if (!api.state.safe() && res && res.clone) {
                        try {
                            const txt = await res.clone().text();
                            entry.body = txt.slice(0, 3000);
                            entry.size = txt.length;
                        } catch { entry.body = null; }
                    }

                    DevTools.plugins.registry.networkInspector.plugin.add(entry);
                    if (err) throw err;
                    return res;
                };
            }

            if (!window.__bdt_xhr_patch__) {
                window.__bdt_xhr_patch__ = true;

                const X = XMLHttpRequest.prototype;
                const origOpen = X.open;
                const origSend = X.send;

                X.open = function (m, u) {
                    this.__bdt_meta = { method: m.toUpperCase(), url: u, start: 0 };
                    return origOpen.apply(this, arguments);
                };

                X.send = function () {
                    const meta = this.__bdt_meta;
                    meta.start = performance.now();

                    this.addEventListener("loadend", () => {
                        const end = performance.now();
                        const entry = {
                            type: "xhr",
                            method: meta.method,
                            url: meta.url,
                            status: this.status,
                            ms: end - meta.start,
                            time: new Date(),
                            body: null,
                            size: null
                        };
                        if (!api.state.safe()) {
                            try {
                                const t = this.responseText || "";
                                entry.body = t.slice(0, 3000);
                                entry.size = t.length;
                            } catch {}
                        }
                        DevTools.plugins.registry.networkInspector.plugin.add(entry);
                    });

                    return origSend.apply(this, arguments);
                };
            }
        },

        add(entry) {
            this.entries.push(entry);
            if (this.entries.length > this.maxEntries) this.entries.shift();
            this.render && this.render();
        },

        onMount(view) {
            view.innerHTML = `
                <div style="display:flex;gap:8px;margin-bottom:6px;">
                    <input class="bdt-net-filter" placeholder="Search..." style="flex:1;padding:4px;background:#000;color:#fff;border:1px solid #444;">
                    <select class="bdt-net-method" style="background:#000;color:#fff;border:1px solid #444;">
                        <option value="">Method</option><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option>
                    </select>
                    <select class="bdt-net-status" style="background:#000;color:#fff;border:1px solid #444;">
                        <option value="">Status</option><option>2xx</option><option>3xx</option><option>4xx</option><option>5xx</option>
                    </select>
                </div>
                <div class="bdt-net-list" style="font-size:11px;"></div>
                <div class="bdt-net-detail" style="margin-top:10px;font-size:11px;"></div>
            `;

            const filterBox = view.querySelector(".bdt-net-filter");
            const methodBox = view.querySelector(".bdt-net-method");
            const statusBox = view.querySelector(".bdt-net-status");

            const list = view.querySelector(".bdt-net-list");
            const detail = view.querySelector(".bdt-net-detail");

            filterBox.oninput = () => { this.filter = filterBox.value.toLowerCase(); this.render(); };
            methodBox.onchange = () => { this.methodFilter = methodBox.value; this.render(); };
            statusBox.onchange = () => { this.statusFilter = statusBox.value; this.render(); };

            this.render = () => {
                list.innerHTML = "";
                const f = this.filter;
                const m = this.methodFilter;
                const s = this.statusFilter;

                this.entries.slice().reverse().forEach(e => {
                    let ok = true;
                    if (m && e.method !== m) ok = false;
                    if (s) {
                        const st = e.status;
                        if (s === "2xx" && !(st >= 200 && st < 300)) ok = false;
                        if (s === "3xx" && !(st >= 300 && st < 400)) ok = false;
                        if (s === "4xx" && !(st >= 400 && st < 500)) ok = false;
                        if (s === "5xx" && !(st >= 500 && st < 600)) ok = false;
                    }
                    if (f) {
                        const txt = (e.url + " " + (e.body || "")).toLowerCase();
                        if (!txt.includes(f)) ok = false;
                    }
                    if (!ok) return;

                    const row = document.createElement("div");
                    row.style.cssText = `
                        padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.08);
                        cursor:pointer;display:flex;justify-content:space-between;`;

                    row.innerHTML = `
                        <span style="flex:0 0 55px;color:#6fb6ff">${e.method}</span>
                        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${e.url}</span>
                        <span style="flex:0 0 60px;text-align:right;opacity:0.7;">${Math.round(e.ms)}ms</span>
                    `;

                    row.onclick = () => {
                        detail.innerHTML = `
                            <div style="padding:6px;background:#000;border:1px solid #333;border-radius:4px;">
                                <div><b>${e.method}</b> ${e.url}</div>
                                <div>Status: ${e.status}</div>
                                <div>Time: ${Math.round(e.ms)} ms</div>
                                <div>When: ${e.time.toLocaleString()}</div>
                                <div>Size: ${e.size ?? "?"}</div>
                                <div style="margin-top:6px;padding:6px;background:#111;border:1px solid #333;white-space:pre-wrap;max-height:200px;overflow:auto;">
                                    ${this.api.state.safe() ? "(SAFE MODE — body blocked)" : (e.body ?? "(no body)")}
                                </div>
                            </div>`;
                    };

                    list.appendChild(row);
                });
            };

            this.render();
        }
    });
})();
