// plugins/dom-inspector.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("domInspector", {
        tab: "domInspector",
        
        // Internal state
        isInspecting: false,
        
        onLoad(api) {
            const self = this;
            
            // The Click Handler
            const handler = (e) => {
                if (!self.isInspecting) return;
                
                // Don't inspect the DevTools UI itself
                const host = document.getElementById("bjorn-devtools-host");
                if (host && host.contains(e.target)) return;
                
                e.preventDefault(); 
                e.stopPropagation();
                
                // Highlight
                api.dom.highlight(e.target);
                
                // Calculate CSS Selector
                let el = e.target, path = [];
                while (el && el.nodeType === Node.ELEMENT_NODE) {
                    let sel = el.nodeName.toLowerCase();
                    if (el.id) { 
                        sel += "#" + el.id; 
                        path.unshift(sel); 
                        break; 
                    } else {
                        let sib = el, nth = 1;
                        while (sib = sib.previousElementSibling) { 
                            if (sib.nodeName.toLowerCase() === sel) nth++; 
                        }
                        if (nth > 1) sel += ":nth-of-type(" + nth + ")";
                        path.unshift(sel); 
                        el = el.parentNode;
                    }
                }
                const selector = path.join(" > ");
                
                // Log Results
                api.ui.switchTab("CONSOLE");
                api.log("--------------------------");
                api.log(`🔍 <${e.target.tagName.toLowerCase()}>`);
                if(e.target.id) api.log(`ID: #${e.target.id}`);
                if(e.target.className) api.log(`Class: .${e.target.className.split(" ").join(".")}`);
                api.log(`Selector: ${selector}`);
                
                self.stopInspecting(api);
            };

            this.startInspecting = () => {
                if (self.isInspecting) return;
                self.isInspecting = true;
                
                // Add listeners (Capture phase to catch it first)
                document.addEventListener("click", handler, { capture: true, once: true });
                document.addEventListener("touchstart", handler, { capture: true, once: true });
                
                api.log("👉 Touch any element to inspect.");
                
                // Hide DevTools panel so you can see the page
                api.state.visible = false;
                const panel = document.querySelector(".bdt-panel");
                if(panel) panel.classList.remove("bdt-open");
                
                this.updateUI(api);
            };

            this.stopInspecting = () => {
                if (!self.isInspecting) return;
                self.isInspecting = false;
                document.removeEventListener("click", handler, { capture: true });
                document.removeEventListener("touchstart", handler, { capture: true });
                api.dom.clearHighlight();
                
                // Re-show DevTools
                api.state.visible = true;
                const panel = document.querySelector(".bdt-panel");
                if(panel) panel.classList.add("bdt-open");
                
                this.updateUI(api);
            };
            
            // Register command
            api.commands.register("inspect", this.startInspecting, "Start touch-to-select inspector.");
        },

        updateUI(api) {
            const view = api.ui.getView("domInspector");
            if (!view) return;
            const startBtn = view.querySelector("#bdt-inspector-start");
            const stopBtn = view.querySelector("#bdt-inspector-stop");
            if(startBtn && stopBtn) {
                if (this.isInspecting) { 
                    startBtn.style.display = "none"; 
                    stopBtn.style.display = "inline-block"; 
                } else { 
                    startBtn.style.display = "inline-block"; 
                    stopBtn.style.display = "none"; 
                }
            }
        },

        onMount(view, api) {
            view.innerHTML = `
                <div style="padding: 10px; text-align: center;">
                    <div style="font-weight:bold; color:#e0d0ff; margin-bottom:10px;">🪄 DOM WAND</div>
                    <p style="margin-bottom: 15px; color: var(--bdt-text-dim); font-size:12px;">
                        Tap "Start", then touch an element on the page to get its CSS selector.
                    </p>
                    <button id="bdt-inspector-start" style="width:100%; padding: 12px; background: #46ff88; color: #000; border: none; border-radius: 6px; font-weight: bold; font-size: 14px; cursor:pointer;">Start Inspecting</button>
                    <button id="bdt-inspector-stop" style="width:100%; display: none; padding: 12px; background: #ff5e5e; color: #fff; border: none; border-radius: 6px; font-weight: bold; font-size: 14px; cursor:pointer;">Cancel</button>
                </div>
            `;
            view.querySelector("#bdt-inspector-start").onclick = () => this.startInspecting();
            view.querySelector("#bdt-inspector-stop").onclick = () => this.stopInspecting();
            this.updateUI(api);
        }
    });
})();
