// plugins/themes.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("themes", {
        name: "Themes",
        tab: null,

        onLoad(api) {
            const root = api.ui.getRoot();
            const log = api.log;

            const THEMES = {
                odin: {
                    "--bdt-bg": "#18130f",
                    "--bdt-accent": "#ffae72",
                    "--bdt-text": "#ffe7d0"
                },
                dev: {
                    "--bdt-bg": "#0c1220",
                    "--bdt-accent": "#6fb6ff",
                    "--bdt-text": "#e6f0ff"
                },
                matrix: {
                    "--bdt-bg": "#000800",
                    "--bdt-accent": "#6fff88",
                    "--bdt-text": "#c0ffc0"
                }
            };

            function apply(name) {
                const vars = THEMES[name];
                if (!vars) return log("Unknown theme.");
                Object.entries(vars).forEach(([k, v]) => {
                    root.style.setProperty(k, v);
                });
                log("Theme: " + name);
            }

            api.commands.register("theme", name => apply(name.trim()), "Set theme");

            log("[themes] ready");
        },

        onMount() {}
    });
})();
