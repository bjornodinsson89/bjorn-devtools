// plugins/network-inspector.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.definePlugin) return;

    DevTools.definePlugin("networkInspector", {
        tab: "NETWORK",

        onLoad(api) {
            const log = api.log;
            const isSafeMode = api.state.safeMode;
            const unsafe = api.unsafe;

            const MAX_ENTRIES = 200;
            const entries = [];
            let viewRoot = null;
            let listEl = null;
            let detailEl = null;

            function addEntry(e) {
                // keep last MAX_ENTRIES
                entries.push(e);
                if (entries.length > MAX_ENTRIES) entries.shift();
                renderList();
            }

            function renderList() {
                if (!listEl) return;
                listEl.innerHTML = "";
                if (!entries.length) {
                    const empty = document.createElement("div");
                    empty.className = "bdt-net-empty";
                    empty.textContent = unsafe.isToolEnabled("networkInspector") && !isSafeMode()
                        ? "No requests captured yet."
                        : "Network inspector is locked. Disable SAFE + enable 'networkInspector' unsafe tool.";
                    listEl.appendChild(empty);
                    return;
                }

                entries.slice().reverse().forEach((e) => {
                    const row = document.createElement("div");
                    row.className = "bdt-net-row";

                    const statusClass =
                        e.status >= 500 ? "err" :
                        e.status >= 400 ? "warn" :
                        e.status >= 300 ? "info" : "ok";

                    row.innerHTML = `
                        <div class="bdt-net-row-line">
                            <span class="bdt-net-badge bdt-net-${statusClass}">${e.method}</span>
                            <span class="bdt-net-status">${e.status}</span>
                            <span class="bdt-net-url" title="${e.url}">${e.url}</span>
                        </div>
                        <div class="bdt-net-row-meta">
                            <span>${Math.round(e.duration)} ms</span>
                            <span>${e.type}</span>
                            <span>${new Date(e.time).toLocaleTimeString()}</span>
                        </div>
                    `;

                    row.onclick = () => showDetails(e);
                    listEl.appendChild(row);
                });
            }

            function showDetails(e) {
                if (!detailEl) return;
                detailEl.innerHTML = "";

                const gated = isSafeMode() || !unsafe.isToolEnabled("networkInspector");

                const wrap = document.createElement("div");
                wrap.className = "bdt-net-detail";

                const header = document.createElement("div");
                header.className = "bdt-net-detail-header";
                header.textContent = `${e.method} ${e.url}`;
                wrap.appendChild(header);

                const meta = document.createElement("div");
                meta.className = "bdt-net-detail-meta";
                meta.innerHTML = `
                    <div>Status: ${e.status}</div>
                    <div>Type: ${e.type}</div>
                    <div>Duration: ${Math.round(e.duration)} ms</div>
                    <div>Started: ${new Date(e.time).toLocaleString()}</div>
                `;
                wrap.appendChild(meta);

                const bodyBox = document.createElement("div");
                bodyBox.className = "bdt-net-detail-body";

                if (gated) {
                    bodyBox.textContent =
                        "Body preview locked. Disable SAFE + enable 'networkInspector' unsafe tool to see response bodies.";
                } else if (e.bodyPreview != null) {
                    const pre = document.createElement("pre");
                    pre.textContent = e.bodyPreview;
                    bodyBox.appendChild(pre);
                } else {
                    bodyBox.textContent = "No body captured (binary/streaming or capture disabled).";
                }

                wrap.appendChild(bodyBox);
                detailEl.appendChild(wrap);
            }

            /*********** HOOK FETCH ***********/
            if (!window.__bjornNetworkFetchWrapped && typeof fetch === "function") {
                window.__bjornNetworkFetchWrapped = true;
                const origFetch = window.fetch;
                window.fetch = async function (...args) {
                    const start = performance.now();
                    const url = (args[0] && args[0].url) || args[0];
                    const method = (args[1] && args[1].method) || "GET";
                    let res, error;

                    try {
                        res = await origFetch.apply(this, args);
                    } catch (e) {
                        error = e;
                    }

                    const end = performance.now();
                    const duration = end - start;
                    const time = Date.now();
                    let bodyPreview = null;

                    const canCapture =
                        !isSafeMode() && unsafe.isToolEnabled("networkInspector");

                    if (res && canCapture) {
                        try {
                            const clone = res.clone();
                            const text = await clone.text();
                            bodyPreview = text.length > 600 ? text.slice(0, 600) + "…" : text;
                        } catch (_) {
                            bodyPreview = null;
                        }
                    }

                    addEntry({
                        type: "fetch",
                        method,
                        url: String(url),
                        status: res ? res.status : (error ? 0 : 0),
                        duration,
                        time,
                        bodyPreview
                    });

                    if (error) throw error;
                    return res;
                };
                log("[networkInspector] fetch hooked.");
            }

            /*********** HOOK XHR ***********/
            if (!window.__bjornNetworkXHRWrapped && window.XMLHttpRequest) {
                window.__bjornNetworkXHRWrapped = true;

                const origOpen = XMLHttpRequest.prototype.open;
                const origSend = XMLHttpRequest.prototype.send;

                XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
                    this.__bjornNetInfo = {
                        method: method || "GET",
                        url: String(url),
                        startTime: 0
                    };
                    return origOpen.apply(this, arguments);
                };

                XMLHttpRequest.prototype.send = function (body) {
                    const info = this.__bjornNetInfo || {};
                    info.startTime = performance.now();

                    this.addEventListener("loadend", () => {
                        const end = performance.now();
                        const duration = end - info.startTime;
                        const time = Date.now();
                        const status = this.status;

                        let bodyPreview = null;
                        const canCapture =
                            !isSafeMode() && unsafe.isToolEnabled("networkInspector");

                        if (canCapture) {
                            try {
                                const text = this.responseText;
                                if (typeof text === "string") {
                                    bodyPreview =
                                        text.length > 600 ? text.slice(0, 600) + "…" : text;
                                }
                            } catch (_) {
                                bodyPreview = null;
                            }
                        }

                        addEntry({
                            type: "xhr",
                            method: info.method || "GET",
                            url: info.url || "",
                            status,
                            duration,
                            time,
                            bodyPreview
                        });
                    });

                    return origSend.apply(this, arguments);
                };

                log("[networkInspector] XHR hooked.");
            }

            // internal references for onMount
            this._netEntries = entries;
            this._renderList = renderList;
            this._attachView = function (root) {
                viewRoot = root;
                listEl = root.querySelector(".bdt-net-list");
                detailEl = root.querySelector(".bdt-net-detail-container");
                this._renderList();
            };

            log("[networkInspector] Plugin loaded. Use 'unsafe' commands to unlock full inspector.");
        },

        onMount(view, api) {
            // Build basic layout inside NETWORK tab
            view.innerHTML = `
                <div class="bdt-net-shell">
                    <div class="bdt-net-header">
                        <div class="bdt-net-title">Network Inspector</div>
                        <div class="bdt-net-subtitle">
                            Deep inspection is gated. Use 'unsafe' commands to unlock.
                        </div>
                    </div>
                    <div class="bdt-net-body">
                        <div class="bdt-net-list"></div>
                        <div class="bdt-net-detail-container"></div>
                    </div>
                </div>
            `;

            // Attach view references
            if (typeof this._attachView === "function") {
                this._attachView(view);
            }

            // Inject a little CSS just for this panel (scoped)
            if (!document.getElementById("bdt-net-styles")) {
                const s = document.createElement("style");
                s.id = "bdt-net-styles";
                s.textContent = `
                    .bdt-net-shell {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        gap: 6px;
                        font-size: 11px;
                    }
                    .bdt-net-header {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                        padding-bottom: 4px;
                        border-bottom: 1px solid rgba(255,255,255,0.06);
                    }
                    .bdt-net-title {
                        font-size: 12px;
                        font-weight: 600;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                    }
                    .bdt-net-subtitle {
                        font-size: 10px;
                        color: rgba(230,230,240,0.7);
                    }
                    .bdt-net-body {
                        display: grid;
                        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.6fr);
                        gap: 8px;
                        height: 100%;
                        min-height: 0;
                    }
                    .bdt-net-list {
                        border-right: 1px solid rgba(255,255,255,0.06);
                        padding-right: 4px;
                        overflow-y: auto;
                    }
                    .bdt-net-detail-container {
                        overflow-y: auto;
                        padding-left: 4px;
                    }
                    .bdt-net-empty {
                        font-size: 11px;
                        color: rgba(230,230,240,0.7);
                        padding: 4px 0;
                    }
                    .bdt-net-row {
                        padding: 4px 2px;
                        border-radius: 6px;
                        cursor: pointer;
                        margin-bottom: 2px;
                    }
                    .bdt-net-row:hover {
                        background: rgba(255,255,255,0.04);
                    }
                    .bdt-net-row-line {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .bdt-net-badge {
                        font-size: 9px;
                        padding: 1px 5px;
                        border-radius: 999px;
                        text-transform: uppercase;
                        letter-spacing: 0.12em;
                    }
                    .bdt-net-ok {
                        background: rgba(70,255,136,0.2);
                        color: #adffd0;
                    }
                    .bdt-net-info {
                        background: rgba(100,164,255,0.2);
                        color: #c3d7ff;
                    }
                    .bdt-net-warn {
                        background: rgba(255,205,120,0.2);
                        color: #ffe7b0;
                    }
                    .bdt-net-err {
                        background: rgba(255,120,120,0.2);
                        color: #ffd0d0;
                    }
                    .bdt-net-status {
                        font-variant-numeric: tabular-nums;
                        min-width: 34px;
                    }
                    .bdt-net-url {
                        flex: 1;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .bdt-net-row-meta {
                        display: flex;
                        gap: 10px;
                        font-size: 9px;
                        color: rgba(210,210,220,0.7);
                        margin-top: 1px;
                    }
                    .bdt-net-detail {
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        font-size: 11px;
                    }
                    .bdt-net-detail-header {
                        font-size: 11px;
                        font-weight: 600;
                        word-break: break-all;
                    }
                    .bdt-net-detail-meta {
                        display: grid;
                        grid-template-columns: repeat(auto-fit,minmax(120px,1fr));
                        gap: 2px 12px;
                        font-size: 10px;
                        color: rgba(230,230,240,0.8);
                    }
                    .bdt-net-detail-body {
                        margin-top: 4px;
                        padding: 4px;
                        border-radius: 8px;
                        background: rgba(0,0,0,0.45);
                        max-height: 250px;
                        overflow: auto;
                    }
                    .bdt-net-detail-body pre {
                        white-space: pre-wrap;
                        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                        font-size: 11px;
                    }
                `;
                document.head.appendChild(s);
            }

            api.log("[networkInspector] View mounted in NETWORK tab.");
        }
    });
})();
