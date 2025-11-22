// plugins/themes.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.definePlugin) return;

    DevTools.definePlugin("themes", {
        tab: null, // no dedicated tab; controlled via "theme" command

        onLoad(api) {
            const root = api.ui.getRoot();
            if (!root) return;

            const STORAGE_KEY = "__bjorn_theme";
            const THEME_CLASS_PREFIX = "bdt-theme-";

            const THEMES = {
                odin: {
                    name: "odin",
                    label: "Odin",
                    description: "Warm amber, black glass, Norse forge vibes."
                },
                dev: {
                    name: "dev",
                    label: "Dev",
                    description: "Cool blue, neutral glass, classic dev console."
                },
                matrix: {
                    name: "matrix",
                    label: "Matrix",
                    description: "Green-on-black cyber rain aesthetic."
                }
            };

            // Inject theme CSS once
            if (!document.getElementById("bdt-theme-styles")) {
                const s = document.createElement("style");
                s.id = "bdt-theme-styles";
                s.textContent = `
/* ODIN THEME (default-ish, matches your current look – warm amber) */
#bjorn-devtools.bdt-theme-odin .bdt-panel {
    background: linear-gradient(145deg, rgba(10,10,18,0.96), rgba(30,16,10,0.97));
}
#bjorn-devtools.bdt-theme-odin .bdt-header {
    background: radial-gradient(circle at 0% 0%, rgba(255,166,90,0.65), transparent 60%),
                linear-gradient(90deg, rgba(22,17,13,0.98), rgba(20,10,12,0.98));
}
#bjorn-devtools.bdt-theme-odin .bdt-logo-wrap {
    background: radial-gradient(circle at 30% 20%, rgba(255,196,120,0.95), rgba(80,38,18,1));
    box-shadow: 0 0 18px rgba(255,160,90,0.65);
}
#bjorn-devtools.bdt-theme-odin .bdt-tab.active::after {
    background: linear-gradient(90deg, #ff9a6b, #ffd27a);
}
#bjorn-devtools.bdt-theme-odin .bdt-toggle {
    border-color: rgba(255,150,90,0.85);
    color: #ffb085;
}
#bjorn-devtools.bdt-theme-odin .bdt-safe:not(.bdt-unsafe) {
    border-color: #46ff88;
    color: #c9ffdd;
}

/* DEV THEME (cool blue dev console) */
#bjorn-devtools.bdt-theme-dev .bdt-panel {
    background: radial-gradient(circle at 0 0, rgba(90,150,255,0.22), transparent 60%),
                linear-gradient(145deg, rgba(6,10,18,0.97), rgba(6,16,32,0.98));
}
#bjorn-devtools.bdt-theme-dev .bdt-header {
    background: radial-gradient(circle at 0% 0%, rgba(90,150,255,0.65), transparent 60%),
                linear-gradient(90deg, rgba(10,18,34,0.98), rgba(6,10,20,0.98));
}
#bjorn-devtools.bdt-theme-dev .bdt-logo-wrap {
    background: radial-gradient(circle at 30% 20%, rgba(140,190,255,0.95), rgba(24,44,96,1));
    box-shadow: 0 0 18px rgba(120,185,255,0.7);
}
#bjorn-devtools.bdt-theme-dev .bdt-tab.active::after {
    background: linear-gradient(90deg, #6fb6ff, #b3e0ff);
}
#bjorn-devtools.bdt-theme-dev .bdt-toggle {
    border-color: rgba(120,185,255,0.85);
    color: #a8d5ff;
}
#bjorn-devtools.bdt-theme-dev .bdt-safe:not(.bdt-unsafe) {
    border-color: #6df8ff;
    color: #cafbff;
}

/* MATRIX THEME (green cyber look) */
#bjorn-devtools.bdt-theme-matrix .bdt-panel {
    background: radial-gradient(circle at 0 0, rgba(120,255,120,0.20), transparent 60%),
                linear-gradient(145deg, rgba(0,5,0,0.98), rgba(2,18,6,0.99));
}
#bjorn-devtools.bdt-theme-matrix .bdt-header {
    background: radial-gradient(circle at 0% 0%, rgba(120,255,120,0.4), transparent 60%),
                linear-gradient(90deg, rgba(0,18,4,0.98), rgba(0,8,0,0.98));
}
#bjorn-devtools.bdt-theme-matrix .bdt-logo-wrap {
    background: radial-gradient(circle at 30% 20%, rgba(180,255,180,0.9), rgba(8,64,20,1));
    box-shadow: 0 0 18px rgba(80,255,80,0.65);
}
#bjorn-devtools.bdt-theme-matrix .bdt-tab.active::after {
    background: linear-gradient(90deg, #6cff9a, #c1ffd1);
}
#bjorn-devtools.bdt-theme-matrix .bdt-toggle {
    border-color: rgba(140,255,140,0.85);
    color: #a9ffb9;
}
#bjorn-devtools.bdt-theme-matrix .bdt-safe:not(.bdt-unsafe) {
    border-color: #74ff9a;
    color: #d4ffe0;
}

/* Shared tweaks per theme */
#bjorn-devtools[class*="bdt-theme-"] .bdt-tab.active {
    text-shadow: 0 0 8px rgba(0,0,0,0.75);
}
#bjorn-devtools[class*="bdt-theme-"] .bdt-panel.bdt-open {
    box-shadow:
        0 -24px 45px rgba(0,0,0,0.9),
        0 0 0 1px rgba(255,255,255,0.06);
}
`;
                document.head.appendChild(s);
            }

            function applyTheme(name, quiet) {
                name = (name || "").toLowerCase();
                if (!THEMES[name]) {
                    api.log(`[themes] Unknown theme: ${name}. Available: ${Object.keys(THEMES).join(", ")}`);
                    return false;
                }

                // Remove old theme classes
                Object.keys(THEMES).forEach(t => {
                    root.classList.remove(THEME_CLASS_PREFIX + t);
                });

                root.classList.add(THEME_CLASS_PREFIX + name);
                try {
                    localStorage.setItem(STORAGE_KEY, name);
                } catch (_) {}

                if (!quiet) {
                    const t = THEMES[name];
                    api.log(`[themes] Theme set to "${t.label}" (${t.name})`);
                }
                return true;
            }

            // Expose APIs for other plugins / commands
            this.setTheme = (name) => applyTheme(name, false);
            this.listThemes = () => Object.values(THEMES).map(t => ({
                id: t.name,
                label: t.label,
                description: t.description
            }));

            let initial = "odin";
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored && THEMES[stored]) {
                    initial = stored;
                }
            } catch (_) {}
            applyTheme(initial, true);
            api.log("[themes] Themes plugin loaded. Current: " + initial + ". Use: theme <odin|dev|matrix>");
        },

        onMount(view, api) {
        },

        setTheme(name) {
            const api = DevTools.api;
            api.log(`[themes] Core theme API not ready yet. Tried to set: ${name}`);
        }
    });
})();
