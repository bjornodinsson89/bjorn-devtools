// plugin-manager.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("pluginManager",{
 name:"Plugins",
 tab:"Plugins",
 view:null,
 api:null,

 onLoad(api){this.api=api},

 onMount(v){
  this.view=v;
  v.innerHTML="<div class='bdt-pm'></div>";
  this.box=v.querySelector(".bdt-pm");
  this.render();
 },

 render(){
  if(!this.box)return;
  const reg=DT.plugins.registry;
  let html="";
  for(const id in reg){
   const r=reg[id];
   const st=r.status||"unknown";
   html+=`
    <div class='pm-row'>
     <span>${id}</span>
     <span>${st}</span>
     <button data-pm="${id}">Reload</button>
    </div>`;
  }
  this.box.innerHTML=html;

  this.box.querySelectorAll("button[data-pm]").forEach(b=>{
   b.onclick=()=>{
    const id=b.getAttribute("data-pm");
    DT.plugins.unload(id);
    const rec=DT.plugins.registry[id];
    rec.status="pending";rec.plugin=null;
    DT.plugins.load({id,src:rec.src,name:id});
   };
  });
 }
});
})();
