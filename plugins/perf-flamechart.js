// perf-flamechart.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("perfTimeline",{
 name:"Perf Timeline",
 tab:"Perf Timeline",
 api:null,
 view:null,
 data:[],
 running:false,
 last:0,

 onLoad(api){
  this.api=api;
  api.unsafe.register("perfTimeline","Perf sampling");
 },

 onMount(v){
  this.view=v;
  v.innerHTML="<canvas class='bdt-flame' width='800' height='300' style='width:100%;height:300px;'></canvas>";
  this.canvas=v.querySelector(".bdt-flame");
  this.ctx=this.canvas.getContext("2d");
  this.start();
 },

 start(){
  if(this.running)return;
  this.running=true;
  this.sample();
 },

 stop(){this.running=false},

 sample(){
  if(!this.running)return;

  const now=performance.now();
  if(this.last){
   const dur=now-this.last;
   this.data.push(dur);
   if(this.data.length>800)this.data.shift();
   this.render();
  }
  this.last=now;

  requestAnimationFrame(()=>this.sample());
 },

 render(){
  if(!this.ctx)return;

  const ctx=this.ctx;
  const w=this.canvas.width;
  const h=this.canvas.height;

  ctx.clearRect(0,0,w,h);
  ctx.fillStyle="#ffb080";

  const max=Math.max(...this.data,16);
  const scale=h/max;

  let x=0;
  for(const d of this.data){
   const bar=d*scale;
   ctx.fillRect(x,h-bar,1,bar);
   x++;
  }
 }
});
})();
