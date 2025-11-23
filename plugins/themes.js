// plugins/themes.js — patched for stability and UX
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("themes", {
        name: "Themes",
        tab: null,

        onLoad(api) {
            this.api = api;
            this.root = api.ui.getRoot(); // shadow root host

            /*===========================================================
            =  THEME DEFINITIONS
            ===========================================================*/
            this.THEMES = {
                odin: {
                    "--bdt-bg": "#18130f",
                    "--bdt-accent": "#ffae72",
                    "--bdt-text": "#ffe7d0",
                    "--bdt-border": "rgba(255,170,120,0.25)"
                },
                dev: {
                    "--bdt-bg": "#0c1220",
                    "--bdt-accent": "#6fb6ff",
                    "--bdt-text": "#e6f0ff",
                    "--bdt-border": "rgba(120,180,255,0.25)"
                },
                matrix: {
                    "--bdt-bg": "#001000",
                    "--bdt-accent": "#6fff88",
                    "--bdt-text": "#c4ffce",
                    "--bdt-border": "rgba(120,255,180,0.25)"
                },
                light: {
                    "--bdt-bg": "#fafafa",
                    "--bdt-accent": "#5b8cff",
                    "--bdt-text": "#111",
                    "--bdt-border": "rgba(0,0,0,0.2)"
                },
                hacker: {
                    "--bdt-bg": "#000",
                    "--bdt-accent": "#33ff33",
                    "--bdt-text": "#00ff88",
                    "--bdt-border": "rgba(0,255,120,0.3)"
                }
            };

            /*===========================================================
            =  APPLY THEME
            ===========================================================*/
            this.applyTheme = (name) => {
                if (!name) {
                    this.api.log("Usage: theme <name>");
                    return;
                }

                const vars = this.THEMES[name];
                if (!vars) {
                    this.api.log("Unknown theme: " + name);
                    this.api.log("Available: " + Object.keys(this.THEMES).join(", "));
                    return;
                }

                // Apply each CSS variable
                Object.entries(vars).forEach(([k, v]) => {
                    this.root.style.setProperty(k, v);
                });

                this.api.log("Theme applied: " + name);
            };

            /*===========================================================
            =  RESET TO BASE
            ===========================================================*/
            this.reset = () => {
                const sample = this.THEMES.odin; // use any known theme to enumerate keys
                Object.keys(sample).forEach(k =>
                    this.root.style.setProperty(k, "")
                );
                this.api.log("Theme reset to base.");
            };

            /*===========================================================
            =  EXPORT CURRENT THEME
            ===========================================================*/
            this.exportTheme = () => {
                const output = {};
                const style = getComputedStyle(this.root);

                // Collect all known variables
                const keys = new Set();
                Object.values(this.THEMES).forEach(theme => {
                    Object.keys(theme).forEach(k => keys.add(k));
                });

                keys.forEach(k => {
                    const v = style.getPropertyValue(k).trim();
                    if (v) output[k] = v;
                });

                this.api.log(JSON.stringify(output, null, 2));
            };

            /*===========================================================
            =  COMMANDS
            ===========================================================*/

            // Change theme
            api.commands.register("theme", (name) => {
                if (!name) {
                    this.api.log("Themes: " + Object.keys(this.THEMES).join(", "));
                    return;
                }

                name = name.trim();
                if (name === "reset") return this.reset();
                this.applyTheme(name);
            }, "Set theme");

            // Set individual CSS vars
            api.commands.register("theme.set", (pair) => {
                const [k, ...rest] = (pair || "").split("=");
                const v = rest.join("=");

                if (!k || !v) return this.api.log("Usage: theme.set --var=value");

                this.root.style.setProperty(k.trim(), v.trim());
                this.api.log(`Set ${k} = ${v}`);
            }, "Set CSS variable");

            // Export current theme
            api.commands.register("theme.export", () => this.exportTheme(), "Export current theme");

            this.api.log("[themes] ready");
        },

        onMount() {}
    });
})();
