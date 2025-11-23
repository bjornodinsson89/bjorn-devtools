// event-listener-tracker.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("eventListenerTracker",{
 name:"Event Tracker",
 api:null,
 calls:[],
 origAdd:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("eventListenerTracker","Track addEventListener");

  const self=this;
  this.origAdd=EventTarget.prototype.addEventListener;

  EventTarget.prototype.addEventListener=function(t,h,o){
   self.calls.push({ts:Date.now(),type:t,target:this});
   return self.origAdd.call(this,t,h,o);
  };
 }
});
})();
