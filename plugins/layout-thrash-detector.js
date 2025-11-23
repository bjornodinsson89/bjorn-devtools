// layout-thrash-detector.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("layoutThrashDetector",{
 name:"Layout Thrash",
 api:null,
 lastNow:0,

 onLoad(api){
  this.api=api;
  api.unsafe.register("layoutThrashDetector","Detect forced reflows");

  const origGet=Element.prototype.getBoundingClientRect;
  const self=this;

  Element.prototype.getBoundingClientRect=function(){
   const now=performance.now();
   if(now-self.lastNow<4){
    self.api.log("[layoutThrash] Rapid reflow detected");
   }
   self.lastNow=now;
   return origGet.apply(this,arguments);
  };
 }
});
})();
