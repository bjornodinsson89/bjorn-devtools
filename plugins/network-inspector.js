// plugins/network-inspector.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("networkInspector", {
        name: "Network",
        tab: "networkInspector",

        onLoad(api) {
            this.api = api;
            this.entries = [];
            this.maxEntries = 400;

            this.hookFetch();
            this.hookXHR();

            api.commands.register("net.search", (txt) => {
                if (!this.render) return api.log("View not mounted.");
                this.searchQuery = txt.toLowerCase();
                this.render();
            }, "Filter network logs");

            api.log("[networkInspector] ready");
        },

        safeCheck() {
            return this.api.ensureUnsafe("network-inspector");
        },

        addEntry(obj) {
            this.entries.push(obj);
            if (this.entries.length > this.maxEntries) {
                this.entries.shift();
            }
            if (this.render) this.render();
        },

        /*===========================================================
        =  FETCH HOOK
        ===========================================================*/
        hookFetch() {
            if (window.__bdt_fetch_pro_hook__) return;
            window.__bdt_fetch_pro_hook__ = true;

            const api = this.api;
            const self = this;
            const origFetch = window.fetch;

            window.fetch = async function (...args) {
                const start = performance.now();
                const url = args[0];
                let res, err;

                try {
                    res = await origFetch.apply(this, args);
                } catch (e) {
                    err = e;
                }

                const end = performance.now();

                const entry = {
                    type: "fetch",
                    method: (args[1]?.method || "GET").toUpperCase(),
                    url: String(url),
                    status: res ? res.status : -1,
                    ms: end - start,
                    time: new Date(),
                    body: null,
                    size: null
                };

                if (res && res.clone && !api.state.safe()) {
                    try {
                        const clone = res.clone();
                        const text = await clone.text();
                        entry.body = text.slice(0, 2000);
                        entry.size = text.length;
                    } catch (_) {}
                }

                if (err) entry.error = err.message;

                self.addEntry(entry);

                if (err) throw err;
                return res;
            };
        },

        /*===========================================================
        =  XHR HOOK
        ===========================================================*/
        hookXHR() {
            if (window.__bdt_xhr_pro_hook__) return;
            window.__bdt_xhr_pro_hook__ = true;

            const self = this;
            const api = this.api;

            const origOpen = XMLHttpRequest.prototype.open;
            const origSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function (m, u) {
                this.__bdt_meta = {
                    method: m.toUpperCase(),
                    url: u,
                    start: 0
                };
                return origOpen.apply(this, arguments);
            };

            XMLHttpRequest.prototype.send = function () {
                const meta = this.__bdt_meta || {};
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
                            const t = this.responseText;
                            entry.body = t.slice(0, 2000);
                            entry.size = t.length;
                        } catch (_) {}
                    }

                    self.addEntry(entry);
                });

                return origSend.apply(this, arguments);
            };
        },

        /*===========================================================
        =  UI MOUNT
        ===========================================================*/
        onMount(view) {
            view.innerHTML = `
                <div style="display:flex;gap:8px;margin-bottom:6px;">
                    <input class="bdt-net-filter" placeholder="Search (url/body)" 
                           style="flex:1;padding:4px 6px;background:#000;color:#fff;border:1px solid #444;font-size:11px;">
                    <select class="bdt-net-method" style="font-size:11px;background:#000;color:#fff;border:1px solid #444;">
                        <option value="">Method</option>
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                        <option>PATCH</option>
                    </select>
                    <select class="bdt-net-status" style="font-size:11px;background:#000;color:#fff;border:1px solid #444;">
                        <option value="">Status</option>
                        <option>2xx</option>
                        <option>3xx</option>
                        <option>4xx</option>
                        <option>5xx</option>
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

            this.searchQuery = "";
            this.render = () => {
                list.innerHTML = "";

                const f = this.searchQuery.toLowerCase();
                const m = methodBox.value;
                const s = statusBox.value;

                this.entries
                    .filter(e => {
                        if (m && e.method !== m) return false;
                        if (s) {
                            const code = e.status;
                            if (s === "2xx" && !(code >= 200 && code < 300)) return false;
                            if (s === "3xx" && !(code >= 300 && code < 400)) return false;
                            if (s === "4xx" && !(code >= 400 && code < 500)) return false;
                            if (s === "5xx" && !(code >= 500 && code < 600)) return false;
                        }
                        if (f) {
                            const target = (e.url + " " + (e.body || "")).toLowerCase();
                            if (!target.includes(f)) return false;
                        }
                        return true;
                    })
                    .slice(-300)
                    .reverse()
                    .forEach(e => {
                        const row = document.createElement("div");
                        row.style.cssText = `
                            padding:4px 0;
                            border-bottom:1px solid rgba(255,255,255,0.08);
                            cursor:pointer;
                        `;
                        const color =
                            e.status >= 500 ? "#ff7777" :
                            e.status >= 400 ? "#ffb566" :
                            e.status >= 300 ? "#6fb6ff" :
                            "#3dff88";

                        row.innerHTML = `
                            <span style="color:${color};font-weight:bold;">${e.method}</span>
                            <span style="opacity:0.7;">${e.status}</span>
                            <span>${e.url}</span>
                            <span style="opacity:0.5;float:right;">${Math.round(e.ms)}ms</span>
                        `;

                        row.onclick = () => this.showDetail(e, detail);
                        list.appendChild(row);
                    });
            };

            filterBox.addEventListener("input", () => {
                this.searchQuery = filterBox.value.trim();
                this.render();
            });

            methodBox.addEventListener("change", () => this.render());
            statusBox.addEventListener("change", () => this.render());

            this.render();
        },

        /*===========================================================
        =  DETAIL PANEL
        ===========================================================*/
        showDetail(entry, detailBox) {
            detailBox.innerHTML = "";

            const wrap = document.createElement("div");
            wrap.style.cssText = `
                background:rgba(0,0,0,0.4);
                border:1px solid rgba(255,255,255,0.1);
                padding:8px;
                border-radius:6px;
            `;

            wrap.innerHTML = `
                <div style="font-size:12px;font-weight:bold;margin-bottom:6px;">
                    ${entry.method} ${entry.url}
                </div>
                <div>Status: ${entry.status}</div>
                <div>Time: ${Math.round(entry.ms)} ms</div>
                <div>When: ${entry.time.toLocaleTimeString()}</div>
                <div>Size: ${entry.size !== null ? entry.size + " chars" : "N/A"}</div>
            `;

            /* Body preview gated by safe mode */
            const bodyWrap = document.createElement("div");
            bodyWrap.style.cssText = `
                margin-top:8px;
                background:#000;
                border:1px solid #333;
                padding:6px;
                max-height:200px;
                overflow:auto;
                white-space:pre-wrap;
                font-family:ui-monospace,monospace;
                font-size:11px;
            `;

            if (this.api.state.safe()) {
                bodyWrap.textContent = "SAFE MODE: Body preview disabled.";
            } else if (entry.body) {
                bodyWrap.textContent = entry.body;
            } else {
                bodyWrap.textContent = "(no body captured)";
            }

            /* Copy buttons */
            const copyBar = document.createElement("div");
            copyBar.style.cssText = "margin-top:6px;display:flex;gap:6px;";

            const btnCopyUrl = document.createElement("button");
            btnCopyUrl.textContent = "Copy URL";
            btnCopyUrl.style.cssText =
                "padding:2px 6px;font-size:10px;background:#000;color:#ddd;border:1px solid #444;border-radius:4px;cursor:pointer;";
            btnCopyUrl.onclick = () => navigator.clipboard.writeText(entry.url);

            const btnCopyBody = document.createElement("button");
            btnCopyBody.textContent = "Copy Body";
            btnCopyBody.style.cssText =
                "padding:2px 6px;font-size:10px;background:#000;color:#ddd;border:1px solid #444;border-radius:4px;cursor:pointer;";
            btnCopyBody.onclick = () => {
                if (!entry.body) return this.api.log("No body.");
                navigator.clipboard.writeText(entry.body);
            };

            copyBar.append(btnCopyUrl, btnCopyBody);
            wrap.append(bodyWrap, copyBar);
            detailBox.appendChild(wrap);
        }
    });
})();
