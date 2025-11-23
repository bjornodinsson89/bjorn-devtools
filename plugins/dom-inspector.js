// plugins/dom-inspector.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("domInspector", {
        name: "DOM",
        tab: "domInspector",

        onLoad(api) {
            this.api = api;
            this.overlay = this.makeOverlay();
        },

        makeOverlay() {
            const o = document.createElement("div");
            o.style.cssText = `
                position:fixed;z-index:2147483646;pointer-events:none;
                border:2px solid #6fb6ff;border-radius:4px;
                box-shadow:0 0 10px rgba(111,182,255,0.6);
                display:none;
            `;
            document.body.appendChild(o);
            return o;
        },

        showOverlay(el) {
            const r = el.getBoundingClientRect();
            this.overlay.style.left = r.left + "px";
            this.overlay.style.top = r.top + "px";
            this.overlay.style.width = r.width + "px";
            this.overlay.style.height = r.height + "px";
            this.overlay.style.display = "block";
        },

        hideOverlay() { this.overlay.style.display = "none"; },

        onMount(view) {
            view.innerHTML = `
                <button class="bdt-dom-pick">Start Picker</button>
                <div class="bdt-dom-out" style="margin-top:8px;font-size:11px;"></div>
            `;

            const out = view.querySelector(".bdt-dom-out");
            const pickBtn = view.querySelector(".bdt-dom-pick");
            let picking = false;

            pickBtn.onclick = () => {
                picking = !picking;
                pickBtn.textContent = picking ? "Stop Picker" : "Start Picker";
                if (!picking) this.hideOverlay();
            };

            document.addEventListener("mousemove", (e) => {
                if (!picking) return;
                const el = document.elementFromPoint(e.clientX, e.clientY);
                if (!el) return;
                this.showOverlay(el);
                out.textContent = this.describe(el);
            });
        },

        describe(el) {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? "#" + el.id : "";
            const cls = el.className ? "." + el.className.trim().replace(/\s+/g, ".") : "";
            return `${tag}${id}${cls}`;
        }
    });
})();
