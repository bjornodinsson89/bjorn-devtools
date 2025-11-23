// screenshot-tool.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("screenshotTool",{
 name:"ScreenshotTool",
 api:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("screenshotTool","Capture screenshots");
 },

 capture(el=document.body){
  if(!this.api.unsafe.ensure("screenshotTool"))return;

  if(window.html2canvas){
   html2canvas(el).then(c=>{
    this.download(c.toDataURL("image/png"),"capture.png");
   });
   return;
  }

  try{
   const r=el.getBoundingClientRect();
   const c=document.createElement("canvas");
   c.width=r.width;c.height=r.height;
   const ctx=c.getContext("2d");
   ctx.drawImage(document.documentElement,-r.left,-r.top);
   this.download(c.toDataURL("image/png"),"capture.png");
  }catch(e){
   this.api.log("[screenshot] "+e.message);
  }
 },

 download(dataURL,fname){
  const a=document.createElement("a");
  a.href=dataURL;a.download=fname;a.click();
 }
});
})();
