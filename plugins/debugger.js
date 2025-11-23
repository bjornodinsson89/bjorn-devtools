(function() {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("debugger", {
        tab: "debugger",
        
        onMount: function(view, api) {
            const header = api.dom.create("div", {
                text: "🛠️ SCRIPT DEBUGGER",
                style: { padding: "10px", fontWeight: "bold", color: "#ffb080", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "10px" }
            });
            view.appendChild(header);

            // 1. CONSOLE SPY
            let spyActive = false;
            const originalLog = console.log;
            const originalErr = console.error;

            view.appendChild(api.dom.create("button", {
                text: "🔌 Connect Console Spy",
                style: { width: "100%", padding: "12px", marginBottom: "8px", background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" },
                on: { click: (e) => {
                    spyActive = !spyActive;
                    if (spyActive) {
                        e.target.textContent = "✅ Spy Active"; e.target.style.color = "#3dff88"; e.target.style.borderColor = "#3dff88";
                        console.log = (...a) => { api.log("📝 " + a.join(" ")); originalLog.apply(console, a); };
                        console.error = (...a) => { api.log("❌ " + a.join(" ")); originalErr.apply(console, a); };
                    } else {
                        e.target.textContent = "🔌 Connect Console Spy"; e.target.style.color = "#ccc"; e.target.style.borderColor = "rgba(255,255,255,0.1)";
                        console.log = originalLog; console.error = originalErr;
                    }
                }}
            }));

            // 2. CSP SPY
            let netActive = false;
            view.appendChild(api.dom.create("button", {
                text: "📡 CSP/Block Spy",
                style: { width: "100%", padding: "12px", marginBottom: "8px", background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" },
                on: { click: (e) => {
                    netActive = !netActive;
                    if (netActive) {
                        e.target.textContent = "✅ CSP Spy Active"; e.target.style.color = "#3dff88";
                        const origFetch = window.fetch;
                        window.fetch = async (...args) => {
                            try { const res = await origFetch(...args); return res; }
                            catch (err) { api.log(`[Blocked] ❌ ${args[0]} - ${err.message}`); throw err; }
                        };
                    } else { e.target.textContent = "⚠️ Spy Active until Reload"; }
                }}
            }));
        }
    });
})();
