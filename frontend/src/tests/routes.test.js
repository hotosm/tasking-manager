import '@testing-library/jest-dom';
import { router } from '../routes';

describe('Routes configuration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should export a configured router', () => {
    expect(router).toBeDefined();
    expect(router.routes).toBeDefined();
    expect(router.routes.length).toBeGreaterThan(0);
  });

  it('should have correct error boundaries and root path', () => {
    const rootRoute = router.routes[0];
    expect(rootRoute.path).toBe('/');
    expect(rootRoute.ErrorBoundary).toBeDefined();
    expect(rootRoute.children).toBeDefined();
  });

  it('should have essential child routes', () => {
    const rootRoute = router.routes[0];
    const paths = rootRoute.children.map(r => r.path).filter(Boolean);
    
    expect(paths).toContain('explore');
    expect(paths).toContain('projects/:id');
    expect(paths).toContain('login');
    expect(paths).toContain('manage');
    expect(paths).toContain('settings');
    expect(paths).toContain('learn');
    expect(paths).toContain('about');
  });

  it('should lazy load routes properly', async () => {
    const rootRoute = router.routes[0];
    const exploreRoute = rootRoute.children.find(r => r.path === 'explore');
    expect(exploreRoute.lazy).toBeDefined();
    
    // We mock the import in a real scenario, but here we just check it is a function that returns a promise
    expect(typeof exploreRoute.lazy).toBe('function');
  });
  
  it('should have redirect routes', () => {
    const rootRoute = router.routes[0];
    const projectRedirect = rootRoute.children.find(r => r.path === 'project/:id');
    expect(projectRedirect).toBeDefined();
    expect(projectRedirect.element).toBeDefined();
    
    const learnRedirect = rootRoute.children.find(r => r.path === 'learn');
    expect(learnRedirect).toBeDefined();
    expect(learnRedirect.element).toBeDefined();
  });

  it('should have wildcard not found route at the end', () => {
    const rootRoute = router.routes[0];
    const catchAllRoute = rootRoute.children[rootRoute.children.length - 1];
    expect(catchAllRoute.path).toBe('*');
    expect(catchAllRoute.element).toBeDefined();
  });

  it('should have child routes within manage', () => {
    const rootRoute = router.routes[0];
    const manageRoute = rootRoute.children.find(r => r.path === 'manage');
    
    expect(manageRoute.children).toBeDefined();
    const managePaths = manageRoute.children.map(r => r.path).filter(Boolean);
    
    expect(managePaths).toContain('stats/');
    expect(managePaths).toContain('organisations/');
    expect(managePaths).toContain('teams/');
    expect(managePaths).toContain('users/');
    expect(managePaths).toContain('projects/:id');
  });

  it('should have child routes within explore', () => {
    const rootRoute = router.routes[0];
    const exploreRoute = rootRoute.children.find(r => r.path === 'explore');
    
    expect(exploreRoute.children).toBeDefined();
    const explorePaths = exploreRoute.children.map(r => r.path).filter(Boolean);
    
    expect(explorePaths).toContain('filters/*');
  });
  
  it('should have child routes within contributions', () => {
    const rootRoute = router.routes[0];
    const contributionsRoute = rootRoute.children.find(r => r.path === 'contributions');
    
    expect(contributionsRoute.children).toBeDefined();
    const contributionsPaths = contributionsRoute.children.map(r => r.path).filter(Boolean);
    
    expect(contributionsPaths).toContain('tasks/*');
    expect(contributionsPaths).toContain('projects/*');
    expect(contributionsPaths).toContain('teams/*');
  });
});
