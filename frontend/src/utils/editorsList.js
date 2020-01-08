
export function getEditors() {
  let editors = [
    {
      label: 'iD Editor',
      value: 'ID',
      url: 'http://www.openstreetmap.org/edit?editor=id&',
    },
    {
      label: 'JOSM',
      value: 'JOSM',
      url: 'http://127.0.0.1:8111'
    },
    {
      label: 'Potlatch 2',
      value: 'POTLATCH_2',
      url: 'http://www.openstreetmap.org/edit?editor=potlatch2',
    },
    {
      label: 'Field Papers',
      value: 'FIELD_PAPERS',
      url: 'http://fieldpapers.org/compose',
    },
  ];
  return editors;
}
