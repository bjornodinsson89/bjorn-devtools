(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("themes", {
        tab: null, 
        onLoad(api) {
            const THEMES = {
                odin: { 
                    vars: { '--bdt-bg': '#121218', '--bdt-accent': '#ffb080', '--bdt-text': '#f5f5f5' }
                },
                matrix: { 
                    vars: { '--bdt-bg': '#000', '--bdt-accent': '#00ff41', '--bdt-text': '#00ff41', '--bdt-border': '#003300' }
                },
                ocean: { 
                    vars: { '--bdt-bg': '#0f172a', '--bdt-accent': '#38bdf8', '--bdt-text': '#e2e8f0', '--bdt-border': '#1e293b' }
                }
            };

            this.next = () => {
                const keys = Object.keys(THEMES);
                const current = localStorage.getItem("__bjorn_theme_idx") || 0;
                const nextIdx = (parseInt(current) + 1) % keys.length;
                
                api.ui.setThemeVars(THEMES[keys[nextIdx]].vars);
                localStorage.setItem("__bjorn_theme_idx", nextIdx);
                api.log(`[Theme] ${keys[nextIdx]}`);
            };

            api.commands.register("theme", () => this.next(), "Cycle Theme");
        }
    });
})();
