function getAllFeatures(drawInstance) {
  if (!drawInstance) return;
  return drawInstance.getSnapshot().reduce((previous, current) => {
    if (current.properties.mode !== 'select') return [...previous, { ...current, properties: {} }];
    return previous;
  }, []);
}

function removeFeaturesById(drawInstance, idList) {
  if (!drawInstance || !idList || !idList?.length) return;
  const currentfeatureIds = getAllFeatures(drawInstance).map((f) => f.id);
  const deletableIds = idList.filter((id) => currentfeatureIds.includes(id));
  drawInstance.removeFeatures(deletableIds);
}
export { getAllFeatures, removeFeaturesById };
