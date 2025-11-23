// network-waterfall.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("netWaterfall",{
 name:"Net Waterfall",
 tab:"Net Waterfall",
 entries:[],
 view:null,

 onLoad(api){
  this.api=api;
  api.networkBus.on("requestStart",r=>{this.entries.push(r);this.render()});
  api.networkBus.on("requestEnd",r=>{this.entries.push(r);this.render()});
 },

 onMount(v,api){
  this.view=v;this.api=api;
  v.innerHTML="<div class='bdt-water'></div>";
  this.box=v.querySelector(".bdt-water");
  this.render();
 },

 render(){
  if(!this.box)return;
  let html="";
  for(let r of this.entries){
   let dur=(r.end?r.end:performance.now())-r.start;
   html+=`<div class='wf-row'>
    <span>${r.method}</span>
    <span>${r.url}</span>
    <div class='wf-bar' style='width:${dur/2}px'></div>
    <span>${dur.toFixed(1)}ms</span>
   </div>`;
  }
  this.box.innerHTML=html;
 }
});
})();
