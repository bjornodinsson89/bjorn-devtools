// plugins/script-runner.js
(function(){
    const DevTools=window.BjornDevTools;
    if(!DevTools)return;

    // unsafe: running JS + saving scripts that may contain code
    DevTools.unsafe.register("scriptRunner", ["run","save"]);

    DevTools.registerPlugin("scriptRunner",{
        name:"Script Runner",
        tab:"scriptRunner",

        onLoad(api){
            this.api=api;
            this.saved={};

            api.commands.register("script.save",(name)=>{
                if(!api.ensureUnsafe("scriptRunner.save")) return;
                if(!name) return api.log("script.save <name>");
                this.saved[name]=this.editor.value;
                api.log("Saved: "+name);
            });

            api.commands.register("script.load",(name)=>{
                if(!name) return api.log("script.load <name>");
                if(this.saved[name]){
                    this.editor.value=this.saved[name];
                    api.log("Loaded: "+name);
                } else api.log("No saved script.");
            });

            api.log("[scriptRunner] ready");
        },

        onMount(view){
            view.innerHTML=`
                <textarea class="bdt-sr-editor"
                    style="width:100%;height:60%;background:#000;color:#fff;
                    font-family:ui-monospace;border:1px solid #444;padding:6px;"></textarea>
                <button class="bdt-sr-run" style="margin-top:6px;">Run</button>
                <div class="bdt-sr-output" style="margin-top:6px;font-size:11px;"></div>`;

            this.editor=view.querySelector(".bdt-sr-editor");
            const out=view.querySelector(".bdt-sr-output");
            const run=view.querySelector(".bdt-sr-run");

            run.onclick=()=>{
                if(!this.api.ensureUnsafe("scriptRunner.run")) return;
                try{
                    const r=eval(this.editor.value);
                    out.textContent=String(r);
                }catch(e){ out.textContent="ERR: "+e.message; }
            };
        }
    });
})();
