(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;
    
    // Determine the target window for hooking
    const targetWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

    DevTools.registerPlugin("networkInspector", {
        tab: "networkInspector",
        _entries: [],
        _maxEntries: 50,
        _isCapturing: false, 

        onMount(view, api) {
            const self = this;
            
            // Layout
            view.innerHTML = `
                <div style="display:flex; flex-direction:column; height:100%;">
                    <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1);">
                        <button id="bdt-net-toggle" style="background:transparent; border:1px solid #555; color:#ccc; padding:4px 8px; border-radius:4px;">⏺ Record</button>
                        <button id="bdt-net-clear" style="background:transparent; border:1px solid #555; color:#ccc; padding:4px 8px; border-radius:4px;">🚫 Clear</button>
                    </div>
                    <div class="bdt-net-list" style="flex:1; overflow-y:auto;"></div>
                </div>
            `;

            const btnToggle = view.querySelector("#bdt-net-toggle");
            const btnClear = view.querySelector("#bdt-net-clear");
            const listCont = view.querySelector(".bdt-net-list");

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

            btnToggle.onclick = () => {
                this._isCapturing = !this._isCapturing;
                btnToggle.textContent = this._isCapturing ? "⏹ Stop" : "⏺ Record";
                btnToggle.style.color = this._isCapturing ? "#f55" : "#ccc";
                this._render();
            };
            
            btnClear.onclick = () => { this._entries = []; this._render(); };

            // Hooking Logic (Safe)
            if (!targetWindow.__bdtNetHook) {
                targetWindow.__bdtNetHook = true;
                const origFetch = targetWindow.fetch;
                targetWindow.fetch = async function (...args) {
                    if(!self._isCapturing) return origFetch.apply(this, args);
                    
                    const start = performance.now();
                    let url = (typeof args[0] === 'object') ? args[0].url : args[0];
                    let method = (args[1] && args[1].method) ? args[1].method : "GET";
                    
                    try { 
                        const res = await origFetch.apply(this, args); 
                        const clone = res.clone();
                        clone.text().then(txt => {
                            let name = url.includes("?") ? url.split("?")[0] : url;
                            name = name.split("/").pop() || name;
                            self._entries.push({ method, url, name, status: res.status, body: txt.substring(0,200) });
                            if(api.state.currentTab() === "networkInspector") self._render();
                        });
                        return res;
                    } catch(e) { throw e; }
                };
            }
        }
    });
})();
