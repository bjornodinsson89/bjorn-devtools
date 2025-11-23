// plugins/event-listener-tracker.js
(function(){
    const DevTools=window.BjornDevTools;
    if(!DevTools)return;

    DevTools.registerPlugin("eventListenerTracker",{
        name:"Event Tracker",
        tab:"eventListenerTracker",

        onLoad(api){
            this.api=api;
            this.logs=[];
            this.render=null;

            if(!window.__bdt_evt_patch__){
                window.__bdt_evt_patch__=true;
                const orig=EventTarget.prototype.addEventListener;
                const self=this;

                EventTarget.prototype.addEventListener=function(type,fn,opt){
                    self.logs.push({ target:this, type, time:new Date() });
                    self.render && self.render();
                    return orig.call(this,type,fn,opt);
                };
            }

            api.log("[eventListenerTracker] ready");
        },

        onMount(view){
            view.innerHTML=`<div class="bdt-et" style="font-size:11px;"></div>`;
            const box=view.querySelector(".bdt-et");

            this.render=()=>{
                box.innerHTML="";
                this.logs.slice(-200).forEach(l=>{
                    const nm = l.target?.nodeName || "object";
                    const d=document.createElement("div");
                    d.textContent=`${l.time.toLocaleTimeString()} :: addEventListener("${l.type}") on <${nm}>`;
                    box.appendChild(d);
                });
            };

            this.render();
        }
    });
})();
