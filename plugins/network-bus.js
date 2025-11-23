// network-bus.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("networkBus",{
 name:"NetworkBus",
 api:null,
 listeners:{start:[],end:[]},

 onLoad(api){
  this.api=api;

  const sendStart=(info)=>{
   for(const f of this.listeners.start)try{f(info)}catch{}
  };
  const sendEnd=(info)=>{
   for(const f of this.listeners.end)try{f(info)}catch{}
  };

  const origFetch=window.fetch;
  window.fetch=async(...args)=>{
   const url=args[0];
   const req={url,method:"GET",args,timestamp:performance.now()};
   sendStart(req);
   const res=await origFetch(...args);
   sendEnd({url,status:res.status,timestamp:performance.now()});
   return res;
  };

  const origOpen=XMLHttpRequest.prototype.open;
  const origSend=XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open=function(m,u){
   this._bdt={method:m,url:u,start:0};
   return origOpen.apply(this,arguments);
  };

  XMLHttpRequest.prototype.send=function(b){
   const info=this._bdt;
   info.start=performance.now();
   sendStart(info);

   this.addEventListener("loadend",()=>{
    sendEnd({...info,status:this.status,time:performance.now()-info.start});
   });

   return origSend.apply(this,arguments);
  };

  api.networkBus={
   on:(ev,fn)=>{
    if(ev==="requestStart")this.listeners.start.push(fn);
    if(ev==="requestEnd")this.listeners.end.push(fn);
   }
  };
 }
});
})();
