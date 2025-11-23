// plugins/storage-inspector.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("storageInspector", {
        name: "Storage",
        tab: "storageInspector",

        onLoad(api) {
            this.api = api;

            api.commands.register("storage.clear", (target) => {
                if (!api.ensureUnsafe("storage.clear")) return;
                target = (target || "").toLowerCase();

                if (target === "local") { localStorage.clear(); api.log("localStorage cleared."); }
                else if (target === "session") { sessionStorage.clear(); api.log("sessionStorage cleared."); }
                else if (target === "cookies") { document.cookie.split(";").forEach(c => document.cookie = c.replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")); api.log("Cookies cleared."); }
                else api.log("Usage: storage.clear <local|session|cookies>");
            }, "Clear storage bucket (UNSAFE)");

            api.log("[storageInspector] ready");
        },

        safeCheck() {
            return this.api.state.safe();
        },

        onMount(view) {
            view.innerHTML = `
                <div style="display:flex;gap:6px;margin-bottom:6px;">
                    <button class="bdt-s-btn" data-mode="local">Local</button>
                    <button class="bdt-s-btn" data-mode="session">Session</button>
                    <button class="bdt-s-btn" data-mode="cookie">Cookies</button>
                    <button class="bdt-s-add" style="margin-left:auto;">Add</button>
                </div>
                <input class="bdt-s-filter" placeholder="Search key…" 
                       style="width:100%;padding:6px;background:#000;border:1px solid #444;color:#fff;margin-bottom:8px;font-size:11px;">
                <div class="bdt-s-list" style="font-size:11px;"></div>
            `;

            this.mode = "local";
            this.view = view;
            this.list = view.querySelector(".bdt-s-list");
            this.filter = view.querySelector(".bdt-s-filter");

            view.querySelectorAll(".bdt-s-btn").forEach(btn => {
                btn.onclick = () => {
                    this.mode = btn.dataset.mode;
                    this.render();
                };
            });

            view.querySelector(".bdt-s-add").onclick = () => this.addKey();
            this.filter.oninput = () => this.render();

            this.render();
        },

        /*===========================================================
        =  RENDER STORAGE
        ===========================================================*/
        render() {
            const list = this.list;
            const mode = this.mode;
            const filter = this.filter.value.toLowerCase();

            list.innerHTML = "";

            let entries = [];

            try {
                if (mode === "local") {
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        entries.push({ k, v: localStorage.getItem(k) });
                    }
                }

                if (mode === "session") {
                    for (let i = 0; i < sessionStorage.length; i++) {
                        const k = sessionStorage.key(i);
                        entries.push({ k, v: sessionStorage.getItem(k) });
                    }
                }

                if (mode === "cookie") {
                    document.cookie.split(";").forEach(c => {
                        const idx = c.indexOf("=");
                        if (idx === -1) return;
                        const k = c.slice(0, idx).trim();
                        const v = c.slice(idx + 1).trim();
                        entries.push({ k, v });
                    });
                }
            } catch (e) {
                list.textContent = "Storage blocked by sandbox/CSP.";
                return;
            }

            entries
                .filter(e => e.k.toLowerCase().includes(filter))
                .forEach(e => this.renderRow(e));
        },

        /*===========================================================
        =  RENDER ROW
        ===========================================================*/
        renderRow({ k, v }) {
            const row = document.createElement("div");
            row.style.cssText = `
                padding:5px 0;
                border-bottom:1px solid rgba(255,255,255,0.08);
                display:flex;
                justify-content:space-between;
                align-items:center;
            `;

            const left = document.createElement("div");
            left.style.cssText = "flex:1;padding-right:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
            left.textContent = `${k} = ${v}`;

            const right = document.createElement("div");
            right.style.cssText = "display:flex;gap:6px;";

            /* Edit button */
            const edit = document.createElement("button");
            edit.textContent = "Edit";
            edit.style.cssText = this.btnStyle();
            edit.onclick = () => this.editKey(k, v);

            /* Delete button */
            const del = document.createElement("button");
            del.textContent = "Del";
            del.style.cssText = this.btnStyle();
            del.onclick = () => this.delKey(k);

            right.append(edit, del);
            row.append(left, right);
            this.list.appendChild(row);
        },

        /*===========================================================
        =  ADD KEY
        ===========================================================*/
        addKey() {
            const key = prompt("Key:");
            if (!key) return;

            const value = prompt("Value:");
            if (value === null) return;

            if (!this.api.ensureUnsafe("storage.write")) return;

            if (this.mode === "local") localStorage.setItem(key, value);
            if (this.mode === "session") sessionStorage.setItem(key, value);
            if (this.mode === "cookie") document.cookie = `${key}=${value}; path=/`;

            this.render();
        },

        /*===========================================================
        =  EDIT KEY
        ===========================================================*/
        editKey(k, v) {
            if (!this.api.ensureUnsafe("storage.edit")) return;

            const newVal = prompt("Edit value:", v);
            if (newVal === null) return;

            if (this.mode === "local") localStorage.setItem(k, newVal);
            if (this.mode === "session") sessionStorage.setItem(k, newVal);
            if (this.mode === "cookie") {
                document.cookie = `${k}=${newVal}; path=/`;
            }

            this.render();
        },

        /*===========================================================
        =  DELETE KEY
        ===========================================================*/
        delKey(k) {
            if (!this.api.ensureUnsafe("storage.delete")) return;

            if (this.mode === "local") localStorage.removeItem(k);
            if (this.mode === "session") sessionStorage.removeItem(k);
            if (this.mode === "cookie") {
                document.cookie = `${k}=;expires=${new Date(0).toUTCString()};path=/`;
            }

            this.render();
        },

        /*===========================================================
        =  BUTTON STYLE
        ===========================================================*/
        btnStyle() {
            return `
                padding:2px 6px;
                background:#000;
                color:#ddd;
                border:1px solid #444;
                border-radius:4px;
                cursor:pointer;
                font-size:10px;
            `;
        }
    });
})();
