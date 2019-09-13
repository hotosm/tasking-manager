import { CUSTOM_ID_EDITOR_INSTANCE_NAME, CUSTOM_ID_EDITOR_INSTANCE_HOST } from '../config';

export function getEditors() {
  let editors = [
    { label: 'iD Editor', value: 'iD Editor', url: 'http://www.openstreetmap.org/edit?editor=id&' },
    { label: 'JOSM', value: 'JOSM', url: 'http://127.0.0.1:8111' },
    {
      label: 'Potlatch2',
      value: 'Potlatch2',
      url: 'http://www.openstreetmap.org/edit?editor=potlatch2',
    },
    { label: 'Field Papers', value: 'Field Papers', url: 'http://fieldpapers.org/compose' },
  ];
  if (CUSTOM_ID_EDITOR_INSTANCE_NAME && CUSTOM_ID_EDITOR_INSTANCE_HOST) {
    editors.push({
      label: CUSTOM_ID_EDITOR_INSTANCE_NAME,
      value: CUSTOM_ID_EDITOR_INSTANCE_NAME,
      url: CUSTOM_ID_EDITOR_INSTANCE_HOST,
    });
  }
  return editors;
}
