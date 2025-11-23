(function() {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("domInspector", {
        tab: "domInspector",
        
        onMount: function(view, api) {
            const header = api.dom.create("div", {
                text: "🪄 DOM INSPECTOR",
                style: { padding: "10px", fontWeight: "bold", color: "#e0d0ff", marginBottom: "5px" }
            });
            view.appendChild(header);

            const btnWand = api.dom.create("button", {
                text: "Start Selector Wand",
                style: {
                    width: "100%", padding: "15px", marginBottom: "8px",
                    background: "linear-gradient(90deg, #443355, #2a2a35)", 
                    color: "#e0d0ff", border: "1px solid #665588", borderRadius: "6px", fontWeight: "bold"
                },
                on: {
                    click: () => {
                        api.ui.switchTab("CONSOLE");
                        api.log("👇 TAP any element on the page to get its Selector...");
                        
                        // Hide Bjorn temporarily
                        if(api.state.isVisible()) {
                            // We use the UI toggle command to hide it cleanly
                             const root = document.querySelector(".bdt-panel");
                             if(root) root.classList.remove("bdt-open");
                        }

                        const handler = (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            let path = [];
                            let el = e.target;
                            while (el && el.nodeName !== 'HTML') {
                                let sel = el.nodeName.toLowerCase();
                                if (el.id) { sel += '#' + el.id; path.unshift(sel); break; } 
                                else {
                                    if (el.className && typeof el.className === "string" && el.className.trim() !== "") {
                                        sel += '.' + el.className.trim().split(/\s+/).join('.');
                                    }
                                    path.unshift(sel);
                                    el = el.parentNode;
                                }
                            }
                            const cssPath = path.join(" > ");

                            // Show Bjorn
                            const root = document.querySelector(".bdt-panel");
                            if(root) root.classList.add("bdt-open");

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
            
            const btnClear = api.dom.create("button", {
                text: "Clear Highlights",
                style: { width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", color: "#ccc", border: "none", borderRadius: "4px" },
                on: { click: () => api.dom.clearHighlight() }
            });
            view.appendChild(btnClear);
        }
    });
})();
