import { useEffect, useState } from 'react';

export function useContainsMultiplePolygons(geom) {
  const [containsMultiplePolygons, setContainsMultiplePolygons] = useState(false);
  useEffect(() => {
    if (geom && geom.features && geom.features.length) {
      if (geom.features.length > 1) setContainsMultiplePolygons(true);
      if (geom.features.length === 1 && geom.features[0].geometry.type === 'MultiPolygon') {
        setContainsMultiplePolygons(true);
      }
    }
    if (geom === null || (geom.features && geom.features.length === 0)) {
      setContainsMultiplePolygons(false);
    }
  }, [setContainsMultiplePolygons, geom]);
  return { containsMultiplePolygons };
}
