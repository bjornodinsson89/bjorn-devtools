// plugins/debugger.js
(function() {
    const DevTools = window.BjornDevTools || arguments[0];
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
            view.appendChild(api.dom.create("button", {
                text: "🔌 Connect Console Spy",
                style: { width: "100%", padding: "12px", marginBottom: "8px", background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", cursor: "pointer" },
                on: { click: (e) => {
                    if (spyActive) {
                        // Turning off is fine
                        spyActive = false;
                        e.target.textContent = "🔌 Connect Console Spy"; e.target.style.color = "#ccc";
                        location.reload(); // Usually safest to reload to unhook
                    } else {
                        api.ui.confirmDangerous(
                            "Console Injection",
                            "This wraps the native browser Console object.<br><br><b>Risk:</b> Some games check if the console has been tampered with. This is detectable by sophisticated anti-cheat.",
                            "MEDIUM",
                            () => {
                                spyActive = true;
                                e.target.textContent = "✅ Spy Active (Reload to clear)"; e.target.style.color = "#3dff88";
                                const origLog = console.log;
                                console.log = (...a) => { api.log("📝 " + a.join(" ")); origLog.apply(console, a); };
                            }
                        );
                    }
                }}
            }));
        }
    });
})();
