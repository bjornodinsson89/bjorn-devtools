// plugins/longtask-profiler.js
(function(){
    const DevTools=window.BjornDevTools;
    if(!DevTools)return;

    DevTools.registerPlugin("longtaskProfiler",{
        name:"Long Tasks",
        tab:"longtaskProfiler",

        onLoad(api){
            this.api=api;
            this.logs=[];
            this.render=null;
            this.running=false;

            api.commands.register("longtasks.on",()=>this.on(),"Start long task detector");
            api.commands.register("longtasks.off",()=>this.off(),"Stop long task detector");
            api.log("[longtaskProfiler] ready");
        },

        on(){
            if(this.running)return;
            this.running=true;
            let last=performance.now();
            const tick=()=>{
                if(!this.running)return;
                const now=performance.now();
                const drift=now-last-50;
                last=now;
                if(drift>20){
                    this.logs.push({time:new Date(),delay:drift});
                    this.render && this.render();
                }
                setTimeout(tick,50);
            };
            tick();
            this.api.log("Long task detection ON.");
        },

        off(){
            this.running=false;
            this.api.log("Long task detection OFF.");
        },

        onMount(view){
            view.innerHTML=`<div class="bdt-lt" style="font-size:11px;"></div>`;
            const box=view.querySelector(".bdt-lt");
            this.render=()=>{
                box.innerHTML="";
                this.logs.slice(-100).forEach(x=>{
                    const d=document.createElement("div");
                    d.textContent=`Lag: ${x.delay.toFixed(1)}ms @ ${x.time.toLocaleTimeString()}`;
                    box.appendChild(d);
                });
            };
            this.render();
        }
    });
