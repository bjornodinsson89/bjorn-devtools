// Unified Unsafe Feature Registry for Bjorn DevTools
(function(){
    const DevTools = window.BjornDevTools;
    if (!DevTools) return;

    DevTools.unsafe = {
        features: {},

        register(pluginId, featureList) {
            this.features[pluginId] = this.features[pluginId] || [];
            featureList.forEach(f => {
                if (!this.features[pluginId].includes(f))
                    this.features[pluginId].push(f);
            });
        },

        isUnsafe(pluginId, feature) {
            if (!this.features[pluginId]) return false;
            return this.features[pluginId].includes(feature);
        }
    };

    // Patch ensureUnsafe to use unified registry
    DevTools.api.ensureUnsafe = function(tool){
        const [pluginId, feature] = tool.split(".");
        const unsafe = DevTools.unsafe.isUnsafe(pluginId, feature);

        if (!unsafe) {
            this.log(`SAFE MODE: '${tool}' is not registered as unsafe.`);
            return false;
        }

        if (DevTools.state.safe) {
            this.log(`SAFE MODE ON — blocked '${tool}'`);
            return false;
        }
        return true;
    };

})();
