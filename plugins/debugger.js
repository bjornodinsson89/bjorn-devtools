// plugins/debugger.js — fully patched, leak-free, shadow-safe
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("debugger", {
        name: "Debugger",
        tab: "debugger",

        onLoad(api) {
            this.api = api;

            /*-----------------------------------------------
            | Internal state
            -----------------------------------------------*/
            this.eventSpies = [];
            this.mutationObserver = null;
            this.fpsFrame = null;
            this.lastFPS = null;
            this.paintOverlay = null;
            this.paintFlashInterval = null;
            this.consolePatched = false;
            this.originalConsoleLog = null;
            this.lagInterval = null;

            /*-----------------------------------------------
            | Helpers
            -----------------------------------------------*/
            const isInsideDevtools = (el) => {
                const root = el?.getRootNode?.();
                return root && root.host && root.host.id === "bjorn-devtools-host";
            };

            const makeEventSpy = (type, handler) => {
                document.addEventListener(type, handler, true);
                this.eventSpies.push({ type, handler });
            };

            /*===========================================================
            =  COMMANDS
            ===========================================================*/

            api.commands.register("spy.clicks", () => {
                this.stopSpies();
                makeEventSpy("click", (e) => {
                    const t = e.target;
                    if (!t || isInsideDevtools(t)) return;
                    this.api.log(`[click] <${t.tagName.toLowerCase()}>`);
                });
                this.api.log("Event spy ON: clicks");
            }, "Spy on click events");

            api.commands.register("spy.keys", () => {
                this.stopSpies();
                makeEventSpy("keydown", (e) => {
                    if (isInsideDevtools(e.target)) return;
                    this.api.log(`[key] ${e.key}`);
                });
                this.api.log("Event spy ON: keys");
            }, "Spy on keyboard events");

            api.commands.register("spy.scroll", () => {
                this.stopSpies();
                makeEventSpy("scroll", (e) => {
                    if (isInsideDevtools(e.target)) return;
                    this.api.log("[scroll] event");
                });
                this.api.log("Event spy ON: scroll");
            }, "Spy on scroll events");

            api.commands.register("spy.stop", () => this.stopSpies(), "Stop all event spies");

            api.commands.register("mutations.on", () => this.startMutations(), "Start mutation observer");
            api.commands.register("mutations.off", () => this.stopMutations(), "Stop mutation observer");

            api.commands.register("fps", () => this.startFPS(), "Show FPS");
            api.commands.register("fps.stop", () => this.stopFPS(), "Stop FPS");

            api.commands.register("lag", () => this.startLagMeter(), "Detect event loop lag");
            api.commands.register("lag.stop", () => this.stopLagMeter(), "Stop lag detection");

            api.commands.register("paint.flash", () => {
                if (!api.ensureUnsafe("paint.flash")) return;
                this.startPaintFlash();
            }, "Flash repaints (UNSAFE)");

            api.commands.register("paint.stop", () => this.stopPaintFlash(), "Stop paint flashing");

            api.commands.register("console.spy", () => this.spyConsole(), "Mirror console logs");

            api.log("[debugger] ready");
        },

        /*===========================================================
        =  EVENT SPYING (Safe, leak-free)
        ===========================================================*/
        stopSpies() {
            this.eventSpies.forEach(s =>
                document.removeEventListener(s.type, s.handler, true)
            );
            this.eventSpies = [];
            this.api.log("Stopped all spies.");
        },

        /*===========================================================
        =  MUTATION OBSERVER (Throttled)
        ===========================================================*/
        startMutations() {
            const api = this.api;

            this.stopMutations();

            let lastLog = 0;
            this.mutationObserver = new MutationObserver((muts) => {
                const now = performance.now();
                if (now - lastLog < 300) return; // throttle
                lastLog = now;

                for (const m of muts) {
                    if (m.target && m.target.getRootNode &&
                        m.target.getRootNode().host &&
                        m.target.getRootNode().host.id === "bjorn-devtools-host") {
                        continue; // ignore DevTools UI
                    }
                    api.log(`[mutation] ${m.type} on <${m.target.tagName.toLowerCase()}>`);
                }
            });

            this.mutationObserver.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true
            });

            api.log("Mutation observer ON.");
        },

        stopMutations() {
            if (this.mutationObserver) this.mutationObserver.disconnect();
            this.mutationObserver = null;
            this.api.log("Mutation observer OFF.");
        },

        /*===========================================================
        =  FPS MONITOR (now throttled, no spam)
        ===========================================================*/
        startFPS() {
            this.stopFPS();

            const api = this.api;
            let last = performance.now();

            const tick = (now) => {
                const delta = now - last;
                last = now;

                const fps = Math.round(1000 / delta);

                // only log when meaningfully changed
                if (this.lastFPS === null || Math.abs(fps - this.lastFPS) >= 3) {
                    api.log(`FPS: ${fps}`);
                    this.lastFPS = fps;
                }

                this.fpsFrame = requestAnimationFrame(tick);
            };

            this.fpsFrame = requestAnimationFrame(tick);
        },

        stopFPS() {
            if (this.fpsFrame) cancelAnimationFrame(this.fpsFrame);
            this.fpsFrame = null;
            this.lastFPS = null;
        },

        /*===========================================================
        =  EVENT LOOP LAG METER (fixed drift)
        ===========================================================*/
        startLagMeter() {
            this.stopLagMeter();

            const api = this.api;
            let last = performance.now();

            this.lagInterval = setInterval(() => {
                const now = performance.now();
                const drift = now - last - 100;
                last = now;

                if (drift > 12) {
                    api.log(`Lag: ${drift.toFixed(1)}ms`);
                }
            }, 100);

            api.log("Lag meter ON.");
        },

        stopLagMeter() {
            if (this.lagInterval) clearInterval(this.lagInterval);
            this.lagInterval = null;
        },

        /*===========================================================
        =  PAINT FLASH OVERLAY (UNSAFE, fixed)
        ===========================================================*/
        startPaintFlash() {
            if (this.paintOverlay) return;

            const box = document.createElement("div");
            box.style.cssText = `
                position:fixed;inset:0;pointer-events:none;
                background:rgba(255,0,0,0.12);
                mix-blend-mode:multiply;
                z-index:2147483646;
                display:none;
            `;
            document.body.appendChild(box);

            this.paintOverlay = box;

            const flash = () => {
                box.style.display = "block";
                setTimeout(() => box.style.display = "none", 50);
            };

            this.paintFlashInterval = setInterval(flash, 250);
            this.api.log("Paint flashing ON (UNSAFE)");
        },

        stopPaintFlash() {
            if (this.paintOverlay) this.paintOverlay.remove();
            this.paintOverlay = null;

            if (this.paintFlashInterval) clearInterval(this.paintFlashInterval);
            this.paintFlashInterval = null;

            this.api.log("Paint flashing OFF.");
        },

        /*===========================================================
        =  CONSOLE SPY (reversible & safe)
        ===========================================================*/
        spyConsole() {
            if (this.consolePatched) {
                this.api.log("Console spy already active.");
                return;
            }

            this.consolePatched = true;
            this.originalConsoleLog = console.log;

            const api = this.api;
            console.log = (...args) => {
                this.originalConsoleLog.apply(console, args);

                const out = args.map(v => {
                    try { return typeof v === "object" ? JSON.stringify(v) : String(v); }
                    catch { return String(v); }
                }).join(" ");

                api.log("[console] " + out);
            };

            api.log("Console spy active. (Mirroring page console logs)");
        },

        /*===========================================================
        =  CLEANUP ON TAB MOUNT OR UNLOAD
        ===========================================================*/
        onMount(view) {
            view.innerHTML = `
                <div style="font-size:12px;margin-bottom:6px;">Debugger Tools</div>
                <ul style="font-size:11px;line-height:1.4;">
                    <li>spy.clicks</li>
                    <li>spy.keys</li>
                    <li>spy.scroll</li>
                    <li>spy.stop</li>
                    <li>mutations.on</li>
                    <li>mutations.off</li>
                    <li>fps</li>
                    <li>fps.stop</li>
                    <li>lag</li>
                    <li>lag.stop</li>
                    <li>console.spy</li>
                    <li>paint.flash (UNSAFE)</li>
                    <li>paint.stop</li>
                </ul>
            `;
        }
    });
})();
