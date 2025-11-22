// plugins/network-inspector.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.definePlugin) return;

    // Fix: Target the actual page window for hooking, not the sandbox
    const targetWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

    DevTools.definePlugin("networkInspector", {
        tab: "NETWORK",
        
        // Internal state
        _entries: [],
        _maxEntries: 200,
        _autoScroll: true,

        onLoad(api) {
            const self = this;
            const log = api.log;
            const isSafeMode = api.state.safeMode;
            const unsafe = api.unsafe;

            let listEl = null;
            let detailEl = null;

            // --- API EXPOSED METHODS ---
            this.clear = () => {
                this._entries = [];
                this._renderList();
            };

            // --- RENDERING ---
            this._renderList = function() {
                if (!listEl) return;
                listEl.innerHTML = "";
                
                if (!this._entries.length) {
                    const empty = document.createElement("div");
                    empty.className = "bdt-net-empty";
                    empty.innerHTML = unsafe.isToolEnabled("networkInspector") && !isSafeMode()
                        ? "Waiting for traffic..."
                        : "Inspector Locked.<br>Disable SAFE + Enable 'networkInspector'.";
                    listEl.appendChild(empty);
                    return;
                }

                // Render latest first
                this._entries.slice().reverse().forEach((e) => {
                    const row = document.createElement("div");
                    row.className = "bdt-net-row";
                    
                    // Method Color Coding
                    let methodColor = "bdt-net-m-def";
                    if(e.method === "GET") methodColor = "bdt-net-m-get";
                    if(e.method === "POST") methodColor = "bdt-net-m-post";
                    if(e.method === "DELETE") methodColor = "bdt-net-m-del";
                    if(e.method === "PUT" || e.method === "PATCH") methodColor = "bdt-net-m-put";

                    const statusClass = e.status >= 500 ? "err" : e.status >= 400 ? "warn" : "ok";

                    row.innerHTML = `
                        <div class="bdt-net-row-line">
                            <span class="bdt-net-badge ${methodColor}">${e.method}</span>
                            <span class="bdt-net-status bdt-net-${statusClass}">${e.status}</span>
                            <span class="bdt-net-url">${e.url.split('?')[0].split('/').pop() || e.url}</span>
                        </div>
                        <div class="bdt-net-row-sub">${e.url}</div>
                        <div class="bdt-net-row-meta">
                            <span>${Math.round(e.duration)}ms</span>
                            <span>${e.type}</span>
                            <span>${new Date(e.time).toLocaleTimeString()}</span>
                        </div>
                    `;

                    row.onclick = () => showDetails(e);
                    listEl.appendChild(row);
                });
            };

            function showDetails(e) {
                if (!detailEl) return;
                detailEl.innerHTML = "";

                const gated = isSafeMode() || !unsafe.isToolEnabled("networkInspector");
                const wrap = document.createElement("div");
                wrap.className = "bdt-net-detail";

                wrap.innerHTML = `
                    <div class="bdt-net-detail-header">${e.method} ${e.status}</div>
                    <div class="bdt-net-detail-url">${e.url}</div>
                    <div class="bdt-net-detail-meta">
                        <div>Duration: ${Math.round(e.duration)}ms</div>
                        <div>Type: ${e.type}</div>
                        <div>Time: ${new Date(e.time).toLocaleString()}</div>
                    </div>
                `;

                const bodyBox = document.createElement("div");
                bodyBox.className = "bdt-net-detail-body";

                if (gated) {
                    bodyBox.style.color = "#ff6b6b";
                    bodyBox.textContent = "🔒 Body Locked (Safe Mode On)";
                } else if (e.bodyPreview) {
                    const pre = document.createElement("pre");
                    pre.textContent = e.bodyPreview;
                    bodyBox.appendChild(pre);
                } else {
                    bodyBox.style.fontStyle = "italic";
                    bodyBox.style.opacity = "0.5";
                    bodyBox.textContent = "No body captured.";
                }

                wrap.appendChild(bodyBox);
                detailEl.appendChild(wrap);
            }

            function addEntry(e) {
                self._entries.push(e);
                if (self._entries.length > self._maxEntries) self._entries.shift();
                if (listEl) self._renderList(); // Only render if view is active
            }

            // --- HOOKS ---
            // 1. Fetch
            if (!targetWindow.__bdtFetchHook) {
                targetWindow.__bdtFetchHook = true;
                const origFetch = targetWindow.fetch;
                targetWindow.fetch = async function (...args) {
                    const start = performance.now();
                    const url = (args[0] && args[0].url) || args[0];
                    const method = (args[1] && args[1].method) || "GET";
                    
                    let res, err;
                    try { res = await origFetch.apply(this, args); } 
                    catch (e) { err = e; }

                    const end = performance.now();
                    let bodyPreview = null;

                    if (res && !isSafeMode() && unsafe.isToolEnabled("networkInspector")) {
                        try {
                            const clone = res.clone();
                            const text = await clone.text();
                            bodyPreview = text.length > 800 ? text.slice(0, 800) + "..." : text;
                        } catch (_) {}
                    }

                    addEntry({
                        type: "fetch", method, url: String(url),
                        status: res ? res.status : 0,
                        duration: end - start, time: Date.now(),
                        bodyPreview
                    });

                    if (err) throw err;
                    return res;
                };
                log("[Network] Fetch hooked.");
            }

            // 2. XHR
            if (!targetWindow.__bdtXHRHook && targetWindow.XMLHttpRequest) {
                targetWindow.__bdtXHRHook = true;
                const origOpen = targetWindow.XMLHttpRequest.prototype.open;
                const origSend = targetWindow.XMLHttpRequest.prototype.send;

                targetWindow.XMLHttpRequest.prototype.open = function (m, u) {
                    this._bdtInfo = { method: m || "GET", url: String(u) };
                    return origOpen.apply(this, arguments);
                };

                targetWindow.XMLHttpRequest.prototype.send = function () {
                    const info = this._bdtInfo || {};
                    const start = performance.now();
                    
                    this.addEventListener("loadend", () => {
                        let bodyPreview = null;
                        if (!isSafeMode() && unsafe.isToolEnabled("networkInspector")) {
                            try {
                                if(this.responseType === '' || this.responseType === 'text') {
                                    const t = this.responseText;
                                    bodyPreview = t.length > 800 ? t.slice(0,800)+"..." : t;
                                }
                            } catch (_) {}
                        }

                        addEntry({
                            type: "xhr", method: info.method, url: info.url,
                            status: this.status,
                            duration: performance.now() - start, time: Date.now(),
                            bodyPreview
                        });
                    });
                    return origSend.apply(this, arguments);
                };
                log("[Network] XHR hooked.");
            }

            // Save reference for onMount
            this._attachView = (root) => {
                listEl = root.querySelector(".bdt-net-list");
                detailEl = root.querySelector(".bdt-net-detail-container");
                this._renderList();
            };
        },

        onMount(view, api) {
            view.innerHTML = `
                <div class="bdt-net-shell">
                    <div class="bdt-net-toolbar">
                        <div class="bdt-net-title">Inspect</div>
                        <button id="bdt-net-clear">🚫 Clear</button>
                    </div>
                    <div class="bdt-net-body">
                        <div class="bdt-net-list"></div>
                        <div class="bdt-net-detail-container"></div>
                    </div>
                </div>
            `;
            
            // Bind Toolbar
            view.querySelector("#bdt-net-clear").onclick = () => this.clear();

            if (this._attachView) this._attachView(view);

            if (!document.getElementById("bdt-net-css")) {
                const s = document.createElement("style");
                s.id = "bdt-net-css";
                s.textContent = `
                    .bdt-net-shell { display: flex; flex-direction: column; height: 100%; gap: 6px; }
                    .bdt-net-toolbar { display: flex; align-items: center; justify-content: space-between; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1); }
                    .bdt-net-title { font-weight: bold; color: #aaa; font-size: 11px; text-transform: uppercase; }
                    #bdt-net-clear { background: #422; border: 1px solid #633; color: #faa; border-radius: 4px; font-size: 10px; padding: 2px 8px; cursor: pointer; }
                    .bdt-net-body { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; height: 100%; min-height: 0; }
                    .bdt-net-list { overflow-y: auto; border-right: 1px solid rgba(255,255,255,0.05); padding-right: 5px; }
                    .bdt-net-detail-container { overflow-y: auto; }
                    
                    .bdt-net-row { padding: 6px; margin-bottom: 4px; background: rgba(255,255,255,0.03); border-radius: 4px; cursor: pointer; border-left: 3px solid transparent; }
                    .bdt-net-row:hover { background: rgba(255,255,255,0.08); }
                    .bdt-net-row-line { display: flex; align-items: center; gap: 5px; }
                    .bdt-net-row-sub { font-size: 9px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
                    
                    .bdt-net-badge { font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: bold; color: #111; }
                    .bdt-net-m-def { background: #ccc; }
                    .bdt-net-m-get { background: #4facfe; color: #000; }
                    .bdt-net-m-post { background: #43e97b; color: #000; }
                    .bdt-net-m-del { background: #fa709a; color: #fff; }
                    .bdt-net-m-put { background: #fccb90; color: #000; }

                    .bdt-net-status { font-size: 9px; font-weight: bold; }
                    .bdt-net-ok { color: #43e97b; } 
                    .bdt-net-warn { color: #fccb90; } 
                    .bdt-net-err { color: #fa709a; }
                    
                    .bdt-net-url { font-size: 11px; color: #ddd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .bdt-net-row-meta { display: flex; gap: 8px; margin-top: 3px; font-size: 9px; color: #777; }
                    
                    .bdt-net-detail { display: flex; flex-direction: column; gap: 5px; }
                    .bdt-net-detail-header { font-size: 12px; font-weight: bold; color: #fff; border-bottom: 1px solid #333; padding-bottom: 4px; }
                    .bdt-net-detail-url { font-size: 10px; color: #4facfe; word-break: break-all; font-family: monospace; }
                    .bdt-net-detail-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 10px; color: #888; }
                    .bdt-net-detail-body { background: #111; padding: 5px; border-radius: 4px; font-size: 10px; font-family: monospace; color: #ccc; overflow-x: auto; white-space: pre-wrap; }
                `;
                document.head.appendChild(s);
            }
        }
    });
})();
