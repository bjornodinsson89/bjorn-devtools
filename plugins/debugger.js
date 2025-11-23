// debugger.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("debugger",{
 name:"Debugger",
 tab:"Debugger",
 api:null,
 view:null,
 logs:[],

 onLoad(api){
  this.api=api;
  api.unsafe.register("debugger","Eval, stack, breakpoints");
 },

 onMount(v){
  this.view=v;
  v.innerHTML="<div class='bdt-debug'></div>";
  this.box=v.querySelector(".bdt-debug");
  this.render();
 },

 log(msg){
  this.logs.push({msg,ts:Date.now()});
  if(this.box)this.render();
 },

 render(){
  if(!this.box)return;
  let html="";
  for(const l of this.logs){
   html+=`<div class='dbg-line'>${new Date(l.ts).toLocaleTimeString()} — ${l.msg}</div>`;
  }
  this.box.innerHTML=html;
 },

 evalExpr(expr){
  if(!this.api.unsafe.ensure("debugger"))return;
  try{
   const r=(new Function("return ("+expr+")"))();
   this.log("eval: "+expr+" -> "+String(r));
   return r;
  }catch(e){
   this.log("ERR: "+e.message);
  }
 }
});
})();
