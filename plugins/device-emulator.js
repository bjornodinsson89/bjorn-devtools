// File: plugins/device-emulator.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("deviceEmulator",{
        name:"Device Emulator",
        tab:"deviceEmulator",
        presets:{
            "Desktop":   {w:1366,h:768},
            "iPhone 14": {w:390,h:844},
            "Pixel 7":   {w:412,h:915},
            "iPad Pro":  {w:1024,h:1366}
        },

        onLoad(api){
            this.api = api;
            if (api.unsafe && api.unsafe.register) {
                api.unsafe.register("deviceEmulator","Inject viewport and touch emulation");
            }
        },

        applyPreset(name){
            if (!this.api || !this.api.unsafe || !this.api.unsafe.ensure("deviceEmulator")) {
                this.api.log && this.api.log("[deviceEmulator] Unsafe OFF, not applying preset.");
                return;
            }
            const p = this.presets[name];
            if (!p) return;
            document.documentElement.style.setProperty("--bdt-emulated-width",p.w+"px");
            document.documentElement.style.setProperty("--bdt-emulated-height",p.h+"px");
            document.documentElement.style.width = p.w+"px";
            document.documentElement.style.height = p.h+"px";
            document.body.style.width = "100%";
            document.body.style.height = "100%";
            this.api.log && this.api.log(`[deviceEmulator] Applied ${name} (${p.w}x${p.h})`);
        },

        reset(){
            document.documentElement.style.removeProperty("--bdt-emulated-width");
            document.documentElement.style.removeProperty("--bdt-emulated-height");
            document.documentElement.style.width = "";
            document.documentElement.style.height = "";
            document.body.style.width = "";
            document.body.style.height = "";
            this.api.log && this.api.log("[deviceEmulator] Reset.");
        },

        onMount(view){
            this.view=view;
            const options = Object.keys(this.presets).map(k=>`<option value="${k}">${k}</option>`).join("");
            view.innerHTML=`
              <div style="font-family:var(--bdt-code,monospace);font-size:11px;">
                <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
                  <select class="bdt-de-select" style="flex:1;">${options}</select>
                  <button class="bdt-de-apply" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:#111;cursor:pointer;">Apply</button>
                  <button class="bdt-de-reset" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:#111;cursor:pointer;">Reset</button>
                </div>
                <div style="opacity:0.7;">Simulates viewport size via CSS; media queries will react to new dimensions.</div>
              </div>
            `;
            const sel = view.querySelector(".bdt-de-select");
            const applyBtn = view.querySelector(".bdt-de-apply");
            const resetBtn = view.querySelector(".bdt-de-reset");
            applyBtn.addEventListener("click",()=>this.applyPreset(sel.value));
            resetBtn.addEventListener("click",()=>this.reset());
        },

        onUnload(){
            this.reset();
            this.view=null;
        }
    });
})();
