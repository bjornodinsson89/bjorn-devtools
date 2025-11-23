// plugins/network-inspector.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("networkInspector", {
        name: "Network",
        tab: "networkInspector",

        onLoad(api) {
            this.entries = [];
            this.api = api;

            this.hookFetch();
            this.hookXHR();

            api.log("[network] hooked fetch + xhr");
        },

        hookFetch() {
            if (window.__bdt_fetch_hooked) return;
            window.__bdt_fetch_hooked = true;
            const self = this;

            const orig = window.fetch;
            window.fetch = async function(...args) {
                const start = performance.now();
                const url = args[0];
                let res, err;

                try { res = await orig.apply(this, args); }
                catch(e){ err = e; }

                const end = performance.now();
                const entry = {
                    type: "fetch",
                    url: String(url),
                    status: res ? res.status : -1,
                    method: (args[1]?.method || "GET"),
                    ms: end - start,
                    body: null,
                    time: new Date()
                };

                if (res && res.clone) {
                    try {
                        const text = await res.clone().text();
                        entry.body = text.slice(0, 1000);
                    } catch(_) {}
                }

                self.entries.push(entry);
                if (self.render) self.render();

                if (err) throw err;
                return res;
            };
        },

        hookXHR() {
            if (window.__bdt_xhr_hooked) return;
            window.__bdt_xhr_hooked = true;

            const self = this;
            const origOpen = XMLHttpRequest.prototype.open;
            const origSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function(m,u){
                this.__bdt_meta = { method:m, url:u, start:0 };
                return origOpen.apply(this, arguments);
            };

            XMLHttpRequest.prototype.send = function(){
                const meta = this.__bdt_meta;
                meta.start = performance.now();

                this.addEventListener("loadend", () => {
                    const entry = {
                        type: "xhr",
                        url: meta.url,
                        method: meta.method,
                        status: this.status,
                        ms: performance.now() - meta.start,
                        time: new Date(),
                        body: null
                    };

                    try {
                        if (typeof this.responseText === "string") {
                            entry.body = this.responseText.slice(0, 1000);
                        }
                    } catch (_) {}

                    self.entries.push(entry);
                    if (self.render) self.render();
                });

                return origSend.apply(this, arguments);
            };
        },

        onMount(view, api) {
            view.innerHTML = `
                <input class="bdt-net-filter" placeholder="Filter (url)">
                <div class="bdt-net-list" style="font-size:11px;"></div>
            `;

            const filter = view.querySelector(".bdt-net-filter");
            const list = view.querySelector(".bdt-net-list");

            filter.addEventListener("input", () => this.render());

            this.render = () => {
                const f = filter.value.toLowerCase();
                list.innerHTML = "";

                this.entries
                    .filter(e => e.url.toLowerCase().includes(f))
                    .slice(-300)
                    .reverse()
                    .forEach(e => {
                        const row = document.createElement("div");
                        row.style.cssText = "padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.06)";
                        row.textContent = `${e.method} ${e.status} [${Math.round(e.ms)}ms] ${e.url}`;
                        row.title = e.body || "";
                        list.appendChild(row);
                    });
            };

            this.render();
        }
    });
})();
