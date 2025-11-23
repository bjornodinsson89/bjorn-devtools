(function () {
    const DevTools = window.BjornDevTools || arguments[0];
    if (!DevTools) return;
    
    const targetWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

    DevTools.registerPlugin("networkInspector", {
        tab: "networkInspector",
        _entries: [],
        _isCapturing: false, 

        onMount(view, api) {
            const self = this;
            
            view.innerHTML = `
                <div style="display:flex; flex-direction:column; height:100%;">
                    <div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between;">
                         <button id="bdt-net-toggle" style="padding:6px 12px; background:#333; border:1px solid #555; color:#ccc; border-radius:4px; cursor:pointer;">⏺ Record Network</button>
                         <button id="bdt-net-clear" style="padding:6px 12px; background:transparent; border:1px solid #555; color:#ccc; border-radius:4px; cursor:pointer;">Clear</button>
                    </div>
                    <div class="bdt-net-list" style="flex:1; overflow-y:auto; font-size:11px;"></div>
                </div>
            `;

            const btnToggle = view.querySelector("#bdt-net-toggle");
            const btnClear = view.querySelector("#bdt-net-clear");
            const listCont = view.querySelector(".bdt-net-list");
            
            const updateBtn = () => {
                btnToggle.textContent = self._isCapturing ? "⏹ Stop Recording" : "⏺ Record Network";
                btnToggle.style.borderColor = self._isCapturing ? "#ff5555" : "#555";
                btnToggle.style.color = self._isCapturing ? "#ff5555" : "#ccc";
            };

            btnToggle.onclick = () => {
                if (self._isCapturing) {
                    self._isCapturing = false;
                    updateBtn();
                } else {
                    api.ui.confirmDangerous(
                        "Network Recording Risk", 
                        "Recording network traffic will capture your <b>Session IDs</b> and <b>API Keys</b>.<br><br>Do not share logs.",
                        "HIGH",
                        () => {
                            self._isCapturing = true;
                            updateBtn();
                            api.log("📡 Network Recording Started");
                        }
                    );
                }
            };

            btnClear.onclick = () => { this._entries = []; this._render(); };

            this._render = () => {
                listCont.innerHTML = "";
                if (!this._isCapturing && this._entries.length === 0) {
                    listCont.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">Paused</div>`;
                    return;
                }
                this._entries.slice().reverse().forEach(e => {
                    let c = "#888";
                    if(e.method === "GET") c = "#4facfe";
                    if(e.method === "POST") c = "#43e97b";
                    if(e.status >= 400) c = "#ff5555";
                    
                    const row = document.createElement("div");
                    row.style.cssText = "display:flex; padding:6px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:10px; cursor:pointer;";
                    row.innerHTML = `
                        <div style="width:40px; color:${c}; font-weight:bold;">${e.method}</div>
                        <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:0 5px;">${e.name}</div>
                        <div style="width:30px; text-align:right; color:${e.status>=400?'#f55':'#aaa'}">${e.status}</div>
                    `;
                    row.onclick = () => { api.ui.switchTab("CONSOLE"); api.log(`[NET] ${e.method} ${e.url}\nStatus: ${e.status}\nBody: ${e.body}`); };
                    listCont.appendChild(row);
                });
            };
            
            // Hooking Logic
            if (!targetWindow.__bdtNetHook) {
                targetWindow.__bdtNetHook = true;
                const origFetch = targetWindow.fetch;
                targetWindow.fetch = async function (...args) {
                    if(!self._isCapturing) return origFetch.apply(this, args);
                    
                    let url = (typeof args[0] === 'object') ? args[0].url : args[0];
                    let method = (args[1] && args[1].method) ? args[1].method : "GET";
                    
                    try { 
                        const res = await origFetch.apply(this, args); 
                        const clone = res.clone();
                        // Optimization: Wait for text, but handle errors
                        clone.text().then(txt => {
                            let name = url.includes("?") ? url.split("?")[0] : url;
                            name = name.split("/").pop() || name;
                            self._entries.push({ method, url, name, status: res.status, body: txt.substring(0,200) });
                            if(api.state.currentTab && api.state.currentTab() === "networkInspector") self._render();
                        }).catch(() => {});
                        return res;
                    } catch(e) { throw e; }
                };
            }
        }
    });
})();
