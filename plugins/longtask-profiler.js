// longtask-profiler.js (HEADLESS)
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("longtaskProfiler",{
 name:"Long Tasks",
 tasks:[],
 api:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("longtaskProfiler","Long task monitoring");

  const obs=new PerformanceObserver(list=>{
   for(const e of list.getEntries()){
    if(e.duration>50){
     this.tasks.push({dur:e.duration,ts:Date.now()});
     this.api.log("[longtask] "+e.duration.toFixed(1)+"ms");
    }
   }
  });

  try{obs.observe({entryTypes:["longtask"]})}catch(e){}
 }
});
})();
