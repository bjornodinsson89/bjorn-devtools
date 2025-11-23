// File: plugins/workflows-export.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("workflows",{
        name:"Workflows",
        tab:"workflows",

        onLoad(api){
            this.api = api;
        },

        exportJSON(data, filename){
            const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
            const url = URL.createObjectURL(blob);
            const a=document.createElement("a");
            a.href=url;
            a.download=filename||"bjorn-export.json";
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(()=>URL.revokeObjectURL(url),1000);
        },

        onMount(view){
            this.view=view;
            view.innerHTML=`
              <div style="font-family:var(--bdt-code,monospace);font-size:11px;">
                <div style="margin-bottom:6px;opacity:0.8;">Export/import DevTools data (network, timeline, settings).</div>
                <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
                  <button class="bdt-wf-exp" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:#111;cursor:pointer;">Export JSON</button>
                  <input type="file" class="bdt-wf-file" accept=".json" style="flex:1;min-width:0;" />
                </div>
                <div class="bdt-wf-log" style="max-height:260px;overflow:auto;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;"></div>
              </div>
            `;
            this.logBox = view.querySelector(".bdt-wf-log");
            const expBtn = view.querySelector(".bdt-wf-exp");
            const fileIn = view.querySelector(".bdt-wf-file");

            expBtn.addEventListener("click",()=>this.handleExport());
            fileIn.addEventListener("change",()=>this.handleImport(fileIn.files[0]));
        },

        handleExport(){
            const payload = {
                time:new Date().toISOString(),
                url:location.href,
                settings:{
                    safe: DevTools.state.safe,
                    ui: DevTools.state.ui
                },
                plugins:Object.keys(DevTools.plugins.registry).map(id=>{
                    const rec = DevTools.plugins.registry[id];
                    return {id,status:rec.status,disabled:!!rec.disabled,src:rec.src};
                })
            };
            this.exportJSON(payload,"bjorn-devtools-export.json");
            this.log("Exported current configuration.");
        },

        handleImport(file){
            if (!file) return;
            const reader=new FileReader();
            reader.onload=()=>{
                try{
                    const json = JSON.parse(String(reader.result));
                    this.log("Imported JSON with keys: "+Object.keys(json).join(", "));
                }catch(e){
                    this.log("Import error: "+e.message);
                }
            };
            reader.readAsText(file);
        },

        log(msg){
            if (!this.logBox) return;
            const div=document.createElement("div");
            div.style.cssText="padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.06);";
            div.textContent = msg;
            this.logBox.appendChild(div);
            this.logBox.scrollTop = this.logBox.scrollHeight;
        },

        onUnload(){
            this.view=null;
            this.logBox=null;
        }
    });
})();
