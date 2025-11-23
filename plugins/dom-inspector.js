// plugins/dom-inspector.js
(function () {
    const DevTools = window.BjornDevTools || arguments[0];
    if (!DevTools) return;

    DevTools.registerPlugin("domInspector", {
        tab: "domInspector",
        
        onMount: function(view, api) {
            // 1. Header
            const header = api.dom.create("div", {
                text: "🪄 DOM INSPECTOR",
                style: { padding: "10px", fontWeight: "bold", color: "#e0d0ff", marginBottom: "5px" }
            });
            view.appendChild(header);

            // 2. The Logic
            const startInspection = () => {
                api.ui.switchTab("CONSOLE");
                api.log("👇 TAP any element on the page to get its Selector...");
                
                // Hide the panel so we can see the page
                api.state.visible = false;
                const root = document.querySelector(".bdt-panel");
                if(root) root.classList.remove("bdt-open");

                const handler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Calculate Selector
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

                    // Re-open Panel
                    api.state.visible = true;
                    if(root) root.classList.add("bdt-open");

                    api.log("--- 🎯 TARGET LOCKED ---");
                    api.log(`Tag: <${e.target.tagName.toLowerCase()}>`);
                    api.log(`Selector: ${cssPath}`);
                    
                    // Attempt highlight if API supports it, otherwise just log
                    if(api.dom.highlight) api.dom.highlight(e.target);
                    else e.target.style.outline = "2px solid red"; // Fallback

                    document.removeEventListener("click", handler, true);
                };

                // Listen once, capturing phase
                document.addEventListener("click", handler, { capture: true, once: true });
            };

            // 3. Start Button
            const btnWand = api.dom.create("button", {
                text: "Start Selector Wand",
                style: {
                    width: "100%", padding: "15px", marginBottom: "8px",
                    background: "linear-gradient(90deg, #443355, #2a2a35)", 
                    color: "#e0d0ff", border: "1px solid #665588", borderRadius: "6px", fontWeight: "bold", cursor: "pointer"
                },
                on: { click: startInspection }
            });
            view.appendChild(btnWand);
            
            // 4. Clear Button
            const btnClear = api.dom.create("button", {
                text: "Clear Highlights",
                style: { width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", color: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" },
                on: { click: () => {
                    if(api.dom.clearHighlight) api.dom.clearHighlight();
                    // Fallback clear if api.dom.clearHighlight isn't in core
                    document.querySelectorAll('*').forEach(el => el.style.outline = '');
                }}
            });
            view.appendChild(btnClear);
        }
    });
})();
