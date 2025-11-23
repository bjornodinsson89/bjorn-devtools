// plugins/websocket-monitor.js
(function(){
    const DevTools = window.BjornDevTools;
    if(!DevTools || !DevTools.registerPlugin) return;

    DevTools.registerPlugin("websocketMonitor",{
        name:"WebSockets",
        tab:"websocketMonitor",
        isActive:true,
        logs:[],
        listener:null,
        renderFn:null,

        onLoad(api){
            this.api = api;
            this.logs = [];
            this.isActive = true;

            // Declare unsafe tool
            api.unsafe.register("websocketMonitor", "Hook WebSocket and log frames");

            // Respect SAFE/unsafe gating BEFORE patching
            if (!api.unsafe.ensure("websocketMonitor")) {
                api.log && api.log("[websocketMonitor] SAFE/unsafe gate prevented WebSocket hook.");
                return;
            }

            if (!window.__bdt_ws_patch__) {
                const Orig = window.WebSocket;
                if (!Orig) {
                    api.log && api.log("[websocketMonitor] window.WebSocket is not available.");
                    return;
                }

                const desc = Object.getOwnPropertyDescriptor(window, "WebSocket");

                if (desc && !desc.writable && !desc.configurable) {
                    api.log && api.log("[websocketMonitor] WebSocket is non-writable/non-configurable; cannot patch.");
                    return;
                }

                window.__bdt_ws_patch__ = {
                    listeners: [],
                    Orig
                };

                function MonitoredWebSocket(url, protocols) {
                    const ws = (protocols !== undefined)
                        ? new Orig(url, protocols)
                        : new Orig(url);

                    window.__bdt_ws_patch__.listeners.forEach(fn => {
                        try { fn(ws, url); }
                        catch (e) { console.error("[BjornDevTools WS listener error]", e); }
                    });

                    return ws;
                }

                MonitoredWebSocket.prototype = Orig.prototype;
                try {
                    Object.keys(Orig).forEach(k => {
                        MonitoredWebSocket[k] = Orig[k];
                    });
                } catch (_) {}

                try {
                    window.WebSocket = MonitoredWebSocket;
                } catch (e) {
                    api.log && api.log("[websocketMonitor] Failed to assign patched WebSocket: " + e.message);
                    return;
                }
            }

            this.listener = (ws, url) => {
                if (!this.isActive) return;

                this.addLog("open", url);

                ws.addEventListener("message", e => {
                    if (!this.isActive) return;
                    this.addLog("msg", e && e.data);
                });

                ws.addEventListener("close", e => {
                    if (!this.isActive) return;
                    const code = e && e.code;
                    this.addLog("close", code != null ? `code=${code}` : null);
                });

                ws.addEventListener("error", () => {
                    if (!this.isActive) return;
                    this.addLog("error", null);
                });
            };

            window.__bdt_ws_patch__.listeners.push(this.listener);
            api.log && api.log("[websocketMonitor] WebSocket hook ready");
        },

        onUnload(){
            this.isActive = false;

            if (window.__bdt_ws_patch__ && this.listener) {
                const idx = window.__bdt_ws_patch__.listeners.indexOf(this.listener);
                if (idx > -1) window.__bdt_ws_patch__.listeners.splice(idx, 1);
            }

            this.listener = null;
            this.renderFn = null;
        },

        addLog(type, data){
            // dynamic gating: do not log if SAFE is ON or tool is OFF
            if (this.api && this.api.state && this.api.unsafe) {
                if (this.api.state.safe() || !this.api.unsafe.isToolEnabled("websocketMonitor")) {
                    return;
                }
            }

            this.logs.push({type, data, time:new Date()});
            if(this.logs.length > 500) this.logs.shift();
            if(this.renderFn) this.renderFn();
        },

        onMount(view){
            view.innerHTML=`<div class="bdt-ws" style="font-family:var(--bdt-font-mono,monospace);font-size:12px;padding:10px;"></div>`;
            const box=view.querySelector(".bdt-ws");

            this.renderFn=()=>{
                const frag = document.createDocumentFragment();
                const latest = this.logs.slice(-100);

                latest.forEach(l=>{
                    const d=document.createElement("div");
                    d.style.cssText = "padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--bdt-text,#fff);word-break:break-all;";

                    const time = l.time.toLocaleTimeString();
                    const color =
                        l.type==="open"  ? "#66bb6a" :
                        l.type==="error" ? "#ef5350" :
                        l.type==="close" ? "#ffa726" :
                                           "#b0bec5";

                    const raw = (typeof l.data==='string' ? l.data : (l.data == null ? "" : String(l.data)));
                    const val = raw.length > 300 ? raw.slice(0,300) + "…" : raw;

                    d.innerHTML=`
                        <span style="opacity:0.5;margin-right:8px;">${time}</span>
                        <strong style="color:${color};margin-right:8px;">${l.type.toUpperCase()}</strong>
                        ${val}
                    `;
                    frag.appendChild(d);
                });
                box.innerHTML="";
                box.appendChild(frag);
                view.scrollTop = view.scrollHeight;
            };
            this.renderFn();
        }
    });
})();
