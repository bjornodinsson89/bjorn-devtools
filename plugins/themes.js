// plugins/themes.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.definePlugin) return;

    DevTools.definePlugin("themes", {
        tab: null, 

        onLoad(api) {
            const STORAGE_KEY = "__bjorn_theme_v3";

            // THEME DEFINITIONS
            const THEMES = {
                odin: { 
                    label: "Odin (Default)", 
                    vars: {
                        '--bdt-bg': 'linear-gradient(145deg, rgba(10,10,18,0.96), rgba(30,16,10,0.97))',
                        '--bdt-bg-header': 'rgba(255,166,90,0.05)',
                        '--bdt-accent': '#ffb080',
                        '--bdt-text': '#f5f5f5',
                        '--bdt-text-dim': '#888',
                        '--bdt-border': 'rgba(255,176,128,0.15)',
                        '--bdt-font-body': 'system-ui, -apple-system, sans-serif',
                        '--bdt-font-code': "'Menlo', 'Consolas', monospace"
                    }
                },
                dev: { 
                    label: "Dev Blue", 
                    vars: {
                        '--bdt-bg': 'linear-gradient(145deg, rgba(10,15,25,0.96), rgba(5,10,20,0.98))',
                        '--bdt-bg-header': 'rgba(79, 172, 254, 0.05)',
                        '--bdt-accent': '#4facfe',
                        '--bdt-text': '#e0f0ff',
                        '--bdt-text-dim': '#6daedb',
                        '--bdt-border': 'rgba(79, 172, 254, 0.15)',
                        '--bdt-font-body': "'Segoe UI', Roboto, Helvetica, sans-serif",
                        '--bdt-font-code': "'Fira Code', 'Consolas', monospace"
                    }
                },
                matrix: { 
                    label: "Matrix", 
                    vars: {
                        '--bdt-bg': '#000000',
                        '--bdt-bg-header': 'rgba(0, 255, 0, 0.1)',
                        '--bdt-accent': '#00ff41',
                        '--bdt-text': '#00ff41',
                        '--bdt-text-dim': '#008f11',
                        '--bdt-border': '#003300',
                        '--bdt-font-body': '"Courier New", monospace',
                        '--bdt-font-code': '"Courier New", monospace'
                    }
                },
                terminal: { 
                    label: "Retro Terminal", 
                    vars: {
                        '--bdt-bg': '#1a1a1a',
                        '--bdt-bg-header': '#333',
                        '--bdt-accent': '#ffcc00',
                        '--bdt-text': '#ffcc00',
                        '--bdt-text-dim': '#997700',
                        '--bdt-border': '#555',
                        '--bdt-font-body': '"Times New Roman", serif',
                        '--bdt-font-code': '"Courier", monospace'
                    }
                }
            };

            // API
            this.setTheme = (key) => {
                const theme = THEMES[key] || THEMES.odin;
                api.ui.setThemeVars(theme.vars);
                localStorage.setItem(STORAGE_KEY, key);
                api.log(`[Theme] Applied: ${theme.label}`);
            };

            this.next = () => {
                const current = localStorage.getItem(STORAGE_KEY) || "odin";
                const keys = Object.keys(THEMES);
                const nextIdx = (keys.indexOf(current) + 1) % keys.length;
                this.setTheme(keys[nextIdx]);
            };

            api.commands.register("theme", (arg) => {
                if(!arg) this.next();
                else if(THEMES[arg]) this.setTheme(arg);
                else api.log("Available: " + Object.keys(THEMES).join(", "));
            }, "Switch themes");

            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) this.setTheme(saved);
        }
    });
})();
