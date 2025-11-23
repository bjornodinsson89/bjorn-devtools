// plugins/storage-inspector.js
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("storageInspector", {
        name: "Storage",
        tab: "storageInspector",

        onLoad(api) { this.api = api; },

        onMount(view) {
            view.innerHTML = `
                <div style="display:flex;gap:8px;margin-bottom:8px;">
                    <button class="bdt-s-btn" data-s="local">LocalStorage</button>
                    <button class="bdt-s-btn" data-s="session">SessionStorage</button>
                    <button class="bdt-s-btn" data-s="cookie">Cookies</button>
                </div>
                <input class="bdt-s-filter" placeholder="Search key">
                <div class="bdt-s-list"></div>
            `;

            const list = view.querySelector(".bdt-s-list");
            const filter = view.querySelector(".bdt-s-filter");
            const btns = view.querySelectorAll(".bdt-s-btn");

            let mode = "local";

            btns.forEach(b => b.addEventListener("click", () => {
                mode = b.dataset.s;
                this.render(list, filter.value, mode);
            }));

            filter.addEventListener("input", () => {
                this.render(list, filter.value, mode);
            });

            this.render(list, "", mode);
        },

        render(list, search, mode) {
            search = search.toLowerCase();
            list.innerHTML = "";

            let data = [];

            try {
                if (mode === "local") {
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        const v = localStorage.getItem(k);
                        data.push({ k, v });
                    }
                }
                if (mode === "session") {
                    for (let i = 0; i < sessionStorage.length; i++) {
                        const k = sessionStorage.key(i);
                        const v = sessionStorage.getItem(k);
                        data.push({ k, v });
                    }
                }
                if (mode === "cookie") {
                    document.cookie.split(";").forEach(c => {
                        const [k,v] = c.split("=").map(x=>x.trim());
                        data.push({ k, v });
                    });
                }
            } catch (e) {
                list.textContent = "Blocked (sandbox / CSP).";
                return;
            }

            data
               .filter(e => e.k.toLowerCase().includes(search))
               .forEach(e => {
                   const row = document.createElement("div");
                   row.style.cssText = "padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04)";
                   row.textContent = e.k + " = " + e.v;
                   list.appendChild(row);
               });
        }
    });
})();
