// advanced-theme.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("advancedTheme",{
 name:"Appearance",
 api:null,
 node:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("advancedTheme","Apply custom CSS themes");
 },

 apply(css){
  if(!this.api.unsafe.ensure("advancedTheme"))return;
  if(this.node)this.node.remove();
  const s=document.createElement("style");
  s.textContent=css;
  document.documentElement.appendChild(s);
  this.node=s;
 },

 reset(){
  if(this.node)this.node.remove();
  this.node=null;
 }
});
})();
