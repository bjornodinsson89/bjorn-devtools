// plugins/dom-inspector.js — patched for shadow-safety
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("domInspector", {
        name: "DOM",
        tab: "domInspector",

        onLoad(api) {
            this.api = api;
            this.overlay = this.createOverlay();
            this.picking = false;
            this.boundMove = null;
            this.boundClick = null;

            this.isDevtoolsElement = (el) => {
                if (!el || !el.getRootNode) return false;
                const root = el.getRootNode();
                return !!(root && root.host && root.host.id === "bjorn-devtools-host");
            };

            api.commands.register("dom.pick", () => {
                this.startPicker();
                api.log("DOM Picker started");
            }, "Start element picker");

            api.commands.register("dom.stop", () => {
                this.stopPicker();
                api.log("DOM Picker stopped");
            }, "Stop element picker");

            api.log("[domInspector] ready");
        },

        /*===========================================================
        =  OVERLAY BOX
        ===========================================================*/
        createOverlay() {
            const box = document.createElement("div");
            box.style.cssText = `
                position:fixed;
                border:2px solid #6fb6ff;
                border-radius:4px;
                background:rgba(111,182,255,0.15);
                pointer-events:none;
                z-index:2147483646;
                display:none;
            `;
            document.body.appendChild(box);
            return box;
        },

        showOverlay(el) {
            const r = el.getBoundingClientRect();
            this.overlay.style.left = r.left + "px";
            this.overlay.style.top = r.top + "px";
            this.overlay.style.width = r.width + "px";
            this.overlay.style.height = r.height + "px";
            this.overlay.style.display = "block";
        },

        hideOverlay() {
            this.overlay.style.display = "none";
        },

        /*===========================================================
        =  ELEMENT PICKER
        ===========================================================*/
        startPicker() {
            if (this.picking) return;
            this.picking = true;

            this.boundMove = (e) => {
                const el = document.elementFromPoint(e.clientX, e.clientY);
                if (!el) {
                    this.hideOverlay();
                    return;
                }
                if (this.isDevtoolsElement(el)) {
                    this.hideOverlay();
                    return;
                }
                this.showOverlay(el);
            };

            document.addEventListener("mousemove", this.boundMove, { passive: true });

            this.boundClick = (e) => {
                if (!this.picking) return;

                const el = document.elementFromPoint(e.clientX, e.clientY);
                if (this.isDevtoolsElement(el)) {
                    // Ignore clicks on DevTools UI entirely.
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                if (el) this.selectElement(el);
                this.stopPicker();
            };

            document.addEventListener("click", this.boundClick, true);
        },

        stopPicker() {
            if (!this.picking) return;
            this.picking = false;

            if (this.boundMove) {
                document.removeEventListener("mousemove", this.boundMove);
                this.boundMove = null;
            }
            if (this.boundClick) {
                document.removeEventListener("click", this.boundClick, true);
                this.boundClick = null;
            }
            this.hideOverlay();
        },

        /*===========================================================
        =  SELECTED ELEMENT DETAIL PANEL
        ===========================================================*/
        selectElement(el) {
            if (!this.renderDetail) return;
            if (this.isDevtoolsElement(el)) {
                this.api.log("Selected element is inside DevTools UI; ignoring.");
                return;
            }

            this.currentElement = el;
            this.renderDetail(el);
            this.api.log("Selected: " + this.buildSelector(el));
        },

        /*===================================================================
        =  BUILD CSS SELECTOR
        ===================================================================*/
        buildSelector(el) {
            if (!el || !el.tagName) return "";

            const tag = el.tagName.toLowerCase();
            const id = el.id ? "#" + el.id : "";
            const classes = el.className
                ? "." + el.className.trim().split(/\s+/).join(".")
                : "";

            let selector = tag + id + classes;

            // If not unique, build up the chain
            if (document.querySelectorAll(selector).length !== 1) {
                const path = [];

                let current = el;
                while (current.parentElement) {
                    let part = current.tagName.toLowerCase();

                    if (current.id) part += "#" + current.id;
                    else if (current.className)
                        part += "." + current.className.trim().split(/\s+/).join(".");

                    const siblings = Array.from(current.parentElement.children);
                    const index = siblings.indexOf(current);
                    part += `:nth-child(${index + 1})`;

                    path.unshift(part);

                    if (current.parentElement === document.body) break;
                    current = current.parentElement;
                }

                selector = path.join(" > ");
            }

            return selector;
        },

        /*===========================================================
        =  BUILD XPATH
        ===========================================================*/
        buildXPath(el) {
            if (el.id) return `//*[@id="${el.id}"]`;

            const parts = [];

            while (el && el.nodeType === Node.ELEMENT_NODE) {
                let index = 1;
                let sibling = el.previousElementSibling;
                while (sibling) {
                    if (sibling.tagName === el.tagName) index++;
                    sibling = sibling.previousElementSibling;
                }
                parts.unshift(`${el.tagName}[${index}]`);
                el = el.parentElement;
            }

            return "/" + parts.join("/");
        },

        /*===========================================================
        =  MOUNT UI
        ===========================================================*/
        onMount(view, api) {
            view.innerHTML = `
                <button class="bdt-dom-pick" style="margin-bottom:6px;">Pick Element</button>
                <div class="bdt-dom-detail" style="font-size:11px;"></div>
            `;

            const pickBtn = view.querySelector(".bdt-dom-pick");
            const detailBox = view.querySelector(".bdt-dom-detail");

            pickBtn.onclick = () => this.startPicker();

            this.renderDetail = (el) => {
                if (!el) return;

                const selector = this.buildSelector(el);
                const xpath = this.buildXPath(el);
                const rect = el.getBoundingClientRect();

                detailBox.innerHTML = `
                    <div style="margin-bottom:6px;font-size:12px;font-weight:bold;">${el.tagName.toLowerCase()}</div>

                    <div><strong>Selector:</strong> ${selector}</div>
                    <div><strong>XPath:</strong> ${xpath}</div>

                    <div style="margin-top:4px;">
                        <strong>Box:</strong>
                        ${rect.width.toFixed(0)}×${rect.height.toFixed(0)} at 
                        (${Math.round(rect.left)}, ${Math.round(rect.top)})
                    </div>

                    <div style="margin-top:4px;">
                        <strong>Attributes:</strong>
                        <div style="padding-left:8px;margin-top:2px;">
                            ${Array.from(el.attributes).map(a => `${a.name}="${a.value}"`).join("<br>") || "(none)"}
                        </div>
                    </div>

                    <div style="margin-top:4px;">
                        <strong>Children:</strong>
                        <div style="padding-left:8px;margin-top:2px;">
                            ${el.children.length ? [...el.children].map(c=>c.tagName.toLowerCase()).join(", ") : "(none)"}
                        </div>
                    </div>

                    <div style="margin-top:8px;display:flex;gap:6px;">
                        <button class="bdt-dom-copy-selector">Copy Selector</button>
                        <button class="bdt-dom-copy-xpath">Copy XPath</button>
                        <button class="bdt-dom-copy-html">Copy HTML</button>
                    </div>
                `;

                detailBox.querySelector(".bdt-dom-copy-selector").onclick =
                    () => navigator.clipboard.writeText(selector);

                detailBox.querySelector(".bdt-dom-copy-xpath").onclick =
                    () => navigator.clipboard.writeText(xpath);

                detailBox.querySelector(".bdt-dom-copy-html").onclick =
                    () => navigator.clipboard.writeText(el.outerHTML);
            };
        }
    });
})();
