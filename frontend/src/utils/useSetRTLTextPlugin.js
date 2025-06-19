import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

import { MAPBOX_RTL_PLUGIN_URL } from '../config';

export default function useSetRTLTextPlugin() {
  useEffect(() => {
    const pluginStatus = maplibregl.getRTLTextPluginStatus();
    // load the plugin only when not loaded
    if (pluginStatus === 'unavailable') {
      maplibregl.setRTLTextPlugin(
        MAPBOX_RTL_PLUGIN_URL,
        true, // lazy load the plugin
      );
    }
  }, []);

  return null;
}
