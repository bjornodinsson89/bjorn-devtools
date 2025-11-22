/* Plugin: Script Builder Helper
   File: plugins/builder.js
   Description: Generates robust boilerplate code for injections
*/

(function() {
    BjornDevTools.registerPlugin("builder", {
        tab: "ADVANCED", // We stack this under the Debugger in the same tab
        
        onMount: function(view, api) {
            
            // Separator
            view.appendChild(api.dom.create("div", { 
                style: { height: "1px", background: "rgba(255,255,255,0.1)", margin: "15px 0" } 
            }));

            const header = api.dom.create("div", {
                text: "🏗️ CODE GENERATOR",
                style: { 
                    padding: "10px", fontWeight: "bold", color: "#80b0ff", 
                    marginBottom: "5px" 
                }
            });
            view.appendChild(header);

            // -- INPUT: CSS Selector --
            const input = api.dom.create("input", {
                style: {
                    width: "100%", padding: "10px", background: "#111", 
                    border: "1px solid #333", color: "#fff", borderRadius: "4px", marginBottom: "10px"
                },
                attrs: { placeholder: "Enter Selector (e.g., #header > div)" }
            });
            view.appendChild(input);

            // -- ACTION: Generate Code --
            const btnGen = api.dom.create("button", {
                text: "Generate 'WaitFor' Code",
                style: {
                    width: "100%", padding: "10px", background: "#224466", 
                    color: "#fff", border: "none", borderRadius: "4px"
                },
                on: {
                    click: () => {
                        const selector = input.value || "body";
                        
                        const codeBlock = `
// --- PASTE THIS INTO YOUR SCRIPT ---
function waitFor('${selector}') {
    return new Promise(resolve => {
        if (document.querySelector('${selector}')) {
            return resolve(document.querySelector('${selector}'));
        }
        const observer = new MutationObserver(() => {
            if (document.querySelector('${selector}')) {
                resolve(document.querySelector('${selector}'));
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

waitFor('${selector}').then((elm) => {
    console.log("Found target!");
    // Your injection here
});
`;
                        api.ui.switchTab("CONSOLE");
                        api.log("✅ Code Generated! Copy below:");
                        api.log(codeBlock);
                    }
                }
            });
            view.appendChild(btnGen);
            
            // Help Text
            const help = api.dom.create("div", {
                text: "Tip: Use the Wand to get the selector, paste it here, then click Generate.",
                style: { fontSize: "10px", color: "#666", marginTop: "8px", fontStyle: "italic" }
            });
            view.appendChild(help);
        }
    });
})();

