// File: plugins/network-bus.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools || !DevTools.registerPlugin) return;

    let listeners = {
        requestStart: [],
        requestEnd: []
    };

    function emit(type, payload){
        (listeners[type] || []).forEach(fn=>fn(payload));
    }

    function on(type, fn){
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(fn);
    }

    /* ------------------ FETCH PATCH ------------------ */
    if (!window._bdtFetchPatched){
        window._bdtFetchPatched = true;
        const origFetch = window.fetch.bind(window);

        window.fetch = function(input, init){
            const url    = (typeof input === "string" ? input : input.url);
            const method = (init && init.method) || "GET";
            const start  = performance.now();

            emit("requestStart", {url, method, start, type:"fetch"});

            return origFetch(input, init)
                .then(res=>{
                    emit("requestEnd", {
                        url, method, start,
                        end: performance.now(),
                        ok: res.ok,
                        type:"fetch"
                    });
                    return res;
                })
                .catch(err=>{
                    emit("requestEnd", {
                        url, method, start,
                        end: performance.now(),
                        ok: false,
                        error: String(err),
                        type:"fetch"
                    });
                    throw err;
                });
        };
    }

    /* ------------------ XHR PATCH ------------------ */
    if (!window._bdtXHRPatched){
        window._bdtXHRPatched = true;

        const OrigXHR = window.XMLHttpRequest;
        function XHR(){
            const xhr = new OrigXHR();

            let record = null;

            xhr.addEventListener("loadstart",()=>{
                const url = xhr.responseURL || "";
                const start = performance.now();
                record = { url, method: xhr._bdtMethod || "GET", start };
                emit("requestStart", record);
            });

            xhr.addEventListener("loadend",()=>{
                if (!record) return;
                record.end = performance.now();
                record.ok = (xhr.status>=200 && xhr.status<400);
                emit("requestEnd", record);
            });

            return xhr;
        }
        XHR.prototype = OrigXHR.prototype;

        window.XMLHttpRequest = XHR;

        const origOpen = OrigXHR.prototype.open;
        OrigXHR.prototype.open = function(method, url){
            this._bdtMethod = method;
            return origOpen.apply(this, arguments);
        };
    }

    /* ------------------ REGISTER PLUGIN ------------------ */
    DevTools.registerPlugin("networkBus",{
        name:"NetworkBus",

        onLoad(api){
            this.api = api;
            api.networkBus = { on };
        }
    });
})();
