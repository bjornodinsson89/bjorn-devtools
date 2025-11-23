// network-bus.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

let L={requestStart:[],requestEnd:[]};
function emit(t,p){(L[t]||[]).forEach(fn=>fn(p))}
function on(t,fn){(L[t]||(L[t]=[])).push(fn)}

/* FETCH */
if(!window._bdtFetchPatched){
window._bdtFetchPatched=true;
const F=window.fetch.bind(window);
window.fetch=function(i,n){
 const url=(typeof i==="string"?i:i.url),m=(n&&n.method)||"GET",s=performance.now();
 emit("requestStart",{url,method:m,start:s,type:"fetch"});
 return F(i,n).then(r=>{
   emit("requestEnd",{url,method:m,start:s,end:performance.now(),ok:r.ok,type:"fetch"});
   return r;
 }).catch(e=>{
   emit("requestEnd",{url,method:m,start:s,end:performance.now(),ok:false,error:String(e),type:"fetch"});
   throw e;
 });
};
}

/* XHR */
if(!window._bdtXHRPatched){
window._bdtXHRPatched=true;
const O=window.XMLHttpRequest;
function X(){const x=new O();let rec=null;
 x.addEventListener("loadstart",()=>{
   const url=x.responseURL||"",s=performance.now();
   rec={url,method:x._bdtMethod||"GET",start:s};
   emit("requestStart",rec);
 });
 x.addEventListener("loadend",()=>{
   if(!rec)return;
   rec.end=performance.now();
   rec.ok=(x.status>=200&&x.status<400);
   emit("requestEnd",rec);
 });
 return x;
}
X.prototype=O.prototype;
window.XMLHttpRequest=X;
const origOpen=O.prototype.open;
O.prototype.open=function(m,u){this._bdtMethod=m;return origOpen.apply(this,arguments)};
}

/* REGISTER */
DT.registerPlugin("networkBus",{
 name:"Network Bus",
 onLoad(api){api.networkBus={on}}
});
})();
