// commands.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("commands",{
 name:"Commands",
 tab:"Commands",
 api:null,
 view:null,

 onLoad(api){this.api=api},

 onMount(v){
  this.view=v;
  v.innerHTML="<div class='bdt-commands'></div>";
  this.box=v.querySelector(".bdt-commands");
  this.render();
 },

 render(){
  if(!this.box)return;
  const cmds=DT.commands;
  let html="";
  for(const c in cmds){
   const d=cmds[c].desc||"";
   html+=`<div class='cmd-row'><strong>${c}</strong> — ${d}</div>`;
  }
  this.box.innerHTML=html;
 }
});
})();
