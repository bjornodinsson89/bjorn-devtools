// storage-inspector.js (UI PANEL)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("storageInspector",{
 name:"Storage",
 tab:"Storage",
 view:null,
 api:null,

 onLoad(api){this.api=api},

 onMount(v){
  this.view=v;
  v.innerHTML=`
   <div class='bdt-store'>
     <h3>LocalStorage</h3><div class='ls'></div>
     <h3>SessionStorage</h3><div class='ss'></div>
     <h3>Cookies</h3><div class='ck'></div>
   </div>`;
  this.ls=v.querySelector(".ls");
  this.ss=v.querySelector(".ss");
  this.ck=v.querySelector(".ck");
  this.render();
 },

 render(){
  if(!this.ls)return;

  let l="",s="",c="";

  for(let k in localStorage){
   try{l+=`<div>${k}: ${localStorage.getItem(k)}</div>`}catch{}
  }
  for(let k in sessionStorage){
   try{s+=`<div>${k}: ${sessionStorage.getItem(k)}</div>`}catch{}
  }

  document.cookie.split(";").forEach(p=>{
   const t=p.trim();
   if(!t)return;
   const i=t.indexOf("=");
   const k=(i>-1?t.slice(0,i):t);
   const v=(i>-1?t.slice(i+1):"");
   c+=`<div>${k}: ${v}</div>`;
  });

  this.ls.innerHTML=l;
  this.ss.innerHTML=s;
  this.ck.innerHTML=c;
 }
});
})();
