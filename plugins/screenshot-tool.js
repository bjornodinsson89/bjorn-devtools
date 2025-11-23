// plugins/screenshot-tool.js
(function(){
    const DevTools=window.BjornDevTools;
    if(!DevTools)return;

    // unsafe: reading pixels (security sensitive)
    DevTools.unsafe.register("screenshotTool", ["capture"]);

    DevTools.registerPlugin("screenshotTool",{
        name:"Screenshot",
        tab:"screenshotTool",

        onLoad(api){
            this.api=api;

            api.commands.register("shot",()=>{
                if(!api.ensureUnsafe("screenshotTool.capture")) return;
                this.capture();
            });

            api.log("[screenshotTool] ready");
        },

        async capture(){
            try{
                // Try built-in capture (html2canvas replacement: rasterize via SVG foreignObject)
                const w=window.innerWidth, h=window.innerHeight;

                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
                        <foreignObject x="0" y="0" width="100%" height="100%">
                            ${new XMLSerializer().serializeToString(document.documentElement)}
                        </foreignObject>
                    </svg>`;

                const url="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);

                const img=new Image();
                img.crossOrigin="anonymous";
                img.src=url;

                await img.decode();

                const canvas=document.createElement("canvas");
                canvas.width=w;
                canvas.height=h;
                const ctx=canvas.getContext("2d");
                ctx.drawImage(img,0,0);

                window.open(canvas.toDataURL(),"_blank");
                this.api.log("Screenshot captured.");

            }catch(e){
                this.api.log("ERR screenshot: "+e.message);
            }
        },

        onMount(view){
            view.innerHTML=`<div style="font-size:11px;">Use command: <b>shot</b></div>`;
        }
    });
})();
