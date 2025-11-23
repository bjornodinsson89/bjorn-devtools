// node-screenshot.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("nodePreview",{
 name:"Node Preview",
 api:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("nodePreview","Capture element screenshots");
 },

 capture(el){
  if(!this.api.unsafe.ensure("nodePreview"))return;
  if(!el)return;

  if(window.html2canvas){
   html2canvas(el).then(c=>{
    this.save(c.toDataURL("image/png"));
   });
   return;
  }

  try{
   const r=el.getBoundingClientRect();
   const c=document.createElement("canvas");
   c.width=r.width;c.height=r.height;
   const ctx=c.getContext("2d");
   ctx.drawImage(document.documentElement,-r.left,-r.top);
   this.save(c.toDataURL("image/png"));
  }catch(e){
   this.api.log("[nodePreview] "+e.message);
  }
 },

 save(data){
  const a=document.createElement("a");
  a.href=data;a.download="node.png";a.click();
 }
});
})();
