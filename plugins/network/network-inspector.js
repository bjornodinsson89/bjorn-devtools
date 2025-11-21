// Bjorn Dev Tools — Network Inspector Plugin
(function() {
    if (!window.BjornDevTools) {
        console.error("[BjornDevTools][NetworkInspector] Core not loaded.");
        return;
    }

    const DevTools = window.BjornDevTools;
    const api = DevTools.api;

    /***********************************************************
     * INTERNAL NETWORK HOOK SYSTEM
     ***********************************************************/
    const requests = [];
    let reqId = 0;

    // Observers
    const listeners = {
        request: [],
        update: []
    };

    function emit(type, data) {
        (listeners[type] || []).forEach(fn => {
            try { fn(data); } catch (e) {}
        });
    }

    function on(type, fn) {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(fn);
    }

    /***********************************************************
     * WRAP FETCH
     ***********************************************************/
    const _fetch = window.fetch;
    window.fetch = async function(url, opts = {}) {
        const id = reqId++;
        const start = performance.now();

        const entry = {
            id,
            time: new Date().toLocaleTimeString(),
            method: (opts.method || "GET").toUpperCase(),
            url: (typeof url === "string" ? url : url.url),
            status: "...",
            duration: 0,
            headers: null,
            responseHeaders: null,
            body: opts.body || null,
            response: null,
            error: null
        };
        requests.push(entry);
        emit("request", entry);

        try {
            const res = await _fetch(url, opts);
            entry.duration = performance.now() - start;
            entry.status = res.status;
            entry.responseHeaders = Array.from(res.headers.entries());
            
            // Clone + preview body
            try {
                const clone = res.clone();
                const text = await clone.text();
                entry.response = text.substring(0, 2000);
            } catch (e) {
                entry.response = "[Body unreadable]";
            }

            emit("update", entry);
            return res;
        } catch (e) {
            entry.duration = performance.now() - start;
            entry.error = e.toString();
            emit("update", entry);
            throw e;
        }
    };

    /***********************************************************
     * WRAP XHR
     ***********************************************************/
    const _open = XMLHttpRequest.prototype.open;
    const _send = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, async = true, user, pass) {
        this._bjorn = {
            id: reqId++,
            method: method.toUpperCase(),
            url,
            start: 0,
            end: 0,
            headers: [],
            body: null,
            response: null,
            status: "...",
            error: null
        };
        return _open.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function(key, value) {
        if (this._bjorn) this._bjorn.headers.push([key, value]);
        return XMLHttpRequest.prototype.setRequestHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        if (this._bjorn) {
            const data = this._bjorn;
            data.start = performance.now();
            data.body = body;

            const entry = {
                id: data.id,
                time: new Date().toLocaleTimeString(),
                method: data.method,
                url: data.url,
                status: "...",
                duration: 0,
                headers: data.headers,
                body: data.body,
                responseHeaders: null,
                response: null,
                error: null
            };
            requests.push(entry);
            emit("request", entry);

            this.addEventListener("loadend", () => {
                try {
                    entry.status = this.status;
                    entry.duration = performance.now() - data.start;

                    // Response headers
                    const raw = this.getAllResponseHeaders();
                    entry.responseHeaders = raw
                        .trim()
                        .split(/[\r\n]+/)
                        .map(line => {
                            const idx = line.indexOf(":");
                            return [line.slice(0, idx), line.slice(idx + 1).trim()];
                        });

                    // Response body
                    entry.response = this.responseText
                        ? this.responseText.substring(0, 2000)
                        : null;

                } catch (e) {
                    entry.error = e.toString();
                }

                emit("update", entry);
            });
        }
        return _send.apply(this, arguments);
    };

    /***********************************************************
     * NETWORK INSPECTOR UI
     ***********************************************************/
    DevTools.plugins.register({
        id: "networkInspector",
        title: "Network Inspector",
        tab: "NETWORK",

        init(api, ui) {
            const panel = ui.createPanel();
            panel.style.fontFamily = "monospace";

            // --- Layout ---
            const list = document.createElement("div");
            const details = document.createElement("div");
            const filterBox = document.createElement("input");

            filterBox.placeholder = "filter (url/method/status)…";
            filterBox.style.width = "100%";
            filterBox.style.marginBottom = "6px";
            filterBox.style.background = "#111";
            filterBox.style.color = "#fff";
            filterBox.style.border = "1px solid #333";
            filterBox.style.padding = "4px 6px";

            const container = document.createElement("div");
            container.style.display = "flex";
            container.style.gap = "6px";
            container.style.height = "100%";

            list.style.flex = "1";
            list.style.overflowY = "auto";
            list.style.borderRight = "1px solid #444";
            list.style.paddingRight = "4px";

            details.style.flex = "2";
            details.style.overflowY = "auto";
            details.style.paddingLeft = "4px";

            container.append(list, details);

            panel.append(filterBox, container);
            ui.mountPanel("NETWORK", panel);

            /***********************************************************
             * RENDER FUNCTIONS
             ***********************************************************/
            function renderList() {
                list.innerHTML = "";
                const f = filterBox.value.toLowerCase();

                requests.forEach(req => {
                    const str = (
                        req.method + " " +
                        req.status + " " +
                        req.url
                    ).toLowerCase();

                    if (f && !str.includes(f)) return;

                    const row = document.createElement("div");
                    row.style.padding = "4px 0";
                    row.style.borderBottom = "1px solid #333";
                    row.style.cursor = "pointer";

                    row.innerHTML =
                        `<b>[${req.method}]</b> ${req.status} — <span style="color:#bbb">${req.url}</span><br>
                         <span style="font-size:10px;color:#777">${req.time} • ${Math.round(req.duration)}ms</span>`;

                    row.onclick = () => renderDetails(req);
                    list.appendChild(row);
                });

                list.scrollTop = list.scrollHeight;
            }

            function renderDetails(req) {
                details.innerHTML = `
                    <h3 style="margin:4px 0;color:#ff2a2a">${req.method} ${req.url}</h3>
                    <div>Status: <b>${req.status}</b></div>
                    <div>Time: ${req.time}</div>
                    <div>Duration: ${Math.round(req.duration)}ms</div>
                    <hr style="margin:6px 0;border-color:#444">

                    <h4>Request Headers</h4>
                    <pre style="white-space:pre-wrap">${req.headers ? JSON.stringify(req.headers,null,2) : "None"}</pre>

                    <h4>Response Headers</h4>
                    <pre style="white-space:pre-wrap">${req.responseHeaders ? JSON.stringify(req.responseHeaders,null,2) : "None"}</pre>

                    <h4>Request Body</h4>
                    <pre style="white-space:pre-wrap">${req.body || "None"}</pre>

                    <h4>Response Preview</h4>
                    <pre style="white-space:pre-wrap">${req.response || "[empty]"}</pre>
                `;

                // Replay button
                const replayBtn = document.createElement("button");
                replayBtn.textContent = "Replay Request";
                replayBtn.style.marginTop = "8px";
                replayBtn.style.padding = "4px 8px";

                replayBtn.onclick = () => replay(req);
                details.appendChild(replayBtn);
            }

            /***********************************************************
             * REPLAY REQUEST
             ***********************************************************/
            async function replay(req) {
                try {
                    api.log.info("Replaying: " + req.method + " " + req.url);

                    const opts = {
                        method: req.method,
                        headers: {},
                        body: req.body || undefined
                    };

                    // Build headers object
                    if (req.headers) {
                        req.headers.forEach(([k, v]) => {
                            opts.headers[k] = v;
                        });
                    }

                    const res = await fetch(req.url, opts);
                    api.log.info("Replay status: " + res.status);
                } catch (e) {
                    api.log.error("Replay failed: " + e);
                }
            }

            /***********************************************************
             * LISTENERS
             ***********************************************************/
            on("request", () => renderList());
            on("update", () => renderList());
            filterBox.oninput = () => renderList();

            renderList();
        }
    });

})();
