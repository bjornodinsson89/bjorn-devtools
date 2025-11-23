// layout-overlay.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("layoutOverlay",{
 name:"Layout Overlay",
 overlay:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("layoutOverlay","DOM overlay");
 },

 highlight(el){
  if(!el)return;
  if(!this.overlay){
   this.overlay=document.createElement("div");
   this.overlay.style.cssText="position:fixed;z-index:999999;pointer-events:none;border:2px solid red;";
   document.body.appendChild(this.overlay);
  }
  const r=el.getBoundingClientRect();
  Object.assign(this.overlay.style,{
   left:r.left+"px",top:r.top+"px",
   width:r.width+"px",height:r.height+"px"
  });
 },

 hide(){
  if(this.overlay)this.overlay.style.width="0";
 }
});
})();
