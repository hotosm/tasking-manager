import { ID_EDITOR_URL, POTLATCH2_EDITOR_URL, RAPID_EDITOR_URL } from '../config';

export function getEditors(filterList, customEditor) {
  let editors = [
    {
      label: 'RapiD',
      value: 'RAPID',
      url: RAPID_EDITOR_URL,
    },
    {
      label: 'iD Editor',
      value: 'ID',
      url: ID_EDITOR_URL,
    },
    {
      label: 'JOSM',
      value: 'JOSM',
      url: 'http://127.0.0.1:8111',
    },
    {
      label: 'Potlatch 2',
      value: 'POTLATCH_2',
      url: POTLATCH2_EDITOR_URL,
    },
    {
      label: 'Field Papers',
      value: 'FIELD_PAPERS',
      url: 'http://fieldpapers.org/compose',
    },
  ];
  if (filterList) {
    editors = editors.filter((i) => filterList.includes(i.value));
  }
  if (customEditor && filterList.includes('CUSTOM')) {
    editors.push({ label: customEditor.name, value: 'CUSTOM', url: customEditor.url });
  }
  return editors;
}
