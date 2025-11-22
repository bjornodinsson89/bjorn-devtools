/* Plugin: Debugger Kit
   Description: Console Spy, Network Spy, and DOM Selector Wand
*/

(function() {
    BjornDevTools.registerPlugin("debugger", {
        tab: "ADVANCED",
        
        onLoad: function(api) {
            api.log("[Debugger] Plugin loaded.");
        },

        onMount: function(view, api) {
            // -- SECTION HEADER --
            const header = api.dom.create("div", {
                text: "🛠️ SCRIPT DEBUGGER",
                style: { 
                    padding: "10px", fontWeight: "bold", color: "#ffb080", 
                    borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "10px" 
                }
            });
            view.appendChild(header);

            // -- 1. CONSOLE SPY --
            // Captures logs from other scripts and shows them in Bjorn
            let spyActive = false;
            const originalLog = console.log;
            const originalErr = console.error;

            const btnSpy = api.dom.create("button", {
                text: "🔌 Connect Console Spy",
                style: {
                    width: "100%", padding: "12px", marginBottom: "8px",
                    background: "#2a2a35", color: "#ccc", border: "1px solid #444", borderRadius: "6px"
                },
                on: {
                    click: (e) => {
                        spyActive = !spyActive;
                        const btn = e.target;
                        if (spyActive) {
                            btn.textContent = "✅ Spy Active (Check Console Tab)";
                            btn.style.borderColor = "#3dff88";
                            btn.style.color = "#3dff88";
                            
                            console.log = (...args) => {
                                api.log("📝 " + args.join(" "));
                                originalLog.apply(console, args);
                            };
                            console.error = (...args) => {
                                api.log("❌ " + args.join(" "));
                                originalErr.apply(console, args);
                            };
                        } else {
                            btn.textContent = "🔌 Connect Console Spy";
                            btn.style.borderColor = "#444";
                            btn.style.color = "#ccc";
                            console.log = originalLog;
                            console.error = originalErr;
                        }
                    }
                }
            });
            view.appendChild(btnSpy);

            // -- 2. NETWORK SPY --
            // Checks if your other scripts are getting blocked by CSP
            let netActive = false;
            const btnNet = api.dom.create("button", {
                text: "📡 Network/CSP Spy",
                style: {
                    width: "100%", padding: "12px", marginBottom: "8px",
                    background: "#2a2a35", color: "#ccc", border: "1px solid #444", borderRadius: "6px"
                },
                on: {
                    click: (e) => {
                        netActive = !netActive;
                        const btn = e.target;
                        if (netActive) {
                            btn.textContent = "✅ Network Spy Active";
                            btn.style.borderColor = "#3dff88";
                            btn.style.color = "#3dff88";
                            
                            const origFetch = window.fetch;
                            window.fetch = async (...args) => {
                                api.log(`[Fetch] ⬆️ ${args[0]}`);
                                try {
                                    const res = await origFetch(...args);
                                    api.log(`[Fetch] ⬇️ ${res.status} ${res.statusText}`);
                                    return res;
                                } catch (err) {
                                    api.log(`[Fetch] ❌ BLOCKED/FAIL: ${err.message}`);
                                    throw err;
                                }
                            };
                        } else {
                            // Note: Hard to un-patch fetch safely without reload, 
                            // but we update UI to show "state"
                            btn.textContent = "⚠️ Spy Active until Reload";
                        }
                    }
                }
            });
            view.appendChild(btnNet);

            // -- 3. SELECTOR WAND --
            // Tapping an element gives you the code to select it
            const btnWand = api.dom.create("button", {
                text: "🪄 Selector Wand",
                style: {
                    width: "100%", padding: "12px", marginBottom: "8px",
                    background: "linear-gradient(90deg, #443355, #2a2a35)", 
                    color: "#e0d0ff", border: "1px solid #665588", borderRadius: "6px"
                },
                on: {
                    click: () => {
                        api.ui.switchTab("CONSOLE");
                        api.log("👇 TAP any element on the page to get its Selector...");
                        
                        // Hide Bjorn temporarily
                        api.state.visible = false;
                        document.querySelector(".bdt-panel").classList.remove("bdt-open");

                        const handler = (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Logic to build the path
                            let path = [];
                            let el = e.target;
                            while (el && el.nodeName !== 'HTML') {
                                let sel = el.nodeName.toLowerCase();
                                if (el.id) {
                                    sel += '#' + el.id;
                                    path.unshift(sel);
                                    break;
                                } else {
                                    if (el.className && typeof el.className === "string" && el.className.trim() !== "") {
                                        sel += '.' + el.className.trim().split(/\s+/).join('.');
                                    }
                                    path.unshift(sel);
                                    el = el.parentNode;
                                }
                            }
                            const cssPath = path.join(" > ");

                            // Show Bjorn
                            api.state.visible = true;
                            document.querySelector(".bdt-panel").classList.add("bdt-open");

                            api.log("--- 🎯 TARGET LOCKED ---");
                            api.log(`Selector: ${cssPath}`);
                            api.dom.highlight(e.target);
                            
                            document.removeEventListener("click", handler, true);
                        };
                        document.addEventListener("click", handler, { capture: true, once: true });
                    }
                }
            });
            view.appendChild(btnWand);
        }
    });
})();

