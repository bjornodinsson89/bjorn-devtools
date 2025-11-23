// plugins/debugger.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("debugger", {
        name: "Debugger",
        tab: "debugger",

        onLoad(api) {
            this.api = api;

            api.commands.register("events.spy", () => {
                document.addEventListener("click", e => {
                    api.log("[spy click] " + e.target.tagName);
                }, true);
                api.log("Event spy active.");
            }, "Spy on click events.");

            api.commands.register("fps", () => this.runFPS(), "Show FPS in console");

            api.commands.register("mutations", () => this.startMutations(), "Track DOM mutations");

            api.log("[debugger] ready");
        },

        runFPS() {
            let last = performance.now();
            const api = this.api;

            function tick(now) {
                const delta = now - last;
                last = now;
                api.log("FPS: " + Math.round(1000 / delta));
                requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        },

        startMutations() {
            const api = this.api;
            if (this.mo) this.mo.disconnect();

            this.mo = new MutationObserver(muts => {
                muts.forEach(m => {
                    api.log(`[mutation] ${m.type} on ${m.target.tagName}`);
                });
            });

            this.mo.observe(document.documentElement, { childList:true, subtree:true, attributes:true });
            api.log("Mutation tracking ON");
        },

        onMount(view) {
            view.innerHTML = `
                <div style="font-size:11px;">
                    <p>Debugger Tools:</p>
                    <ul>
                        <li>events.spy</li>
                        <li>fps</li>
                        <li>mutations</li>
                    </ul>
                </div>
            `;
        }
    });
})();
