// File: plugins/advanced-theme.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("advancedTheme",{
        name:"Appearance",
        tab:"advancedTheme",

        onLoad(api){
            this.api = api;
            if (api.commands) {
                api.commands.register("dock.bottom",()=>this.setDock("bottom"),"Dock DevTools to bottom");
                api.commands.register("dock.top",()=>this.setDock("top"),"Dock DevTools to top");
            }
        },

        setDock(pos){
            const root = this.api.ui.getRoot();
            if (!root) return;
            const panel = root.querySelector(".bdt-panel");
            if (!panel) return;
            if (pos==="top"){
                panel.style.top = "0";
                panel.style.bottom = "auto";
            }else{
                panel.style.top = "auto";
                panel.style.bottom = "0";
            }
            this.api.log && this.api.log(`[appearance] Docked to ${pos}.`);
        },

        onMount(view){
            this.view=view;
            view.innerHTML=`
              <div style="font-family:var(--bdt-code,monospace);font-size:11px;">
                <div style="margin-bottom:6px;opacity:0.8;">Dock position and custom CSS.</div>
                <div style="display:flex;gap:6px;margin-bottom:8px;">
                  <button class="bdt-at-top" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:#111;cursor:pointer;">Dock Top</button>
                  <button class="bdt-at-bottom" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:#111;cursor:pointer;">Dock Bottom</button>
                </div>
                <textarea class="bdt-at-css" placeholder="Custom CSS for DevTools host" style="width:100%;min-height:140px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:#050509;color:#fff;padding:6px;"></textarea>
                <button class="bdt-at-apply" style="margin-top:6px;padding:4px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:#111;cursor:pointer;">Apply CSS</button>
              </div>
            `;
            const topBtn  = view.querySelector(".bdt-at-top");
            const botBtn  = view.querySelector(".bdt-at-bottom");
            const cssArea = view.querySelector(".bdt-at-css");
            const apply   = view.querySelector(".bdt-at-apply");

            topBtn.addEventListener("click",()=>this.setDock("top"));
            botBtn.addEventListener("click",()=>this.setDock("bottom"));

            apply.addEventListener("click",()=>{
                const css = cssArea.value;
                this.applyCSS(css);
            });
        },

        applyCSS(css){
            const root = this.api.ui.getRoot();
            if (!root) return;
            if (!this.styleEl){
                this.styleEl = document.createElement("style");
                root.appendChild(this.styleEl);
            }
            this.styleEl.textContent = css;
            this.api.log && this.api.log("[appearance] Custom CSS applied.");
        },

        onUnload(){
            if (this.styleEl) this.styleEl.remove();
            this.styleEl=null;
            this.view=null;
        }
    });
})();
