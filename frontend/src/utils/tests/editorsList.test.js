import { getEditors } from '../editorsList';

describe('test getEditors', () => {
  it('without filterList and without customEditor', () => {
    expect(getEditors()).toStrictEqual([
      {
        label: 'RapiD',
        value: 'RAPID',
        url: 'https://mapwith.ai/rapid',
      },
      {
        label: 'iD Editor',
        value: 'ID',
        url: 'https://www.openstreetmap.org/edit?editor=id&',
      },
      {
        label: 'JOSM',
        value: 'JOSM',
        url: 'http://127.0.0.1:8111',
      },
      {
        label: 'Potlatch 2',
        value: 'POTLATCH_2',
        url: 'https://www.openstreetmap.org/edit?editor=potlatch2',
      },
      {
        label: 'Field Papers',
        value: 'FIELD_PAPERS',
        url: 'http://fieldpapers.org/compose',
      },
    ]);
  });

  it('with ID and JOSM in the filterList', () => {
    expect(getEditors(['ID', 'JOSM'])).toStrictEqual([
      {
        label: 'iD Editor',
        value: 'ID',
        url: 'https://www.openstreetmap.org/edit?editor=id&',
      },
      {
        label: 'JOSM',
        value: 'JOSM',
        url: 'http://127.0.0.1:8111',
      },
    ]);
  });

  it('with customEditor and filterList including the CUSTOM value', () => {
    const customEditor = {
      name: 'RapiD',
      description: null,
      url: 'https://mapwith.ai/rapid',
    };
    expect(getEditors(['ID', 'JOSM', 'CUSTOM'], customEditor)).toStrictEqual([
      {
        label: 'iD Editor',
        value: 'ID',
        url: 'https://www.openstreetmap.org/edit?editor=id&',
      },
      {
        label: 'JOSM',
        value: 'JOSM',
        url: 'http://127.0.0.1:8111',
      },
      {
        label: 'RapiD',
        value: 'CUSTOM',
        url: 'https://mapwith.ai/rapid',
      },
    ]);
  });
});
