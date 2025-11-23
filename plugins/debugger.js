// plugins/debugger.js
(function() {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.definePlugin) return;

    DevTools.definePlugin("debugger", {
        tab: "ADVANCED",
        
        onLoad: function(api) {
            // PATCH: Create Tab
            api.ui.addTab("ADVANCED", "Advanced");
            api.log("[Debugger] Plugin loaded.");
        },

        onMount: function(view, api) {
            const header = api.dom.create("div", {
                text: "🛠️ SCRIPT DEBUGGER",
                style: { padding: "10px", fontWeight: "bold", color: "#ffb080", borderBottom: "1px solid var(--bdt-border)", marginBottom: "10px" }
            });
            view.appendChild(header);

            // Spy
            let spyActive = false;
            const originalLog = console.log, originalErr = console.error;
            view.appendChild(api.dom.create("button", {
                text: "🔌 Connect Console Spy",
                style: { width: "100%", padding: "12px", marginBottom: "8px", background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid var(--bdt-border)", borderRadius: "6px" },
                on: { click: (e) => {
                    spyActive = !spyActive;
                    if (spyActive) {
                        e.target.textContent = "✅ Spy Active"; e.target.style.color = "#3dff88"; e.target.style.borderColor = "#3dff88";
                        console.log = (...a) => { api.log("📝 " + a.join(" ")); originalLog.apply(console, a); };
                        console.error = (...a) => { api.log("❌ " + a.join(" ")); originalErr.apply(console, a); };
                    } else {
                        e.target.textContent = "🔌 Connect Console Spy"; e.target.style.color = "#ccc"; e.target.style.borderColor = "var(--bdt-border)";
                        console.log = originalLog; console.error = originalErr;
                    }
                }}
            }));

            // Net Spy
            let netActive = false;
            view.appendChild(api.dom.create("button", {
                text: "📡 Network/CSP Spy",
                style: { width: "100%", padding: "12px", marginBottom: "8px", background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid var(--bdt-border)", borderRadius: "6px" },
                on: { click: (e) => {
                    netActive = !netActive;
                    if (netActive) {
                        e.target.textContent = "✅ Network Spy Active"; e.target.style.color = "#3dff88"; e.target.style.borderColor = "#3dff88";
                        const origFetch = window.fetch;
                        window.fetch = async (...args) => {
                            api.log(`[Fetch] ⬆️ ${args[0]}`);
                            try { const res = await origFetch(...args); api.log(`[Fetch] ⬇️ ${res.status}`); return res; }
                            catch (err) { api.log(`[Fetch] ❌ FAIL: ${err.message}`); throw err; }
                        };
                    } else { e.target.textContent = "⚠️ Spy Active until Reload"; }
                }}
            }));
        }
    });
})();
