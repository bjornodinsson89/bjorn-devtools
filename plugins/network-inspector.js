// plugins/network-inspector.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.definePlugin) return;
    const targetWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

    DevTools.definePlugin("networkInspector", {
        tab: "NETWORK",
        _entries: [],
        _maxEntries: 100,
        _isCapturing: false, 

        onLoad(api) {
            // PATCH: Create Tab
            api.ui.addTab("NETWORK", "Network");

            const self = this;
            this._renderList = (container) => {
                if (!container) return;
                container.innerHTML = "";
                if (api.state.safeMode()) { container.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">🔒 Safe Mode is ON.<br>Network monitoring is disabled.</div>`; return; }
                if (!this._isCapturing && this._entries.length === 0) { container.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">Paused.<br>Press ⏺ to start capturing.</div>`; return; }

                this._entries.slice().reverse().forEach(e => {
                    let mColor = "#888";
                    if(e.method==="GET") mColor="#4facfe";
                    if(e.method==="POST") mColor="#43e97b";
                    if(e.method==="DELETE"||e.status>=400) mColor="#ff5555";
                    const row = api.dom.createRow([
                        { text: e.method, width: '45px', color: mColor },
                        { text: e.status, width: '35px', color: e.status >= 400 ? '#ff5555' : '#aaa' },
                        { text: e.name, width: 'auto' },
                        { text: Math.round(e.duration) + 'ms', width: '50px', color: '#666' }
                    ]);
                    row.style.cursor = "pointer";
                    row.onclick = () => self._renderDetail(e);
                    container.appendChild(row);
                });
            };

            this._renderDetail = (e) => {
                const view = api.ui.getView("NETWORK");
                const det = view.querySelector(".bdt-net-detail");
                if(!det) return;
                det.innerHTML = `
                    <div style="padding:10px; border-bottom:1px solid var(--bdt-border);">
                        <div style="color:var(--bdt-accent); font-weight:bold;">${e.method} ${e.status}</div>
                        <div style="font-size:10px; color:var(--bdt-text-dim); word-break:break-all; margin-top:4px;">${e.url}</div>
                    </div>
                    <div style="padding:10px; overflow:auto; flex:1;">
                        <pre style="font-size:10px; margin:0; white-space:pre-wrap; color:var(--bdt-text);">${e.body || "No body captured."}</pre>
                    </div>
                `;
            };

            function capture(type, method, url, status, duration, body) {
                if (api.state.safeMode() || !self._isCapturing) return;
                let name = url.split('?')[0].split('/').pop(); if (!name) name = url;
                self._entries.push({ type, method, url, name, status, duration, body, time: Date.now() });
                if (self._entries.length > self._maxEntries) self._entries.shift();
                if (api.state.currentTab() === "NETWORK") {
                    const view = api.ui.getView("NETWORK");
                    if(view) self._renderList(view.querySelector(".bdt-net-list"));
                }
            }

            if (!targetWindow.__bdtNetHook) {
                targetWindow.__bdtNetHook = true;
                const origFetch = targetWindow.fetch;
                targetWindow.fetch = async function (...args) {
                    const start = performance.now();
                    let method = "GET";
                    let url = args[0];
                    if (typeof url === 'object' && url.url) { url = url.url; method = url.method; }
                    if (args[1] && args[1].method) method = args[1].method;
                    let res; try { res = await origFetch.apply(this, args); } catch(e) { throw e; }
                    const clone = res.clone();
                    let body = ""; try { const txt = await clone.text(); body = txt.length > 1000 ? txt.slice(0,1000)+"..." : txt; } catch(e){}
                    capture("fetch", method, String(url), res.status, performance.now()-start, body);
                    return res;
                };
                const origOpen = targetWindow.XMLHttpRequest.prototype.open;
                const origSend = targetWindow.XMLHttpRequest.prototype.send;
                targetWindow.XMLHttpRequest.prototype.open = function(m, u) { this._bdtInfo = { m, u }; return origOpen.apply(this, arguments); };
                targetWindow.XMLHttpRequest.prototype.send = function(body) {
                    const start = performance.now();
                    this.addEventListener("loadend", () => {
                        let respBody = ""; try { if(this.responseType === '' || this.responseType === 'text') respBody = this.responseText.slice(0, 1000); } catch(e){}
                        capture("xhr", this._bdtInfo.m, this._bdtInfo.u, this.status, performance.now()-start, respBody);
                    });
                    return origSend.apply(this, arguments);
                };
            }
        },

        onMount(view, api) {
            const self = this;
            const style = document.createElement('style');
            style.textContent = `
                .bdt-net-layout { display: flex; height: 100%; flex-direction: column; }
                .bdt-net-toolbar { display: flex; justify-content: space-between; padding: 0 0 8px 0; border-bottom: 1px solid var(--bdt-border); }
                .bdt-net-split { display: flex; flex: 1; overflow: hidden; }
                .bdt-net-list { flex: 1; border-right: 1px solid var(--bdt-border); overflow-y: auto; }
                .bdt-net-detail { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: rgba(0,0,0,0.2); }
                .bdt-btn { background: transparent; border: 1px solid var(--bdt-border); color: var(--bdt-text); padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; }
                .bdt-btn.active { background: var(--bdt-accent); color: #000; border-color: var(--bdt-accent); }
            `;
            view.appendChild(style);

            view.innerHTML = `
                <div class="bdt-net-layout">
                    <div class="bdt-net-toolbar">
                        <div style="font-size:11px; font-weight:bold; color:var(--bdt-text-dim); padding-top:4px;">NETWORK TRAFFIC</div>
                        <div style="display:flex; gap:5px;">
                            <button id="bdt-net-toggle" class="bdt-btn">⏺ Record</button>
                            <button id="bdt-net-clear" class="bdt-btn">🚫 Clear</button>
                        </div>
                    </div>
                    <div class="bdt-net-split">
                        <div class="bdt-net-list"></div>
                        <div class="bdt-net-detail">
                            <div style="padding:20px; color:#555; text-align:center;">Select a request</div>
                        </div>
                    </div>
                </div>
            `;
            view.appendChild(style);

            const btnToggle = view.querySelector("#bdt-net-toggle");
            const btnClear = view.querySelector("#bdt-net-clear");
            const listCont = view.querySelector(".bdt-net-list");

            const updateBtn = () => {
                if (self._isCapturing) { btnToggle.textContent = "⏹ Stop"; btnToggle.classList.add("active"); } 
                else { btnToggle.textContent = "⏺ Record"; btnToggle.classList.remove("active"); }
            };
            updateBtn();

            btnToggle.onclick = () => {
                if (api.state.safeMode()) return api.log("Cannot enable Network Inspector in Safe Mode.");
                self._isCapturing = !self._isCapturing;
                updateBtn();
                self._renderList(listCont);
            };

            btnClear.onclick = () => {
                self._entries = [];
                self._renderList(listCont);
                view.querySelector(".bdt-net-detail").innerHTML = '<div style="padding:20px; color:#555; text-align:center;">Select a request</div>';
            };
            self._renderList(listCont);
        }
    });
})();
