// plugins/builder.js
(function() {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.definePlugin) return;

    DevTools.definePlugin("builder", {
        tab: "ADVANCED",
        
        onLoad: function(api) {
             // PATCH: Create Tab (Safe to call multiple times)
             api.ui.addTab("ADVANCED", "Advanced");
        },
        
        onMount: function(view, api) {
            // Separator
            view.appendChild(api.dom.create("div", { 
                style: { height: "1px", background: "rgba(255,255,255,0.1)", margin: "15px 0" } 
            }));

            const header = api.dom.create("div", {
                text: "🏗️ CODE GENERATOR",
                style: { padding: "10px", fontWeight: "bold", color: "#80b0ff", marginBottom: "5px" }
            });
            view.appendChild(header);

            const input = api.dom.create("input", {
                style: { width: "100%", padding: "10px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "4px", marginBottom: "10px" },
                attrs: { placeholder: "Enter Selector (e.g., #header > div)" }
            });
            view.appendChild(input);

            const btnGen = api.dom.create("button", {
                text: "Generate 'WaitFor' Code",
                style: { width: "100%", padding: "10px", background: "#224466", color: "#fff", border: "none", borderRadius: "4px" },
                on: {
                    click: () => {
                        const selector = input.value || "body";
                        const codeBlock = `
function waitFor('${selector}') {
    return new Promise(resolve => {
        if (document.querySelector('${selector}')) return resolve(document.querySelector('${selector}'));
        const observer = new MutationObserver(() => {
            if (document.querySelector('${selector}')) { resolve(document.querySelector('${selector}')); observer.disconnect(); }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}
waitFor('${selector}').then((elm) => { console.log("Found target!"); /* Code Here */ });
`;
                        api.ui.switchTab("CONSOLE");
                        api.log("✅ Code Generated! Copy below:");
                        api.log(codeBlock);
                    }
                }
            });
            view.appendChild(btnGen);
        }
    });
})();
