// plugins/websocket-monitor.js
(function(){
    const DevTools=window.BjornDevTools;
    if(!DevTools)return;

    DevTools.registerPlugin("websocketMonitor",{
        name:"WebSockets",
        tab:"websocketMonitor",

        onLoad(api){
            this.api=api;
            this.logs=[];
            this.render=null;

            if(!window.__bdt_ws_patch__){
                window.__bdt_ws_patch__=true;
                const Orig=window.WebSocket;
                const self=this;

                window.WebSocket=function(url,protos){
                    const ws=new Orig(url,protos);
                    self.logs.push({type:"open",url,time:new Date()});
                    ws.addEventListener("message",(e)=>{
                        self.logs.push({type:"msg",data:e.data,time:new Date()});
                        self.render && self.render();
                    });
                    ws.addEventListener("close",()=>{
                        self.logs.push({type:"close",time:new Date()});
                    });
                    ws.addEventListener("error",()=>{
                        self.logs.push({type:"error",time:new Date()});
                    });
                    return ws;
                };
            }

            api.log("[websocketMonitor] ready");
        },

        onMount(view){
            view.innerHTML=`<div class="bdt-ws" style="font-size:11px;"></div>`;
            const box=view.querySelector(".bdt-ws");

            this.render=()=>{
                box.innerHTML="";
                this.logs.slice(-200).forEach(l=>{
                    const d=document.createElement("div");
                    d.textContent=`[${l.type}] ${l.time.toLocaleTimeString()} ${l.data||l.url||""}`;
                    box.appendChild(d);
                });
            };

            this.render();
        }
    });
})();
