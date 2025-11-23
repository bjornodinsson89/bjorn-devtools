// plugins/debugger.js
(function () {
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.registerPlugin("debugger", {
        name: "Debugger",
        tab: "debugger",

        onLoad(api) {
            this.api = api;

            this.eventSpies = [];
            this.mutationObserver = null;
            this.lagInterval = null;
            this.fpsFrame = null;
            this.paintOverlay = null;
            this.consolePatched = false;

            /*===========================================================
            =  COMMANDS
            ===========================================================*/

            api.commands.register("spy.clicks", () => this.spyEvents("click"), "Spy on click events");
            api.commands.register("spy.keys", () => this.spyEvents("keydown"), "Spy on keyboard events");
            api.commands.register("spy.scroll", () => this.spyEvents("scroll"), "Spy on scroll events");
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
        =  EVENT SPYING
        ===========================================================*/
        spyEvents(type) {
            const api = this.api;
            const handler = (e) => {
                api.log(`[${type}] target: ${e.target.tagName}`);
            };
            document.addEventListener(type, handler, true);
            this.eventSpies.push({ type, handler });
            api.log(`Event spy ON for: ${type}`);
        },

        stopSpies() {
            this.eventSpies.forEach(s => {
                document.removeEventListener(s.type, s.handler, true);
            });
            this.eventSpies = [];
            this.api.log("Stopped all spies.");
        },

        /*===========================================================
        =  MUTATION OBSERVER
        ===========================================================*/
        startMutations() {
            const api = this.api;
            if (this.mutationObserver) this.mutationObserver.disconnect();

            this.mutationObserver = new MutationObserver(muts => {
                muts.forEach(m => {
                    api.log(`[mutation] ${m.type} on ${m.target.tagName}`);
                });
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
        =  FPS MONITOR
        ===========================================================*/
        startFPS() {
            const api = this.api;
            let last = performance.now();

            const tick = (now) => {
                const delta = now - last;
                last = now;
                const fps = Math.round(1000 / delta);
                api.log(`FPS: ${fps}`);
                this.fpsFrame = requestAnimationFrame(tick);
            };

            this.stopFPS();
            this.fpsFrame = requestAnimationFrame(tick);
        },

        stopFPS() {
            if (this.fpsFrame) cancelAnimationFrame(this.fpsFrame);
            this.fpsFrame = null;
        },

        /*===========================================================
        =  EVENT LOOP LAG METER
        ===========================================================*/
        startLagMeter() {
            const api = this.api;
            let last = performance.now();
            this.stopLagMeter();

            this.lagInterval = setInterval(() => {
                const now = performance.now();
                const lag = now - last - 100;
                last = now;
                if (lag > 10) api.log(`Lag: ${lag.toFixed(1)}ms`);
            }, 100);

            api.log("Lag meter ON.");
        },

        stopLagMeter() {
            if (this.lagInterval) clearInterval(this.lagInterval);
            this.lagInterval = null;
        },

        /*===========================================================
        =  PAINT FLASH OVERLAY (UNSAFE)
        ===========================================================*/
        startPaintFlash() {
            if (this.paintOverlay) return;
            const box = document.createElement("div");
            box.style.cssText = `
                position:fixed;inset:0;pointer-events:none;
                background:rgba(255,0,0,0.1);
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

            this.paintFlashInterval = setInterval(flash, 200);
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
        =  CONSOLE SPY
        ===========================================================*/
        spyConsole() {
            if (this.consolePatched) return this.api.log("Console spy already active.");

            const api = this.api;
            const origLog = console.log;

            console.log = function (...args) {
                origLog.apply(console, args);
                api.log("[console] " + args.map(x => String(x)).join(" "));
            };

            this.consolePatched = true;
            api.log("Console spy active. (Mirroring page console logs)");
        },

        /*===========================================================
        =  UI
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
