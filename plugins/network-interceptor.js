// network-interceptor.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("networkInterceptor",{
 name:"Interceptor",
 rules:[],
 api:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("networkInterceptor","Intercept requests");

  api.networkBus.on("requestStart",r=>{
   for(let pat of this.rules){
    if(r.url.includes(pat)){
     r._bdtBlocked=true;
     this.api.log("[interceptor] matched "+pat+" :: "+r.url);
    }
   }
  });

  api.networkBus.on("requestEnd",r=>{
   if(r._bdtBlocked){
    this.api.log("[interceptor] completed blocked "+r.url);
   }
  });
 },

 addRule(p){this.rules.push(p)},
 clearRules(){this.rules=[]}
});
})();
