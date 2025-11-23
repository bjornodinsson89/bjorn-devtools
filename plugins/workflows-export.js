// workflows-export.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("workflows",{
 name:"Workflows",
 tab:"Workflows",
 api:null,
 view:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("workflows","Export/Import");
 },

 onMount(v){
  this.view=v;
  v.innerHTML=`
   <button class='wf-exp'>Export JSON</button>
   <input type='file' class='wf-imp' style='margin-left:10px;'>
   <pre class='wf-out'></pre>`;
  this.out=v.querySelector(".wf-out");

  v.querySelector(".wf-exp").onclick=()=>this.export();
  v.querySelector(".wf-imp").onchange=e=>this.import(e.target.files[0]);
 },

 export(){
  if(!this.api.unsafe.ensure("workflows"))return;

  const dump={
   plugins:Object.keys(DT.plugins.registry),
   state:DT.state,
   timestamp:Date.now()
  };

  const data=JSON.stringify(dump,null,2);
  const a=document.createElement("a");
  a.href="data:application/json,"+encodeURIComponent(data);
  a.download="devtools-export.json";
  a.click();

  this.out.textContent="Exported devtools-export.json";
 },

 import(file){
  if(!this.api.unsafe.ensure("workflows"))return;

  const r=new FileReader();
  r.onload=()=>{
   try{
    const obj=JSON.parse(r.result);
    this.out.textContent="Imported:\n"+JSON.stringify(obj,null,2);
   }catch(e){
    this.out.textContent="ERR: "+e.message;
   }
  };
  r.readAsText(file);
 }
});
})();
