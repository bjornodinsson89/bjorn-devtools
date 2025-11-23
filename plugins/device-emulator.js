// device-emulator.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("deviceEmulator",{
 name:"Device Emulator",
 api:null,
 active:null,

 presets:{
  iphone14:{w:390,h:844},
  ipadPro:{w:1024,h:1366},
  pixel6:{w:412,h:915},
  galaxyFold:{w:280,h:653}
 },

 onLoad(api){
  this.api=api;
  api.unsafe.register("deviceEmulator","Resize viewport");
 },

 emulate(name){
  if(!this.api.unsafe.ensure("deviceEmulator"))return;
  const p=this.presets[name];
  if(!p)return this.api.log("[device] Unknown preset: "+name);

  document.documentElement.style.width=p.w+"px";
  document.documentElement.style.height=p.h+"px";
  document.documentElement.style.overflow="hidden";
  this.active=name;
  this.api.log("[device] Emulating "+name);
 },

 reset(){
  document.documentElement.style.width="";
  document.documentElement.style.height="";
  document.documentElement.style.overflow="";
  this.active=null;
  this.api.log("[device] Reset");
 }
});
})();
