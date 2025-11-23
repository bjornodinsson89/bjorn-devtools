// plugins/themes.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("themes", {
        name: "Themes",
        tab: null,

        onLoad(api) {
            this.api = api;
            this.root = api.ui.getRoot();

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
                const vars = this.THEMES[name];
                if (!vars) return api.log("Unknown theme: " + name);

                Object.entries(vars).forEach(([k, v]) =>
                    this.root.style.setProperty(k, v)
                );

                api.log("Theme applied: " + name);
            };

            /*===========================================================
            =  RESET
            ===========================================================*/
            this.reset = () => {
                Object.keys(this.THEMES.odin).forEach(k =>
                    this.root.style.setProperty(k, "")
                );
                api.log("Theme reset to base.");
            };

            /*===========================================================
            =  EXPORT CURRENT THEME
            ===========================================================*/
            this.exportTheme = () => {
                const style = getComputedStyle(this.root);
                const output = {};
                Object.keys(this.THEMES.odin).forEach(k => {
                    output[k] = style.getPropertyValue(k);
                });
                api.log(JSON.stringify(output, null, 2));
            };

            /*===========================================================
            =  COMMANDS
            ===========================================================*/
            api.commands.register("theme", (name) => {
                if (!name) return api.log("Themes: " + Object.keys(this.THEMES).join(", "));
                name = name.trim();
                if (name === "reset") return this.reset();
                this.applyTheme(name);
            }, "Set theme");

            api.commands.register("theme.set", (pair) => {
                const [k, ...rest] = (pair || "").split("=");
                const v = rest.join("=");
                if (!k || !v) return api.log("Usage: theme.set --var=value");
                this.root.style.setProperty(k.trim(), v.trim());
                api.log(`Set ${k} = ${v}`);
            }, "Set CSS variable");

            api.commands.register("theme.export", () => this.exportTheme(), "Export current theme");

            api.log("[themes] ready");
        },

        onMount() {}
    });
})();
