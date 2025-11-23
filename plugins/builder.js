// builder.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("builder",{
 name:"Builder",
 api:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("builder","AST tools");
 },

 ast(str){
  try{
   return (new Function("return "+str))();
  }catch(e){
   this.api.log("[builder] "+e.message);
   return null;
  }
 }
});
})();
