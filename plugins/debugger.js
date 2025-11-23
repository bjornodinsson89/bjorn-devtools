(function() {
    const DevTools = (typeof __CORE__ !== "undefined" ? __CORE__ : window.BjornDevTools);
    if (!DevTools) return;

    DevTools.registerPlugin("debugger", {
        tab: "debugger",
        
        onMount: function(view, api) {
            const header = api.dom.create("div", {
                text: "🛠️ SCRIPT DEBUGGER",
                style: { padding: "10px", fontWeight: "bold", color: "#ffb080", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "10px" }
            });
            view.appendChild(header);

            // --- 1. CONSOLE SPY ---
            let spyActive = false;
            // We do NOT capture originalLog here globally to avoid touching it early.
            // We capture it only when needed or use window.console directly.
            let originalLog = null;
            let originalErr = null;

            view.appendChild(api.dom.create("button", {
                text: "🔌 Connect Console Spy",
                style: { width: "100%", padding: "12px", marginBottom: "8px", background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", cursor: "pointer" },
                on: { click: (e) => {
                    if (spyActive) {
                        // Deactivate / Restore
                        spyActive = false;
                        if(originalLog) console.log = originalLog;
                        if(originalErr) console.error = originalErr;
                        
                        e.target.textContent = "🔌 Connect Console Spy"; 
                        e.target.style.color = "#ccc"; e.target.style.borderColor = "rgba(255,255,255,0.1)";
                        api.log("Console restored.");
                    } else {
                        // Activate
                        api.ui.confirmDangerous("Hook Console?", "This wraps console.log. Games may detect this modification.", "MEDIUM", () => {
                            spyActive = true;
                            // Capture originals NOW
                            originalLog = console.log;
                            originalErr = console.error;
                            
                            e.target.textContent = "✅ Spy Active"; 
                            e.target.style.color = "#3dff88"; e.target.style.borderColor = "#3dff88";
                            
                            console.log = (...a) => { api.log("📝 " + a.join(" ")); originalLog.apply(console, a); };
                            console.error = (...a) => { api.log("❌ " + a.join(" ")); originalErr.apply(console, a); };
                        });
                    }
                }}
            }));

            // --- 2. CSP SPY ---
            let netActive = false;
            let originalFetchSpy = null;

            view.appendChild(api.dom.create("button", {
                text: "📡 CSP/Block Spy",
                style: { width: "100%", padding: "12px", marginBottom: "8px", background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", cursor: "pointer" },
                on: { click: (e) => {
                    if (netActive) {
                        // We cannot easily "unhook" this one cleanly without a reload usually, 
                        // but we can stop the logging logic.
                         api.log("CSP Spy cannot be fully unloaded without reload.");
                         netActive = false;
                         e.target.textContent = "⚠️ Inactive (Reload to clear)";
                         e.target.style.color = "#ffcc00";
                    } else {
                        api.ui.confirmDangerous("Hook Fetch for CSP?", "Wraps window.fetch to detect blocked requests.", "MEDIUM", () => {
                            netActive = true;
                            e.target.textContent = "✅ CSP Spy Active"; e.target.style.color = "#3dff88";
                            
                            originalFetchSpy = window.fetch;
                            window.fetch = async (...args) => {
                                try { 
                                    // If we turned it off, just pass through
                                    if(!netActive) return originalFetchSpy(...args);

                                    const res = await originalFetchSpy(...args); 
                                    return res; 
                                }
                                catch (err) { 
                                    if(netActive) api.log(`[Blocked] ❌ ${args[0]} - ${err.message}`); 
                                    throw err; 
                                }
                            };
                        });
                    }
                }}
            }));
        }
    });
})();
