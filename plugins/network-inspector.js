// network-inspector.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("networkInspector",{
 name:"Network Inspector",
 tab:"Network",
 entries:[],
 view:null,

 onLoad(api){
  this.api=api;
  api.networkBus.on("requestStart",r=>{this.entries.push(r);this.render()});
  api.networkBus.on("requestEnd",r=>{this.entries.push(r);this.render()});
 },

 onMount(v,api){
  this.view=v;this.api=api;
  v.innerHTML="<div class='bdt-net-list'></div>";
  this.list=v.querySelector(".bdt-net-list");
  this.render();
 },

 render(){
  if(!this.list)return;
  let html="";
  for(let r of this.entries){
   html+=`<div class='bdt-net-row'>
    <span>${r.method}</span>
    <span>${r.url}</span>
    <span>${((r.end||0)-(r.start||0)).toFixed(1)}ms</span>
    <span>${r.ok?"OK":"ERR"}</span>
   </div>`;
  }
  this.list.innerHTML=html;
 }
});
})();
