(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("storageInspector", {
        tab: "storageInspector",
        
        onMount(view, api) {
            view.innerHTML = `
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <button id="bdt-st-local" style="flex:1; background:#333; border:none; color:#fff; padding:5px; border-radius:4px;">Local</button>
                    <button id="bdt-st-session" style="flex:1; background:#333; border:none; color:#fff; padding:5px; border-radius:4px;">Session</button>
                    <button id="bdt-st-refresh" style="width:30px; background:#444; border:none; color:#fff; border-radius:4px;">↻</button>
                </div>
                <div id="bdt-st-list" style="font-size:10px; font-family:monospace;"></div>
            `;

            const list = view.querySelector("#bdt-st-list");
            
            const render = (type) => {
                list.innerHTML = "";
                const store = (type === 'session') ? sessionStorage : localStorage;
                if(store.length === 0) { list.innerHTML = "<div style='color:#666'>Empty</div>"; return; }
                
                for(let i=0; i<store.length; i++) {
                    const k = store.key(i);
                    const v = store.getItem(k);
                    const row = document.createElement("div");
                    row.style.cssText = "padding:4px; border-bottom:1px solid rgba(255,255,255,0.05); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;";
                    row.innerHTML = `<span style="color:var(--bdt-accent)">${k}</span>: <span style="color:#888">${v}</span>`;
                    row.onclick = () => {
                        if(confirm(`Delete ${k}?`)) { store.removeItem(k); render(type); }
                    };
                    list.appendChild(row);
                }
            };

            view.querySelector("#bdt-st-local").onclick = () => render('local');
            view.querySelector("#bdt-st-session").onclick = () => render('session');
            view.querySelector("#bdt-st-refresh").onclick = () => render('local');
            
            render('local');
        }
    });
})();
