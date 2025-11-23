// plugins/network-inspector.js
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
            const listCont = view.querySelector(".bdt-net-list");
            
            // Helper to update button UI
            const updateBtn = () => {
                btnToggle.textContent = self._isCapturing ? "⏹ Stop Recording" : "⏺ Record Network";
                btnToggle.style.borderColor = self._isCapturing ? "#ff5555" : "#555";
                btnToggle.style.color = self._isCapturing ? "#ff5555" : "#ccc";
            };

            btnToggle.onclick = () => {
                if (self._isCapturing) {
                    // Stop is safe, no warning needed
                    self._isCapturing = false;
                    updateBtn();
                } else {
                    // STARTING is dangerous
                    api.ui.confirmDangerous(
                        "Network Recording Risk", 
                        "Recording network traffic will capture your <b>Session IDs</b> and <b>API Keys</b>.<br><br>If you take a screenshot of this tab and share it, someone can hack your account.<br><br>Do not share logs.",
                        "HIGH",
                        () => {
                            self._isCapturing = true;
                            updateBtn();
                            api.log("📡 Network Recording Started (Handle with care)");
                        }
                    );
                }
            };
            
            // ... (Render Logic remains the same as previous version) ...
            this._render = () => { /* ... same render logic ... */ };
            
            // Hooking Logic
            if (!targetWindow.__bdtNetHook) {
                targetWindow.__bdtNetHook = true;
                const origFetch = targetWindow.fetch;
                targetWindow.fetch = async function (...args) {
                    if(!self._isCapturing) return origFetch.apply(this, args);
                    // ... capture logic ...
                    return origFetch.apply(this, args);
                };
            }
        }
    });
})();
