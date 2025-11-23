// plugins/storage-inspector.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("storageInspector", {
        name:"Storage",
        tab:"storageInspector",

        onLoad(api){
            this.api = api;
            this.mode = "local"; // "local" | "session" | "cookie"
            this.list = null;
            this.filterInp = null;

            // Declare unsafe tools
            api.unsafe.register("storage.write",  "Write storage entries");
            api.unsafe.register("storage.delete", "Delete storage entries");
        },

        onMount(view, api){
            this.api = api;

            view.innerHTML=`
                <div style="display:flex;gap:8px;padding:10px;border-bottom:1px solid var(--bdt-border);">
                    <button class="bdt-btn" data-m="local">Local</button>
                    <button class="bdt-btn" data-m="session">Session</button>
                    <button class="bdt-btn" data-m="cookie">Cookies</button>
                    <button class="bdt-btn-icon" style="margin-left:auto;">+</button>
                </div>
                <div style="padding:10px;">
                    <input class="bdt-filter" placeholder="Filter keys..."
                        style="width:100%;background:rgba(0,0,0,0.2);border:1px solid var(--bdt-border);color:var(--bdt-text);padding:6px;border-radius:4px;">
                </div>
                <div class="bdt-list" style="padding:0 10px 10px;"></div>
                <style>
                    .bdt-btn {
                        background:transparent;
                        border:none;
                        color:var(--bdt-text-dim,#aaa);
                        cursor:pointer;
                        padding:4px 8px;
                        border-radius:4px;
                        font-weight:600;
                    }
                    .bdt-btn:hover {
                        background:rgba(255,255,255,0.05);
                        color:var(--bdt-text,#fff);
                    }
                    .bdt-btn.active {
                        color:var(--bdt-accent,#64b5f6);
                        background:rgba(100,181,246,0.1);
                    }
                    .bdt-btn-icon {
                        background:var(--bdt-accent,#64b5f6);
                        color:#000;
                        border:none;
                        border-radius:4px;
                        width:24px;height:24px;
                        cursor:pointer;
                        font-weight:bold;
                    }
                </style>
            `;

            this.list = view.querySelector(".bdt-list");
            this.filterInp = view.querySelector(".bdt-filter");
            const btns = view.querySelectorAll(".bdt-btn");

            btns.forEach(b=>{
                b.onclick=()=>{
                    btns.forEach(btn=>btn.classList.remove("active"));
                    b.classList.add("active");
                    this.mode=b.dataset.m;
                    this.render();
                };
            });

            const initial = view.querySelector(`[data-m="${this.mode}"]`) || view.querySelector("[data-m='local']");
            if (initial) initial.classList.add("active");

            view.querySelector(".bdt-btn-icon").onclick = () => this.addKey();

            let filterTimer = null;
            this.filterInp.oninput = () => {
                clearTimeout(filterTimer);
                filterTimer = setTimeout(() => this.render(), 80);
            };

            this.render();
        },

        getEntries(){
            const entries = [];
            try{
                if(this.mode==="local"){
                    for(let i=0;i<localStorage.length;i++){
                        const k = localStorage.key(i);
                        entries.push({ k, v: localStorage.getItem(k) });
                    }
                } else if(this.mode==="session"){
                    for(let i=0;i<sessionStorage.length;i++){
                        const k = sessionStorage.key(i);
                        entries.push({ k, v: sessionStorage.getItem(k) });
                    }
                } else if(this.mode==="cookie"){
                    const raw = document.cookie || "";
                    if(!raw) return entries;
                    raw.split(";").forEach(c=>{
                        const trimmed = c.trim();
                        if(!trimmed) return;
                        const eqIdx = trimmed.indexOf("=");
                        if (eqIdx === -1) {
                            // malformed cookie, show as key with empty value
                            entries.push({ k: trimmed, v: "" });
                            return;
                        }
                        const k = trimmed.slice(0, eqIdx);
                        const v = trimmed.slice(eqIdx+1);
                        try {
                            entries.push({
                                k: decodeURIComponent(k.trim()),
                                v: v ? decodeURIComponent(v) : ""
                            });
                        } catch(_) {
                            entries.push({ k: k.trim(), v });
                        }
                    });
                }
            }catch(e){
                if(this.list){
                    this.list.innerHTML = `<div style="opacity:0.6;padding:10px;">Access denied or blocked by browser.</div>`;
                }
                return [];
            }
            return entries;
        },

        render(){
            if(!this.list || !this.filterInp) return;

            const filter = (this.filterInp.value || "").toLowerCase();
            const entries = this.getEntries();
            this.list.innerHTML = "";

            const visible = entries.filter(e => e.k.toLowerCase().includes(filter));

            if(!visible.length){
                this.list.innerHTML = `<div style="opacity:0.6;padding:10px;">No ${this.mode} entries.</div>`;
                return;
            }

            visible.forEach(e=>{
                const row = document.createElement("div");
                row.style.cssText = "padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between;align-items:center;font-size:12px;";

                const kv = document.createElement("div");
                kv.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:10px;font-family:var(--bdt-font-mono,monospace);color:var(--bdt-text-dim,#bbb);";

                let safeVal = "";
                if (e.v != null) {
                    if (typeof e.v === "string") {
                        safeVal = e.v;
                    } else {
                        try {
                            safeVal = JSON.stringify(e.v);
                        } catch(_) {
                            safeVal = String(e.v);
                        }
                    }
                }
                kv.innerHTML = `<strong style="color:var(--bdt-text,#fff);">${e.k}</strong> = ${safeVal}`;

                const acts = document.createElement("div");
                acts.style.cssText = "display:flex;gap:4px;align-items:center;";

                const del = document.createElement("button");
                del.textContent = "✕";
                del.style.cssText = "background:none;border:none;cursor:pointer;opacity:0.6;color:#ef5350;font-size:13px;";
                del.onclick = () => this.delKey(e.k);

                acts.appendChild(del);
                row.append(kv, acts);
                this.list.appendChild(row);
            });
        },

        addKey(){
            if (!this.api.unsafe.ensure("storage.write")) return;

            const k = prompt(`[${this.mode}] Key:`);
            if(!k) return;
            const v = prompt("Value:") ?? "";

            try{
                if(this.mode==="cookie"){
                    document.cookie = `${encodeURIComponent(k)}=${encodeURIComponent(v)}; path=/`;
                } else if(this.mode==="local" || this.mode==="session"){
                    const target = this.mode==="local" ? localStorage : sessionStorage;
                    target.setItem(k, v);
                }
            }catch(e){
                this.api.log && this.api.log(`[storageInspector] write failed: ${e.message}`);
            }

            this.render();
        },

        delKey(k){
            if (!this.api.unsafe.ensure("storage.delete")) return;

            try{
                if(this.mode==="cookie"){
                    this._deleteCookieBestEffort(k);
                } else if(this.mode==="local" || this.mode==="session"){
                    const target = this.mode==="local" ? localStorage : sessionStorage;
                    target.removeItem(k);
                }
            }catch(e){
                this.api.log && this.api.log(`[storageInspector] delete failed: ${e.message}`);
            }

            this.render();
        },

        _deleteCookieBestEffort(name){
            const encodedName = encodeURIComponent(name);
            const past = "Thu, 01 Jan 1970 00:00:00 GMT";

            const paths = ["/"];
            const fullPath = location.pathname || "/";
            if (!paths.includes(fullPath)) paths.push(fullPath);
            const firstSeg = fullPath.split("/").slice(0,2).join("/") || "/";
            if (!paths.includes(firstSeg)) paths.push(firstSeg);

            const host = location.hostname;
            const parts = host.split(".");
            const domains = [undefined, host];

            if (parts.length > 2) {
                domains.push(parts.slice(1).join("."));
            }

            paths.forEach(path => {
                domains.forEach(domain => {
                    let cookie = `${encodedName}=; expires=${past}; path=${path}`;
                    if (domain) cookie += `; domain=${domain}`;
                    document.cookie = cookie;
                });
            });
        }
    });
})();
