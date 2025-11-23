// plugins/layout-overlay.js
(function(){
    const DevTools = window.BjornDevTools;
    if(!DevTools) return;

    DevTools.registerPlugin("layoutOverlay",{
        name:"Layout Overlay",
        tab:"layoutOverlay",

        onLoad(api){
            this.api=api;
            this.active=false;
            this.boxes=[];
            api.commands.register("layout.overlay",()=>this.on(),"Show flex/grid overlays");
            api.commands.register("layout.off",()=>this.off(),"Hide overlays");
            api.log("[layoutOverlay] ready");
        },

        on(){
            if(this.active) return;
            this.active=true;

            document.querySelectorAll("*").forEach(el=>{
                const s=getComputedStyle(el);
                if(s.display.includes("flex") || s.display.includes("grid")){
                    const r=el.getBoundingClientRect();
                    const b=document.createElement("div");
                    b.style.cssText=`
                        position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;
                        background:${s.display.includes("grid")?"rgba(0,170,255,0.15)":"rgba(0,255,150,0.15)"};
                        border:2px solid ${s.display.includes("grid")?"#0af":"#0f8"};
                        pointer-events:none;z-index:2147483646;`;
                    document.body.appendChild(b);
                    this.boxes.push(b);
                }
            });

            this.api.log("Layout overlays ON.");
        },

        off(){
            this.boxes.forEach(b=>b.remove());
            this.boxes=[];
            this.active=false;
            this.api.log("Layout overlays OFF.");
        },

        onMount(v){
            v.innerHTML=`layout.overlay / layout.off`;
        }
    });
})();
