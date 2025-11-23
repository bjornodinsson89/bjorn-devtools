// File: plugins/node-screenshot.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("nodePreview",{
        name:"Node Preview",
        tab:"nodePreview",
        shots:[],

        onLoad(api){
            this.api = api;
            if (api.unsafe && api.unsafe.register) {
                api.unsafe.register("nodePreview","Capture element screenshots");
            }
        },

        loadHtml2Canvas(cb){
            if (window.html2canvas) { cb(); return; }
            if (this._loading) { this._loading.push(cb); return; }
            this._loading=[cb];
            const s=document.createElement("script");
            s.src="https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js";
            s.async=true;
            s.onload=()=>{
                const q=this._loading||[];
                this._loading=null;
                q.forEach(fn=>fn());
            };
            s.onerror=()=>{ this._loading=null; };
            document.documentElement.appendChild(s);
        },

        captureNode(node){
            if (!this.api || !this.api.unsafe || !this.api.unsafe.ensure("nodePreview")) {
                this.api.log && this.api.log("[nodePreview] Unsafe OFF, capture blocked.");
                return;
            }
            if (!node) return;
            this.loadHtml2Canvas(()=>{
                window.html2canvas(node).then(canvas=>{
                    const url = canvas.toDataURL("image/png");
                    this.shots.push({time:new Date(),url});
                    if (this.view) this.render();
                }).catch(e=>{
                    this.api.log && this.api.log("[nodePreview] html2canvas error: "+e.message);
                });
            });
        },

        onMount(view){
            this.view=view;
            view.innerHTML=`
              <div style="font-family:var(--bdt-code,monospace);font-size:11px;">
                <div style="margin-bottom:6px;opacity:0.8;">
                  Use <code>window.$bjornCapture(el)</code> (pass a DOM node) to capture a screenshot.
                </div>
                <div class="bdt-np-list" style="max-height:320px;overflow:auto;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;"></div>
              </div>
            `;
            this.listBox = view.querySelector(".bdt-np-list");
            const self=this;
            window.$bjornCapture = function(node){ self.captureNode(node); };
            this.render();
        },

        render(){
            if (!this.listBox) return;
            const frag=document.createDocumentFragment();
            this.shots.slice().reverse().forEach(s=>{
                const row=document.createElement("div");
                row.style.cssText="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.06);";
                const info=document.createElement("div");
                info.textContent = s.time.toLocaleTimeString();
                const img=document.createElement("img");
                img.src=s.url;
                img.style.cssText="max-width:100%;border-radius:6px;margin-top:2px;";
                row.appendChild(info);
                row.appendChild(img);
                frag.appendChild(row);
            });
            this.listBox.innerHTML="";
            this.listBox.appendChild(frag);
        },

        onUnload(){
            this.view=null;
            this.listBox=null;
        }
    });
})();
