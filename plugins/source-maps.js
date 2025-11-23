// File: plugins/source-maps.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("sourceMaps",{
        name:"Source Maps",
        tab:"sourceMaps",
        state:{
            maps:{}, // file -> SourceMapConsumer
            errors:[]
        },

        onLoad(api){
            this.api = api;
            if (api.unsafe && api.unsafe.register) {
                api.unsafe.register("sourceMaps","Resolve minified stack traces");
            }

            this.installGlobalHooks();
        },

        installGlobalHooks(){
            if (this._hooksInstalled) return;
            this._hooksInstalled = true;

            window.addEventListener("error",(e)=>{
                this.handleError(e.error || e);
            });

            window.addEventListener("unhandledrejection",(e)=>{
                const err = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
                this.handleError(err);
            });
        },

        ensureLibLoaded(cb){
            if (window.sourceMap && window.sourceMap.SourceMapConsumer) {
                cb();
                return;
            }
            if (this._loadingLib) {
                this._loadingLib.push(cb);
                return;
            }
            this._loadingLib = [cb];
            const s = document.createElement("script");
            s.src = "https://unpkg.com/source-map@0.7.4/dist/source-map.min.js";
            s.async = true;
            s.onload = ()=>{
                const queue = this._loadingLib || [];
                this._loadingLib = null;
                queue.forEach(fn=>fn());
            };
            s.onerror = ()=>{ this._loadingLib = null; };
            document.documentElement.appendChild(s);
        },

        handleError(err){
            if (!err || !err.stack) return;
            if (this.api && this.api.unsafe && !this.api.unsafe.ensure("sourceMaps")) return;

            this.errors.push({time:new Date(),err});
            if (this.viewBox) this.render();

            const stack = String(err.stack);
            const first = stack.split("\n")[1] || "";
            const m = first.match(/(https?:\/\/[^\s:]+):(\d+):(\d+)/);
            if (!m) return;
            const src = m[1], line = Number(m[2]), col = Number(m[3]);

            const map = this.state.maps[src];
            if (!map) {
                this.api.log && this.api.log(`[sourceMaps] Error at ${src}:${line}:${col} (no map)`);
                return;
            }

            this.ensureLibLoaded(()=>{
                const consumer = map;
                try{
                    const pos = consumer.originalPositionFor({ line, column: col });
                    if (pos && pos.source) {
                        this.api.log && this.api.log(
                            `[sourceMaps] ${pos.source}:${pos.line}:${pos.column || 0} (${pos.name || "?"})`
                        );
                    }
                }catch(e){
                    this.api.log && this.api.log("[sourceMaps] map error: "+e.message);
                }
            });
        },

        loadMapFor(url, json){
            this.ensureLibLoaded(()=>{
                const C = window.sourceMap && window.sourceMap.SourceMapConsumer;
                if (!C) return;
                C.with(json,null,consumer=>{
                    this.state.maps[url] = consumer;
                    this.api.log && this.api.log("[sourceMaps] Map loaded for "+url);
                });
            });
        },

        onMount(view,api){
            this.view = view;
            view.innerHTML = `
              <div style="font-family:var(--bdt-code,monospace);font-size:11px;">
                <div style="margin-bottom:8px;display:flex;gap:6px;align-items:center;">
                  <input type="file" multiple accept=".map" class="bdt-sm-file" />
                  <input type="text" placeholder="Script URL for selected map" class="bdt-sm-url" style="flex:1;min-width:0;" />
                  <button class="bdt-sm-bind">Bind Map</button>
                </div>
                <div class="bdt-sm-errors" style="max-height:220px;overflow:auto;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;"></div>
              </div>
            `;
            this.viewBox = view.querySelector(".bdt-sm-errors");

            const fileInput = view.querySelector(".bdt-sm-file");
            const urlInput  = view.querySelector(".bdt-sm-url");
            const bindBtn   = view.querySelector(".bdt-sm-bind");
            let lastFileJson = null;

            fileInput.addEventListener("change",()=>{
                const f = fileInput.files[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = ()=>{
                    try{
                        lastFileJson = JSON.parse(String(reader.result));
                        this.api.log && this.api.log(`[sourceMaps] Loaded .map file: ${f.name}`);
                    }catch(e){
                        lastFileJson = null;
                        this.api.log && this.api.log("[sourceMaps] Invalid map: "+e.message);
                    }
                };
                reader.readAsText(f);
            });

            bindBtn.addEventListener("click",()=>{
                const url = urlInput.value.trim();
                if (!url || !lastFileJson) return;
                this.loadMapFor(url,lastFileJson);
            });

            this.render();
        },

        render(){
            if (!this.viewBox) return;
            const frag = document.createDocumentFragment();
            const items = this.errors.slice(-100);
            items.forEach(rec=>{
                const div = document.createElement("div");
                div.style.cssText = "padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.06);";
                const time = rec.time.toLocaleTimeString();
                div.textContent = `[${time}] ${rec.err && rec.err.message || rec.err}`;
                frag.appendChild(div);
            });
            this.viewBox.innerHTML = "";
            this.viewBox.appendChild(frag);
        },

        onUnload(){
            this.view = null;
            this.viewBox = null;
        }
    });
})();
