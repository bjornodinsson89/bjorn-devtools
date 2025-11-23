// dom-inspector.js
(function(){
const DT=window.BjornDevTools;if(!DT||!DT.registerPlugin)return;

DT.registerPlugin("domInspector",{
 name:"DOM",
 tab:"DOM",
 api:null,
 view:null,

 onLoad(api){
  this.api=api;
  api.unsafe.register("domInspector","Select DOM nodes");
 },

 onMount(v){
  this.view=v;
  v.innerHTML="<div class='bdt-dom-tree'></div>";
  this.tree=v.querySelector(".bdt-dom-tree");
  this.render();
 },

 render(){
  if(!this.tree)return;
  this.tree.innerHTML=this.buildNode(document.body,0);
 },

 buildNode(n,depth){
  if(!n)return"";
  const pad="margin-left:"+(depth*14)+"px";
  let html=`<div class='dom-node' style='${pad}'>${n.tagName}`;
  for(const ch of n.children)html+=this.buildNode(ch,depth+1);
  return html+"</div>";
 }
});
})();
