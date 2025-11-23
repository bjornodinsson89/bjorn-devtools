// plugins/storage-inspector.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.definePlugin) return;

    DevTools.definePlugin("storageInspector", {
        tab: "STORAGE",
        _mode: "local",
        _filter: "",
        _selectedKey: null,
        
        onLoad(api) {
            // PATCH: Create Tab
            api.ui.addTab("STORAGE", "Storage");

            const hookStorage = (type) => {
                const proto = window[type + "Storage"];
                if(!proto) return;
                const origSet = proto.setItem, origRemove = proto.removeItem, origClear = proto.clear;
                const dispatch = () => {
                    const view = api.ui.getView("STORAGE");
                    if(view) view.dispatchEvent(new CustomEvent("bdt-storage-update"));
                };
                proto.setItem = function(k, v) { const r = origSet.apply(this, arguments); dispatch(); return r; };
                proto.removeItem = function(k) { const r = origRemove.apply(this, arguments); dispatch(); return r; };
                proto.clear = function() { const r = origClear.apply(this, arguments); dispatch(); return r; };
            };
            try { hookStorage("local"); hookStorage("session"); } catch(e) {}
        },

        onMount(view, api) {
            const self = this;
            if (!document.getElementById("bdt-storage-css")) {
                const s = document.createElement("style");
                s.id = "bdt-storage-css";
                s.textContent = `
                    .bdt-st-layout { display: flex; flex-direction: column; height: 100%; gap: 10px; }
                    .bdt-st-toolbar { display: flex; gap: 8px; align-items: center; border-bottom: 1px solid var(--bdt-border); padding-bottom: 8px; }
                    .bdt-st-mode-btn { background: transparent; border: 1px solid var(--bdt-border); color: var(--bdt-text-dim); padding: 4px 8px; font-size: 10px; border-radius: 4px; cursor: pointer; text-transform: uppercase; font-weight: bold; }
                    .bdt-st-mode-btn.active { background: var(--bdt-accent); color: #000; border-color: var(--bdt-accent); }
                    .bdt-st-search { background: rgba(0,0,0,0.3); border: 1px solid var(--bdt-border); color: var(--bdt-text); padding: 4px 8px; border-radius: 4px; font-size: 11px; flex: 1; outline: none; font-family: var(--bdt-font-code); }
                    .bdt-st-usage { height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-top: -5px; }
                    .bdt-st-usage-bar { height: 100%; background: var(--bdt-accent); width: 0%; transition: width 0.5s; }
                    .bdt-st-split { display: flex; flex: 1; overflow: hidden; border: 1px solid var(--bdt-border); border-radius: 6px; }
                    .bdt-st-list { flex: 1; overflow-y: auto; border-right: 1px solid var(--bdt-border); background: rgba(0,0,0,0.2); }
                    .bdt-st-editor { flex: 1; display: flex; flex-direction: column; background: rgba(0,0,0,0.4); padding: 10px; overflow: hidden; }
                    .bdt-st-row { padding: 6px 8px; border-bottom: 1px solid var(--bdt-border); cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
                    .bdt-st-row:hover { background: rgba(255,255,255,0.05); }
                    .bdt-st-row.selected { background: rgba(255,255,255,0.1); border-left: 3px solid var(--bdt-accent); }
                    .bdt-st-key { font-family: var(--bdt-font-code); font-size: 11px; color: var(--bdt-accent); max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
                    .bdt-st-val-prev { font-family: var(--bdt-font-code); font-size: 10px; color: var(--bdt-text-dim); max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    .bdt-st-edit-area { flex: 1; background: transparent; border: none; color: var(--bdt-text); font-family: var(--bdt-font-code); font-size: 11px; outline: none; resize: none; white-space: pre; }
                    .bdt-st-actions { display: flex; justify-content: space-between; margin-top: 10px; }
                    .bdt-btn-action { padding: 4px 12px; border-radius: 4px; border: 1px solid var(--bdt-border); background: rgba(255,255,255,0.05); color: var(--bdt-text); cursor: pointer; font-size: 10px; }
                    .bdt-btn-save { background: var(--bdt-accent); color: #000; border-color: var(--bdt-accent); }
                    .bdt-btn-del { color: #ff5555; border-color: rgba(255,85,85,0.3); }
                `;
                document.head.appendChild(s);
            }

            view.innerHTML = `
                <div class="bdt-st-layout">
                    <div class="bdt-st-toolbar">
                        <button class="bdt-st-mode-btn active" data-mode="local">Local</button>
                        <button class="bdt-st-mode-btn" data-mode="session">Session</button>
                        <button class="bdt-st-mode-btn" data-mode="cookie">Cookie</button>
                        <input class="bdt-st-search" placeholder="Filter...">
                        <button class="bdt-st-mode-btn" id="bdt-st-refresh">↻</button>
                    </div>
                    <div class="bdt-st-usage"><div class="bdt-st-usage-bar"></div></div>
                    <div class="bdt-st-split">
                        <div class="bdt-st-list"></div>
                        <div class="bdt-st-editor">
                            <textarea class="bdt-st-edit-area" placeholder="Select item..."></textarea>
                            <div class="bdt-st-actions">
                                <button class="bdt-btn-action bdt-btn-del">Delete</button>
                                <button class="bdt-btn-action bdt-btn-save">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const listEl = view.querySelector(".bdt-st-list"), editArea = view.querySelector(".bdt-st-edit-area"), usageBar = view.querySelector(".bdt-st-usage-bar");
            
            const getStorage = () => {
                if (self._mode === "local") return localStorage;
                if (self._mode === "session") return sessionStorage;
                if (self._mode === "cookie") return {
                    length: document.cookie ? document.cookie.split(';').length : 0,
                    key: (i) => { const c = document.cookie.split(';')[i]; return c ? c.split('=')[0].trim() : null; },
                    getItem: (k) => { const v = document.cookie.match('(^|;)\\s*' + k + '\\s*=\\s*([^;]+)'); return v ? v.pop() : null; },
                    setItem: (k, v) => { document.cookie = `${k}=${v}; path=/`; },
                    removeItem: (k) => { document.cookie = `${k}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`; }
                };
            };

            const calculateUsage = () => {
                if (self._mode === 'cookie') { usageBar.style.width = '0%'; return; }
                let total = 0; const store = getStorage();
                for(let x in store) { if(store.hasOwnProperty(x)) total += ((store[x].length + x.length) * 2); }
                const percent = Math.min(100, (total / 5242880) * 100);
                usageBar.style.width = percent + "%"; usageBar.style.background = percent > 90 ? "#ff5555" : "var(--bdt-accent)";
            };

            const renderList = () => {
                listEl.innerHTML = ""; const store = getStorage(); if (!store) return;
                const keys = [];
                if (self._mode === "cookie") { if (document.cookie) document.cookie.split(';').forEach(c => keys.push(c.split('=')[0].trim())); } 
                else { for (let i = 0; i < store.length; i++) keys.push(store.key(i)); }
                keys.sort().forEach(key => {
                    if (self._filter && !key.toLowerCase().includes(self._filter.toLowerCase())) return;
                    const val = store.getItem(key);
                    const row = document.createElement("div");
                    row.className = "bdt-st-row" + (self._selectedKey === key ? " selected" : "");
                    row.innerHTML = `<div class="bdt-st-key">${key}</div><div class="bdt-st-val-prev">${val ? val.substring(0, 15) : "null"}...</div>`;
                    row.onclick = () => selectItem(key, val);
                    listEl.appendChild(row);
                });
                calculateUsage();
            };

            const selectItem = (key, val) => {
                self._selectedKey = key; renderList();
                try { editArea.value = JSON.stringify(JSON.parse(val), null, 2); } catch (e) { editArea.value = val; }
            };

            view.querySelectorAll(".bdt-st-mode-btn[data-mode]").forEach(btn => {
                btn.onclick = () => {
                    view.querySelectorAll(".bdt-st-mode-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active"); self._mode = btn.dataset.mode; self._selectedKey = null; editArea.value = ""; renderList();
                };
            });

            view.querySelector(".bdt-st-search").oninput = (e) => { self._filter = e.target.value; renderList(); };
            view.querySelector("#bdt-st-refresh").onclick = () => renderList();
            view.addEventListener("bdt-storage-update", () => renderList());
            
            view.querySelector(".bdt-btn-save").onclick = () => {
                if (!self._selectedKey || api.state.safeMode()) return;
                let val = editArea.value; try { val = JSON.stringify(JSON.parse(val)); } catch(e){}
                getStorage().setItem(self._selectedKey, val); renderList();
            };
            view.querySelector(".bdt-btn-del").onclick = () => {
                if (!self._selectedKey || api.state.safeMode()) return;
                if (confirm(`Delete "${self._selectedKey}"?`)) { getStorage().removeItem(self._selectedKey); self._selectedKey = null; editArea.value = ""; renderList(); }
            };

            renderList();
            self._interval = setInterval(() => { if (self._mode === 'cookie' && api.state.isVisible()) renderList(); }, 2000);
        }
    });
})();
