// heap-leak-detector.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("heapInspector",{
 name:"Heap Inspector",
 api:null,
 last:{nodes:0,mem:0},

 onLoad(api){
  this.api=api;
  api.unsafe.register("heapInspector","Memory polling");
  this.poll();
 },

 poll(){
  if(!this.api)return;
  if(!this.api.unsafe.ensure("heapInspector")){
   setTimeout(()=>this.poll(),5000);
   return;
  }
  const nodes=document.getElementsByTagName("*").length;
  const mem=performance.memory?performance.memory.usedJSHeapSize:0;

  if(nodes>this.last.nodes*1.3){
   this.api.log("[heap] Node leak suspected :: "+nodes+" nodes");
  }
  if(mem>this.last.mem*1.3){
   this.api.log("[heap] Memory spike :: "+mem);
  }

  this.last={nodes,mem};
  setTimeout(()=>this.poll(),5000);
 }
});
})();
