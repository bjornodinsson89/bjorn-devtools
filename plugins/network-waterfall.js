// File: plugins/network-waterfall.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("netWaterfall",{
        name:"Net Waterfall",
        tab:"netWaterfall",
        entries:[],

        onLoad(api){
            this.api = api;
            if (api.unsafe && api.unsafe.register) {
                api.unsafe.register("netWaterfall","Track and visualize requests");
            }

            this.patchFetch();
            this.patchXHR();
        },

        patchFetch(){
            if (!window.fetch || this._fetchPatched) return;
            this._fetchPatched = true;
            const orig = window.fetch.bind(window);
            window.fetch = (input,init)=>{
                const start = performance.now();
                const url = (typeof input==="string" ? input : (input && input.url)) || "";
                const rec = {url,method:(init && init.method)||"GET",start, end:null, ok:null};
                this.entries.push(rec);
                return orig(input,init).then(res=>{
                    rec.end = performance.now();
                    rec.ok = res.ok;
                    if (this.view) this.render();
                    return res;
                }).catch(err=>{
                    rec.end = performance.now();
                    rec.ok = false;
                    rec.error = String(err);
                    if (this.view) this.render();
                    throw err;
                });
            };
        },

        patchXHR(){
            if (!window.XMLHttpRequest || this._xhrPatched) return;
            this._xhrPatched = true;
            const Orig = window.XMLHttpRequest;
            const self = this;
            function XHR(){
                const xhr = new Orig();
                let rec = null;
                xhr.addEventListener("loadstart",()=>{
                    const url = xhr.responseURL || "";
                    const start = performance.now();
                    rec = {url,method:xhr._bdtMethod || "GET",start,end:null,ok:null};
                    self.entries.push(rec);
                });
                xhr.addEventListener("loadend",()=>{
                    if (!rec) return;
                    rec.end = performance.now();
                    rec.ok = (xhr.status>=200 && xhr.status<400);
                    if (self.view) self.render();
                });
                return xhr;
            }
            XHR.prototype = Orig.prototype;
            window.XMLHttpRequest = XHR;
            const open = Orig.prototype.open;
            Orig.prototype.open = function(method,url){
                this._bdtMethod = method;
                return open.apply(this,arguments);
            };
        },

        onMount(view){
            this.view = view;
            view.innerHTML = `
              <div style="font-family:var(--bdt-code,monospace);font-size:11px;">
                <div style="margin-bottom:6px;opacity:0.8;">Request waterfall (relative to first request).</div>
                <div class="bdt-nw-graph" style="height:160px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);margin-bottom:8px;position:relative;overflow:auto;"></div>
                <div class="bdt-nw-list" style="max-height:220px;overflow:auto;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;"></div>
              </div>
            `;
            this.graphBox = view.querySelector(".bdt-nw-graph");
            this.listBox = view.querySelector(".bdt-nw-list");
            this.render();
        },

        render(){
            if (!this.view) return;
            this.renderGraph();
            this.renderList();
        },

        renderGraph(){
            if (!this.graphBox) return;
            const box = this.graphBox;
            box.innerHTML="";
            const entries = this.entries.filter(e=>e.end!=null);
            if (!entries.length) return;
            const minStart = Math.min.apply(null,entries.map(e=>e.start));
            const maxEnd = Math.max.apply(null,entries.map(e=>e.end));
            const span = (maxEnd-minStart)||1;
            entries.slice(-120).forEach((e,i)=>{
                const row = document.createElement("div");
                row.style.cssText = "display:flex;align-items:center;margin:2px 4px;";
                const label = document.createElement("div");
                label.style.cssText="flex:0 0 160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
                label.textContent = e.method+" "+e.url;
                const barWrap = document.createElement("div");
                barWrap.style.cssText="flex:1;position:relative;height:10px;";
                const bar = document.createElement("div");
                const left = ((e.start-minStart)/span)*100;
                const width = ((e.end-e.start)/span)*100;
                bar.style.cssText = `
                  position:absolute;height:100%;
                  left:${left}%;width:${Math.max(0.5,width)}%;
                  border-radius:4px;
                  background:${e.ok===false?"#ff5252":"#4caf50"};
                `;
                barWrap.appendChild(bar);
                row.appendChild(label);
                row.appendChild(barWrap);
                box.appendChild(row);
            });
        },

        renderList(){
            if (!this.listBox) return;
            const frag = document.createDocumentFragment();
            this.entries.slice(-200).reverse().forEach(e=>{
                const div = document.createElement("div");
                div.style.cssText="padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.06);";
                const dur = (e.end && e.start) ? (e.end-e.start).toFixed(1) : "?";
                div.textContent = `${e.method} ${e.url} – ${dur}ms${e.ok===false?" (ERR)":""}`;
                frag.appendChild(div);
            });
            this.listBox.innerHTML="";
            this.listBox.appendChild(frag);
        },

        onUnload(){
            this.view=null;
            this.graphBox=null;
            this.listBox=null;
        }
    });
})();
