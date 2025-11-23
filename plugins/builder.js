// plugins/builder.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("builder", {
        name: "Builder",
        tab: "builder",

        onLoad(api) { this.api = api; },

        onMount(view) {
            view.innerHTML = `
                <textarea class="bdt-b-code" style="width:100%;height:40%;background:#000;color:#fff;font-family:monospace;padding:6px;"></textarea>
                <button class="bdt-b-run" style="margin:8px 0;">Run</button>
                <iframe class="bdt-b-frame" style="width:100%;height:50%;background:white;border:1px solid #333;"></iframe>
            `;

            const code = view.querySelector(".bdt-b-code");
            const run = view.querySelector(".bdt-b-run");
            const frame = view.querySelector(".bdt-b-frame");

            run.onclick = () => {
                const doc = frame.contentDocument;
                const html = code.value;

                try {
                    doc.open();
                    doc.write(html);
                    doc.close();
                    this.api.log("[builder] executed");
                } catch (e) {
                    this.api.log("[builder ERR] " + e.message);
                }
            };
        }
    });
})();
