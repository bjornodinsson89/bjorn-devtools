// File: plugins/heap-leak-detector.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("heapInspector",{
        name:"Heap Inspector",
        tab:"heapInspector",
        samples:[],
        domCounts:[],

        onLoad(api){
            this.api = api;
            if (api.unsafe && api.unsafe.register) {
                api.unsafe.register("heapInspector","Poll performance.memory and DOM size");
            }

            this.poll();
        },

        poll(){
            const take = ()=>{
                if (this.api && this.api.unsafe && !this.api.unsafe.ensure("heapInspector")) {
                    setTimeout(take,5000);
                    return;
                }

                const time = new Date();
                let used = null;
                if (performance && performance.memory && performance.memory.usedJSHeapSize != null) {
                    used = performance.memory.usedJSHeapSize;
                }
                const domCount = document.getElementsByTagName("*").length;
                this.samples.push({time,used});
                this.domCounts.push({time,domCount});
                if (this.samples.length>200) this.samples.shift();
                if (this.domCounts.length>200) this.domCounts.shift();
                if (this.view) this.render();
                setTimeout(take,5000);
            };
            take();
        },

        onMount(view){
            this.view = view;
            view.innerHTML = `
              <div style="font-family:var(--bdt-code,monospace);font-size:11px;">
                <div style="margin-bottom:6px;opacity:0.8;">Heap usage and DOM node count trends.</div>
                <div class="bdt-hi-graph" style="height:120px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);margin-bottom:8px;position:relative;overflow:hidden;"></div>
                <div class="bdt-hi-dom" style="max-height:220px;overflow:auto;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;"></div>
              </div>
            `;
            this.graphBox = view.querySelector(".bdt-hi-graph");
            this.listBox = view.querySelector(".bdt-hi-dom");
            this.render();
        },

        render(){
            if (!this.view) return;
            this.renderGraph();
            this.renderList();
        },

        renderGraph(){
            if (!this.graphBox) return;
            const box = this.graphBox;
            const w = box.clientWidth || 300;
            const h = box.clientHeight || 120;
            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS,"svg");
            svg.setAttribute("width",w);
            svg.setAttribute("height",h);
            const points = this.samples.filter(s=>s.used!=null);
            if (points.length){
                const max = Math.max.apply(null,points.map(p=>p.used));
                const min = Math.min.apply(null,points.map(p=>p.used));
                const span = (max-min)||1;
                let d="M0 "+h;
                points.forEach((p,i)=>{
                    const x = (i/(points.length-1||1))*w;
                    const y = h - ((p.used-min)/span)*h;
                    d += " L"+x+" "+y;
                });
                d += " L"+w+" "+h+" Z";
                const path = document.createElementNS(svgNS,"path");
                path.setAttribute("d",d);
                path.setAttribute("fill","rgba(255,120,0,0.3)");
                svg.appendChild(path);
            }
            box.innerHTML="";
            box.appendChild(svg);
        },

        renderList(){
            if (!this.listBox) return;
            const frag = document.createDocumentFragment();
            this.domCounts.slice(-100).forEach(s=>{
                const div = document.createElement("div");
                div.style.cssText="padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.06);";
                div.textContent = `${s.time.toLocaleTimeString()} – DOM nodes: ${s.domCount}`;
                frag.appendChild(div);
            });
            this.listBox.innerHTML="";
            this.listBox.appendChild(frag);
        },

        onUnload(){
            this.view=null;
            this.graphBox=null;
            this.listBox=null;
        }
    });
})();
