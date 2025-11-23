// plugins/layout-thrash-detector.js
(function(){
    const DevTools=window.BjornDevTools;
    if(!DevTools)return;

    DevTools.registerPlugin("layoutThrashDetector",{
        name:"Layout Thrash",
        tab:"layoutThrashDetector",

        onLoad(api){
            this.api=api;
            this.logs=[];
            this.running=false;
            this.render=null;

            api.commands.register("thrash.on",()=>this.on(),"Start thrash detector");
            api.commands.register("thrash.off",()=>this.off(),"Stop thrash detector");
            api.log("[layoutThrashDetector] ready");
        },

        on(){
            if(this.running)return;
            this.running=true;

            const tick=()=>{
                if(!this.running)return;
                const t0=performance.now();
                document.body.getBoundingClientRect(); // forced layout
                const cost=performance.now()-t0;
                if(cost>12){
                    this.logs.push({time:new Date(),cost});
                    this.render && this.render();
                }
                requestAnimationFrame(tick);
            };
            tick();

            this.api.log("Thrash detector ON.");
        },

        off(){
            this.running=false;
            this.api.log("Thrash detector OFF.");
        },

        onMount(view){
            view.innerHTML=`<div class="bdt-ltd" style="font-size:11px;"></div>`;
            const box=view.querySelector(".bdt-ltd");
            this.render=()=>{
                box.innerHTML="";
                this.logs.slice(-150).forEach(l=>{
                    const d=document.createElement("div");
                    d.textContent=`Layout cost ${l.cost.toFixed(1)}ms @ ${l.time.toLocaleTimeString()}`;
                    box.appendChild(d);
                });
            };
            this.render();
        }
    });
})();
