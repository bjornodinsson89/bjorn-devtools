// websocket-monitor.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("websocketMonitor",{
 name:"WebSockets",
 tab:"WebSockets",
 conns:[],
 view:null,

 onLoad(api){
  this.api=api;

  const OrigWS=window.WebSocket;
  window.WebSocket=function(u,p){
   const ws=new OrigWS(u,p);
   const rec={url:u,msgs:[],ts:Date.now()};
   DT.plugins.registry.websocketMonitor.plugin.conns.push(rec);

   ws.addEventListener("message",e=>{
    rec.msgs.push({dir:"in",data:e.data,ts:Date.now()});
    DT.plugins.registry.websocketMonitor.plugin.render();
   });
   const send=ws.send;
   ws.send=function(d){
    rec.msgs.push({dir:"out",data:d,ts:Date.now()});
    DT.plugins.registry.websocketMonitor.plugin.render();
    return send.call(ws,d);
   };
   return ws;
  };
 },

 onMount(v){
  this.view=v;
  v.innerHTML="<div class='bdt-ws'></div>";
  this.box=v.querySelector(".bdt-ws");
  this.render();
 },

 render(){
  if(!this.box)return;
  let html="";
  for(let c of this.conns){
   html+=`<div class='ws-conn'><div>${c.url}</div>`;
   for(let m of c.msgs){
    html+=`<div class='ws-msg ${m.dir}'>${m.dir}: ${m.data}</div>`;
   }
   html+="</div>";
  }
  this.box.innerHTML=html;
 }
});
})();
