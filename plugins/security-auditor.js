// security-auditor.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("securityAudit",{
 name:"Security Audit",
 logs:[],
 api:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("securityAudit","Security warnings");

  api.networkBus.on("requestEnd",r=>{
   if(r.ok===false){
    this.log("Network Error",r.url+" :: "+(r.error||"status fail"));
   }
  });

  window.addEventListener("securitypolicyviolation",e=>{
   this.log("CSP",e.violatedDirective+" :: "+e.blockedURI);
  });
 },

 log(t,m){
  this.logs.push({t,m,ts:Date.now()});
  this.api.log(`[Security][${t}] ${m}`);
 }
});
})();
