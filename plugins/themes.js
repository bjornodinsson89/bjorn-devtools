// plugins/themes.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("themes",{
        name:"Themes",
        tab:null,

        onLoad(api){
            this.api=api;
            this.root = api.ui.getRoot();

            this.THEMES={
                odin:{
                    "--bdt-bg":"#18130f",
                    "--bdt-accent":"#ffae72",
                    "--bdt-text":"#ffe7d0",
                    "--bdt-border":"rgba(255,170,120,0.25)"
                },
                dev:{
                    "--bdt-bg":"#0c1220",
                    "--bdt-accent":"#6fb6ff",
                    "--bdt-text":"#e6f0ff",
                    "--bdt-border":"rgba(120,180,255,0.25)"
                },
                matrix:{
                    "--bdt-bg":"#001000",
                    "--bdt-accent":"#6fff88",
                    "--bdt-text":"#c4ffce",
                    "--bdt-border":"rgba(120,255,180,0.25)"
                },
                light:{
                    "--bdt-bg":"#fafafa",
                    "--bdt-accent":"#5b8cff",
                    "--bdt-text":"#111",
                    "--bdt-border":"rgba(0,0,0,0.2)"
                },
                hacker:{
                    "--bdt-bg":"#000",
                    "--bdt-accent":"#33ff33",
                    "--bdt-text":"#00ff88",
                    "--bdt-border":"rgba(0,255,120,0.3)"
                }
            };

            api.commands.register("theme",(n)=>{
                if(!n){
                    api.log("Themes: "+Object.keys(this.THEMES).join(", "));
                    return;
                }
                if(n==="reset") return this.reset();
                this.applyTheme(n);
            });

            api.commands.register("theme.set",(pair)=>{
                const [k,...rest]=pair.split("=");
                const v=rest.join("=");
                if(!k||!v) return api.log("Usage: theme.set --var=value");
                this.root.style.setProperty(k.trim(),v.trim());
                api.log(`Set ${k} = ${v}`);
            });

            api.commands.register("theme.export",()=>{
                const style=getComputedStyle(this.root);
                const out={};
                Object.values(this.THEMES).forEach(theme=>{
                    Object.keys(theme).forEach(k=>{
                        const v=style.getPropertyValue(k).trim();
                        if(v) out[k]=v;
                    });
                });
                api.log(JSON.stringify(out,null,2));
            });

            api.log("[themes] ready");
        },

        applyTheme(name){
            const vars=this.THEMES[name];
            if(!vars) return this.api.log("Unknown theme: "+name);
            Object.entries(vars).forEach(([k,v])=>{
                this.root.style.setProperty(k,v);
            });
            this.api.log("Theme applied: "+name);
        },

        reset(){
            Object.keys(this.THEMES.odin).forEach(k=>{
                this.root.style.setProperty(k,"");
            });
            this.api.log("Theme reset.");
        },

        onMount(){}
    });
})();
