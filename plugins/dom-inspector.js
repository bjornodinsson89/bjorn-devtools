/*
 * DOM Inspector Plugin
 */
(function () {
    "use strict";

    // State
    let isInspecting = false;
    let lastHighlightedElement = null;
    let viewContainer = null;
    let startBtn = null;
    let stopBtn = null;
    let devToolsApi = null;

    // --- Helper to build a unique-ish CSS selector ---
    function getCssSelector(el) {
        if (!(el instanceof Element)) return;
        const path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += "#" + el.id;
                path.unshift(selector);
                // IDs are unique, so we can stop here
                break;
            } else {
                let sib = el, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.nodeName.toLowerCase() === selector) nth++;
                }
                if (nth > 1) selector += ":nth-of-type(" + nth + ")";
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(" > ");
    }

    // --- The Touch Handler ---
    // This runs on EVERY tap on the page while inspecting
    function inspectorClickHandler(e) {
        if (!isInspecting) return;

        // Don't select the DevTools itself
        const devToolsHost = document.getElementById("bjorn-devtools-host");
        if (devToolsHost && devToolsHost.contains(e.target)) return;
        
        e.preventDefault();
        e.stopPropagation();

        const target = e.target;
        lastHighlightedElement = target;

        // 1. Visual feedback
        devToolsApi.dom.highlight(target);

        // 2. Calculate data
        const selector = getCssSelector(target);
        const tagName = target.tagName.toLowerCase();
        const id = target.id ? `#${target.id}` : "no-id";
        const classes = target.className ? `.${target.className.split(" ").join(".")}` : "no-classes";

        // 3. Dump to console
        devToolsApi.log("--------------------------");
        devToolsApi.log(`🔍 INSPECTED: <${tagName}>`);
        devToolsApi.log(`ID: ${id}`);
        devToolsApi.log(`Class: ${classes}`);
        devToolsApi.log(`Selector: ${selector}`);
        
        // Optional: Put selector in clipboard (mobile browser support varies)
        try {
             navigator.clipboard.writeText(selector);
             devToolsApi.log("✨ Selector copied to clipboard!");
        } catch (err) { /* ignore */ }

        // Automatically stop inspecting after one pick (mobile workflow is better this way)
        stopInspecting();
    }

    // --- Control Functions ---
    function startInspecting() {
        if (isInspecting) return;
        isInspecting = true;
        
        // Add global listener to capture taps anywhere
        document.addEventListener("click", inspectorClickHandler, { capture: true, once: true });
        document.addEventListener("touchstart", inspectorClickHandler, { capture: true, once: true });
        
        updateUI();
        devToolsApi.log("👉 Touch any element on the page to select it.");
        // Switch to console automatically to see the result
        devToolsApi.ui.switchTab("CONSOLE");
    }

    function stopInspecting() {
        if (!isInspecting) return;
        isInspecting = false;

        // Clean up listeners (just in case 'once' didn't trigger)
        document.removeEventListener("click", inspectorClickHandler, { capture: true });
        document.removeEventListener("touchstart", inspectorClickHandler, { capture: true });

        devToolsApi.dom.clearHighlight();
        updateUI();
    }

    function updateUI() {
        if (isInspecting) {
            startBtn.style.display = "none";
            stopBtn.style.display = "inline-block";
        } else {
            startBtn.style.display = "inline-block";
            stopBtn.style.display = "none";
        }
    }

    // --- Bjorn Plugin Definition ---
    window.BjornDevTools.registerPlugin("domInspector", {
        tab: "ELEMENTS",

        // Called once when plugin is loaded
        onLoad: function (api) {
            devToolsApi = api;
            api.commands.register("inspect", startInspecting, "Start touch-to-select inspector.");
        },

        // Called every time the 'ELEMENTS' tab is opened
        onMount: function (view, api) {
            viewContainer = view;
            
            // Simple UI for the tab
            view.innerHTML = `
                <div style="padding: 10px; text-align: center;">
                    <p style="margin-bottom: 15px; color: #ccc;">
                        Tap "Start", then touch an element on the page to get its CSS selector.
                    </p>
                    <button id="bdt-inspector-start" style="
                        padding: 10px 20px;
                        background: #46ff88; color: #000;
                        border: none; border-radius: 6px;
                        font-weight: bold; font-size: 14px;
                    ">Start Inspecting</button>

                    <button id="bdt-inspector-stop" style="
                        display: none;
                        padding: 10px 20px;
                        background: #ff5e5e; color: #fff;
                        border: none; border-radius: 6px;
                        font-weight: bold; font-size: 14px;
                    ">Cancel</button>
                </div>
            `;

            startBtn = view.querySelector("#bdt-inspector-start");
            stopBtn = view.querySelector("#bdt-inspector-stop");

            startBtn.onclick = startInspecting;
            stopBtn.onclick = stopInspecting;

            updateUI();
        }
    });

})();

