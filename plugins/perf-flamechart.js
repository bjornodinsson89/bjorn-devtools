// File: plugins/perf-flamechart.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("perfTimeline",{
        name:"Perf Timeline",
        tab:"perfTimeline",
        marks:[],
        measures:[],
        rafSamples:[],

        onLoad(api){
            this.api = api;
            if (api.unsafe && api.unsafe.register) {
                api.unsafe.register("perfTimeline","Collect performance marks and frames");
            }

            if (performance && performance.getEntriesByType) {
                this.marks = performance.getEntriesByType("mark") || [];
                this.measures = performance.getEntriesByType("measure") || [];
            }

            const origMark = performance.mark ? performance.mark.bind(performance) : null;
            if (origMark){
                performance.mark = (name)=>{
                    const t0 = performance.now();
                    origMark(name);
                    this.marks.push({name,startTime:t0});
                    if (this.view) this.render();
                };
            }

            const loop = ()=>{
                const t = performance.now();
                this.rafSamples.push(t);
                if (this.rafSamples.length>400) this.rafSamples.shift();
                if (this.view) this.renderMini();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        },

        onMount(view){
            this.view = view;
            view.innerHTML = `
              <div style="font-family:var(--bdt-code,monospace);font-size:11px;">
                <div style="margin-bottom:6px;opacity:0.8;">Shows marks/measures and frame timing.</div>
                <canvas class="bdt-pt-canvas" style="width:100%;height:140px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:#050509;"></canvas>
                <div class="bdt-pt-list" style="margin-top:8px;max-height:220px;overflow:auto;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;"></div>
              </div>
            `;
            this.canvas = view.querySelector(".bdt-pt-canvas");
            this.listBox = view.querySelector(".bdt-pt-list");
            this.render();
        },

        renderMini(){
            if (!this.canvas) return;
            const ctx = this.canvas.getContext("2d");
            const w = this.canvas.width = this.canvas.clientWidth;
            const h = this.canvas.height = this.canvas.clientHeight;
            ctx.fillStyle = "#050509";
            ctx.fillRect(0,0,w,h);
            const samples = this.rafSamples;
            if (!samples.length) return;
            const min = samples[0];
            const max = samples[samples.length-1];
            const span = max - min || 1;
            ctx.beginPath();
            ctx.moveTo(0,h);
            samples.forEach((t,i)=>{
                const dt = i>0 ? t - samples[i-1] : 16;
                const y = h - Math.min(h, dt*3);
                const x = ( (t-min)/span )*w;
                ctx.lineTo(x,y);
            });
            ctx.lineTo(w,h);
            ctx.closePath();
            ctx.fillStyle = "rgba(0,255,160,0.4)";
            ctx.fill();
        },

        render(){
            if (!this.view || !this.listBox) return;
            this.renderMini();
            const frag = document.createDocumentFragment();
            const all = []
                .concat(this.marks.map(m=>({type:"mark",name:m.name,startTime:m.startTime})))
                .concat(this.measures.map(m=>({type:"measure",name:m.name,startTime:m.startTime,duration:m.duration})));
            all.sort((a,b)=>a.startTime-b.startTime);
            all.slice(0,200).forEach(e=>{
                const div = document.createElement("div");
                div.style.cssText = "padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.06);";
                const label = e.type==="mark" ? "MARK" : "MEASURE";
                const dur = e.duration!=null ? ` (${e.duration.toFixed(2)}ms)` : "";
                div.textContent = `[${label}] ${e.name} @ ${e.startTime.toFixed(2)}ms${dur}`;
                frag.appendChild(div);
            });
            this.listBox.innerHTML = "";
            this.listBox.appendChild(frag);
        },

        onUnload(){
            this.view=null;
            this.canvas=null;
            this.listBox=null;
        }
    });
})();
