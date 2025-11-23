// plugins/storage-inspector.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    // unsafe: write/delete storage + cookies
    DevTools.unsafe.register("storageInspector", ["write","delete","clear"]);

    DevTools.registerPlugin("storageInspector", {
        name:"Storage",
        tab:"storageInspector",

        onLoad(api){
            this.api=api;
            this.mode="local";
            api.commands.register("storage.clear",(t)=>{
                if(!api.ensureUnsafe("storageInspector.clear")) return;
                if(t==="local") localStorage.clear();
                else if(t==="session") sessionStorage.clear();
                else if(t==="cookies") this.clearAllCookies();
                else api.log("Usage: storage.clear <local|session|cookies>");
                api.log("Cleared: "+t);
            });
            api.log("[storageInspector] ready");
        },

        clearAllCookies(){
            const exp="Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie.split(";").forEach(c=>{
                const name=c.split("=")[0].trim();
                document.cookie = `${name}=;expires=${exp};path=/`;
                document.cookie = `${name}=;expires=${exp};path=`;
            });
        },

        delCookie(name){
            const exp="Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = `${name}=;expires=${exp};path=/`;
            document.cookie = `${name}=;expires=${exp};path=`;
        },

        onMount(view){
            view.innerHTML=`
                <div style="display:flex;gap:6px;margin-bottom:6px;">
                    <button class="bdt-s-btn" data-m="local">Local</button>
                    <button class="bdt-s-btn" data-m="session">Session</button>
                    <button class="bdt-s-btn" data-m="cookie">Cookies</button>
                    <button class="bdt-s-add" style="margin-left:auto;">Add</button>
                </div>
                <input class="bdt-s-filter" placeholder="Search key..." style="width:100%;padding:6px;background:#000;color:#fff;border:1px solid #444;margin-bottom:8px;">
                <div class="bdt-s-list" style="font-size:11px;"></div>
            `;

            this.list=view.querySelector(".bdt-s-list");
            this.filter=view.querySelector(".bdt-s-filter");

            view.querySelectorAll(".bdt-s-btn").forEach(b=>{
                b.onclick=()=>{this.mode=b.dataset.m; this.render();};
            });

            view.querySelector(".bdt-s-add").onclick=()=>this.addKey();
            this.filter.oninput=()=>this.render();

            this.render();
        },

        render(){
            const list=this.list;
            const f=(this.filter.value||"").toLowerCase();
            let entries=[];

            try{
                if(this.mode==="local")
                    for(let i=0;i<localStorage.length;i++)
                        entries.push({k:localStorage.key(i),v:localStorage.getItem(localStorage.key(i))});
                else if(this.mode==="session")
                    for(let i=0;i<sessionStorage.length;i++)
                        entries.push({k:sessionStorage.key(i),v:sessionStorage.getItem(sessionStorage.key(i))});
                else if(this.mode==="cookie"){
                    document.cookie.split(";").forEach(c=>{
                        const [k,v]=c.split("=");
                        if(k) entries.push({k:k.trim(),v:v||""});
                    });
                }
            }catch{ list.textContent="Blocked by browser."; return; }

            list.innerHTML="";
            entries.filter(e=>e.k.toLowerCase().includes(f)).forEach(e=>this.renderRow(e));
        },

        renderRow({k,v}){
            const row=document.createElement("div");
            row.style.cssText=`
                padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.08);
                display:flex;justify-content:space-between;`;

            const left=document.createElement("div");
            left.textContent=`${k} = ${v}`;
            left.style.cssText="flex:1;padding-right:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";

            const right=document.createElement("div");
            right.style.cssText="display:flex;gap:6px;";

            const btn=(t,fn)=>{
                const b=document.createElement("button");
                b.textContent=t;
                b.style.cssText="padding:2px 6px;background:#000;color:#ddd;border:1px solid #444;border-radius:4px;font-size:10px;cursor:pointer;";
                b.onclick=fn;
                return b;
            };

            right.appendChild(btn("Edit",()=>this.editKey(k,v)));
            right.appendChild(btn("Del",()=>this.delKey(k)));

            row.append(left,right);
            this.list.appendChild(row);
        },

        addKey(){
            if(!this.api.ensureUnsafe("storageInspector.write")) return;
            const k=prompt("Key:"); if(!k) return;
            const v=prompt("Value:"); if(v===null) return;

            try{
                if(this.mode==="local") localStorage.setItem(k,v);
                else if(this.mode==="session") sessionStorage.setItem(k,v);
                else if(this.mode==="cookie") document.cookie=`${k}=${v}; path=/`;
            }catch{ this.api.log("ERR writing storage."); }

            this.render();
        },

        editKey(k,v){
            if(!this.api.ensureUnsafe("storageInspector.write")) return;
            const nv=prompt("Edit value:",v);
            if(nv===null) return;

            try{
                if(this.mode==="local") localStorage.setItem(k,nv);
                else if(this.mode==="session") sessionStorage.setItem(k,nv);
                else if(this.mode==="cookie") document.cookie=`${k}=${nv}; path=/`;
            }catch{ this.api.log("ERR editing storage."); }

            this.render();
        },

        delKey(k){
            if(!this.api.ensureUnsafe("storageInspector.delete")) return;
            try{
                if(this.mode==="local") localStorage.removeItem(k);
                else if(this.mode==="session") sessionStorage.removeItem(k);
                else if(this.mode==="cookie") this.delCookie(k);
            }catch{ this.api.log("ERR deleting key."); }

            this.render();
        }
    });
})();
