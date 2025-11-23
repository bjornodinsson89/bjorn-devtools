// step-debugger.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("stepDebugger",{
 name:"Step Debugger",
 tab:"Step Debugger",
 api:null,
 view:null,
 stack:[],
 active:false,

 onLoad(api){
  this.api=api;
  api.unsafe.register("stepDebugger","Pause & inspect");
 },

 onMount(v){
  this.view=v;
  v.innerHTML="<div class='bdt-sd-list'></div>";
  this.list=v.querySelector(".bdt-sd-list");
  this.render();
 },

 pause(){
  if(!this.api.unsafe.ensure("stepDebugger"))return;
  const err=new Error();
  this.stack.push(err.stack||"no stack");
  this.active=true;
  this.render();
 },

 resume(){this.active=false},

 render(){
  if(!this.list)return;
  let html="<h3>Captured Pauses</h3>";
  for(const s of this.stack){
   html+=`<pre class='sd-frame'>${s}</pre>`;
  }
  this.list.innerHTML=html;
 }
});
})();
