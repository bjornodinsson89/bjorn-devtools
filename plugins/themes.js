// plugins/themes.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.definePlugin) return;

    DevTools.definePlugin("themes", {
        tab: null, 

        onLoad(api) {
            const root = api.ui.getRoot();
            if (!root) return;

            const STORAGE_KEY = "__bjorn_theme";
            const THEMES = {
                odin: { name: "odin", label: "Odin", desc: "Warm amber, Norse forge." },
                dev: { name: "dev", label: "Dev", desc: "Cool blue, standard." },
                matrix: { name: "matrix", label: "Matrix", desc: "Green cyber rain." }
            };

            if (!document.getElementById("bdt-theme-styles")) {
                const s = document.createElement("style");
                s.id = "bdt-theme-styles";
                s.textContent = `
/* ODIN */
.bdt-theme-odin .bdt-panel { background: linear-gradient(145deg, rgba(10,10,18,0.96), rgba(30,16,10,0.97)); }
.bdt-theme-odin .bdt-header { border-bottom: 1px solid rgba(255,166,90,0.2); }
.bdt-theme-odin .bdt-tab.active { color: #ffb085; }
.bdt-theme-odin .bdt-tab.active::after { background: #ffb085; }

/* DEV */
.bdt-theme-dev .bdt-panel { background: linear-gradient(145deg, rgba(10,15,25,0.96), rgba(5,10,20,0.98)); }
.bdt-theme-dev .bdt-header { border-bottom: 1px solid rgba(90,150,255,0.2); }
.bdt-theme-dev .bdt-tab.active { color: #8ccfff; }
.bdt-theme-dev .bdt-tab.active::after { background: #4facfe; }

/* MATRIX */
.bdt-theme-matrix .bdt-panel { background: linear-gradient(145deg, rgba(0,10,0,0.96), rgba(0,20,5,0.98)); }
.bdt-theme-matrix .bdt-header { border-bottom: 1px solid rgba(0,255,0,0.2); }
.bdt-theme-matrix .bdt-tab.active { color: #55ff55; }
.bdt-theme-matrix .bdt-tab.active::after { background: #00ff00; }
`;
                document.head.appendChild(s);
            }

            // Internal apply function
            const apply = (name) => {
                const key = Object.keys(THEMES).find(k => k === name) || "odin";
                Object.keys(THEMES).forEach(k => root.classList.remove("bdt-theme-" + k));
                root.classList.add("bdt-theme-" + key);
                localStorage.setItem(STORAGE_KEY, key);
                return THEMES[key];
            };

            // Public API
            this.setTheme = (name) => {
                const t = apply(name);
                api.log(`[Theme] Set to ${t.label}`);
            };

            this.next = () => {
                const current = localStorage.getItem(STORAGE_KEY) || "odin";
                const keys = Object.keys(THEMES);
                const nextIdx = (keys.indexOf(current) + 1) % keys.length;
                this.setTheme(keys[nextIdx]);
            };

            // Init
            apply(localStorage.getItem(STORAGE_KEY));
        }
    });
})();
