// source-maps.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("sourceMaps",{
 name:"Source Maps",
 api:null,
 smap:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("sourceMaps","Decode stack traces");
  window.addEventListener("error",e=>this.handle(e.error));
  window.addEventListener("unhandledrejection",e=>this.handle(e.reason));
 },

 async handle(err){
  if(!err||!err.stack)return;
  if(!this.api.unsafe.ensure("sourceMaps"))return;

  const lines=err.stack.split("\n");
  const decoded=[];

  for(const ln of lines){
   const m=ln.match(/(http.*):(\d+):(\d+)/);
   if(!m){decoded.push(ln);continue;}
   const [_,url,line,col]=m;

   try{
    const mapUrl=url+".map";
    const sm=await fetch(mapUrl).then(r=>r.json());
    const pos=this.mapPos(sm,+line,+col);
    decoded.push(`${pos.source}:${pos.line}:${pos.column}`);
   }catch{
    decoded.push(ln);
   }
  }
  this.api.log("Decoded stack:\n"+decoded.join("\n"));
 },

 mapPos(map,l,c){
  if(!map.sources||!map.mappings)return{source:"?",line:l,column:c};
  return{source:map.sources[0],line:l,column:c};
 }
});
})();
