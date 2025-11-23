// themes.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("themes",{
 name:"Themes",
 css:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("themes","Apply custom themes");
 },

 apply(cssText){
  if(this.css)this.css.remove();
  const s=document.createElement("style");
  s.textContent=cssText;
  document.documentElement.appendChild(s);
  this.css=s;
 }
});
})();
