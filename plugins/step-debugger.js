// File: plugins/step-debugger.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("stepDebugger",{
        name:"Step Debugger",
        tab:"stepDebugger",
        breaks:[],

        onLoad(api){
            this.api = api;
            if (api.unsafe && api.unsafe.register) {
                api.unsafe.register("stepDebugger","Custom pause overlay");
            }

            const self = this;
            window.$bjornPause = function(label){
                self.pause(label || "Manual pause");
            };

            api.commands.register("pause",(label)=>{
                self.pause(label || "Manual pause");
            },"Pause with Bjorn debugger");
        },

        pause(label){
            if (this.api && this.api.unsafe && !this.api.unsafe.ensure("stepDebugger")) {
                this.api.log && this.api.log("[stepDebugger] Unsafe OFF, pause ignored.");
                return;
            }

            const err = new Error(label);
            const stack = err.stack || "";
            this.breaks.push({time:new Date(),label,stack});
            if (this.view) this.render();

            this.showOverlay(label,stack);
        },

        showOverlay(label, stack){
            if (!this.api || !this.api.ui || !this.api.ui.getRoot) return;
            const root = this.api.ui.getRoot();
            if (!root) return;
            if (this.overlay) this.overlay.remove();

            const ov = document.createElement("div");
            ov.style.cssText = `
              position:absolute;inset:0;z-index:2147483647;
              background:rgba(0,0,0,0.72);
              display:flex;align-items:center;justify-content:center;
            `;
            ov.innerHTML = `
              <div style="background:#111;border-radius:10px;border:1px solid rgba(255,255,255,0.12);padding:16px;width:520px;max-width:90%;font-family:var(--bdt-code,monospace);font-size:11px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <div><strong>Paused</strong> – ${label}</div>
                  <button class="bdt-sd-resume" style="padding:4px 10px;background:#222;border-radius:6px;border:1px solid rgba(255,255,255,0.2);cursor:pointer;">Resume</button>
                </div>
                <div style="max-height:260px;overflow:auto;white-space:pre-wrap;font-size:10px;border-top:1px solid rgba(255,255,255,0.12);padding-top:6px;"></div>
              </div>
            `;
            const content = ov.querySelector("div > div:last-child");
            content.textContent = stack;
            const btn = ov.querySelector(".bdt-sd-resume");
            btn.addEventListener("click",()=>ov.remove());
            root.appendChild(ov);
            this.overlay = ov;
        },

        onMount(view){
            this.view = view;
            view.innerHTML = `
              <div style="font-family:var(--bdt-code,monospace);font-size:11px;">
                <div style="margin-bottom:6px;opacity:0.8;">Use <code>$bjornPause("label")</code> or <code>pause "label"</code> in console.</div>
                <div class="bdt-sd-list" style="max-height:260px;overflow:auto;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;"></div>
              </div>
            `;
            this.listBox = view.querySelector(".bdt-sd-list");
            this.render();
        },

        render(){
            if (!this.listBox) return;
            const frag = document.createDocumentFragment();
            const items = this.breaks.slice().reverse().slice(0,50);
            items.forEach(b=>{
                const div = document.createElement("div");
                div.style.cssText = "padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;";
                const time = b.time.toLocaleTimeString();
                div.textContent = `[${time}] ${b.label}`;
                div.addEventListener("click",()=>this.showOverlay(b.label,b.stack));
                frag.appendChild(div);
            });
            this.listBox.innerHTML = "";
            this.listBox.appendChild(frag);
        },

        onUnload(){
            if (this.overlay) this.overlay.remove();
            this.overlay = null;
            this.view = null;
            this.listBox = null;
        }
    });
})();
