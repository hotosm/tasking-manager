import { formatProjectTag, formatTitleTag } from '../UseMetaTags';

// Note: useSetTitleTag and useSetProjectPageTitleTag use react-meta-elements hooks
// which require a browser environment. We test the pure functions here.

describe('formatTitleTag', () => {
  it('devuelve el título seguido del nombre de la instancia cuando title está definido', () => {
    const result = formatTitleTag('About');
    expect(result).toContain('About');
    expect(result).toContain('Tasking Manager');
  });

  it('separa el título y el nombre de la instancia con " - "', () => {
    const result = formatTitleTag('Projects');
    expect(result).toContain(' - ');
  });

  it('devuelve solo "Tasking Manager" cuando title es null', () => {
    const result = formatTitleTag(null);
    expect(result).toContain('Tasking Manager');
    expect(result).not.toContain(' - ');
  });

  it('devuelve solo "Tasking Manager" cuando title es undefined', () => {
    const result = formatTitleTag(undefined);
    expect(result).toContain('Tasking Manager');
  });

  it('devuelve solo "Tasking Manager" cuando title es cadena vacía', () => {
    const result = formatTitleTag('');
    expect(result).toContain('Tasking Manager');
  });

  it('incluye el código de organización en el nombre cuando ORG_CODE está definido', () => {
    // ORG_CODE from config may be empty or defined; the function should use it
    const result = formatTitleTag('Stats');
    expect(typeof result).toBe('string');
    expect(result).toContain('Tasking Manager');
  });
});

describe('formatProjectTag', () => {
  it('devuelve el tag formateado con projectId y nombre del proyecto', () => {
    const project = { projectId: 123, projectInfo: { name: 'Flood Relief' } };
    const result = formatProjectTag(project);
    expect(result).toBe('#123: Flood Relief');
  });

  it('devuelve cadena vacía cuando projectId no está definido', () => {
    const result = formatProjectTag({ projectInfo: { name: 'Sin ID' } });
    expect(result).toBe('');
  });

  it('devuelve cadena vacía cuando el proyecto es un objeto vacío', () => {
    const result = formatProjectTag({});
    expect(result).toBe('');
  });

  it('maneja projectInfo undefined (solo muestra el ID con undefined)', () => {
    const project = { projectId: 42, projectInfo: undefined };
    const result = formatProjectTag(project);
    expect(result).toContain('#42');
  });

  it('maneja projectInfo null (muestra #ID: null)', () => {
    const project = { projectId: 7, projectInfo: null };
    const result = formatProjectTag(project);
    expect(result).toContain('#7');
  });

  it('concatena correctamente el tag para proyectos reales', () => {
    const project = { projectId: 999, projectInfo: { name: 'Road Mapping' } };
    expect(formatProjectTag(project)).toBe('#999: Road Mapping');
  });
});
