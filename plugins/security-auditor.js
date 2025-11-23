// File: plugins/security-auditor.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("securityAudit",{
        name:"Security Audit",
        tab:"securityAudit",
        events:[],

        onLoad(api){
            this.api = api;
            if (api.unsafe && api.unsafe.register) {
                api.unsafe.register("securityAudit","Hook network errors and flags");
            }

            window.addEventListener("securitypolicyviolation",(e)=>{
                this.add("CSP VIOLATION",`${e.violatedDirective} on ${e.blockedURI}`);
            });

            const origFetch = window.fetch && window.fetch.bind(window);
            if (origFetch){
                window.fetch = (input,init)=>{
                    return origFetch(input,init).catch(err=>{
                        this.add("FETCH ERROR",String(err));
                        throw err;
                    });
                };
            }
        },

        add(type,msg){
            this.events.push({time:new Date(),type,msg});
            if (this.view) this.render();
            this.api.log && this.api.log(`[security] ${type}: ${msg}`);
        },

        onMount(view){
            this.view=view;
            view.innerHTML=`
              <div style="font-family:var(--bdt-code,monospace);font-size:11px;">
                <div style="margin-bottom:6px;opacity:0.8;">CSP violations, CORS errors, and fetch issues.</div>
                <div class="bdt-sa-list" style="max-height:320px;overflow:auto;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;"></div>
              </div>
            `;
            this.listBox = view.querySelector(".bdt-sa-list");
            this.render();
        },

        render(){
            if (!this.listBox) return;
            const frag = document.createDocumentFragment();
            this.events.slice(-200).reverse().forEach(ev=>{
                const div = document.createElement("div");
                div.style.cssText="padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.06);";
                div.textContent = `[${ev.time.toLocaleTimeString()}] ${ev.type}: ${ev.msg}`;
                frag.appendChild(div);
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
