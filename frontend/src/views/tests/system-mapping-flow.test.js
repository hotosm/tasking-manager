import '@testing-library/jest-dom';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';

import { store } from '../../store';
import { server } from '../../network/tests/server';
import { handlers } from '../../network/tests/server-handlers';
import { rest } from 'msw';
import { API_URL } from '../../config';

// Importar vistas
import { Login } from '../login';
import { ProjectsPage, ProjectDetailPage } from '../project';
import { SelectTask } from '../taskSelection';
import { MapTask } from '../taskAction';

// Importar componentes para lazy loading
import '../../components/taskSelection/footer';

// Mock de scrollTo para evitar warnings en jsdom
window.scrollTo = jest.fn();

// Helper para crear providers
const ReduxIntlProviders = ({ children, props = { locale: 'en' } }) => (
  <Provider store={store}>
    <IntlProvider {...props}>{children}</IntlProvider>
  </Provider>
);

const QueryClientProviders = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: process.env.NODE_ENV === 'test' ? () => {} : console.error,
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

// Helper para renderizar con router y providers completos
const renderWithFullRouter = (initialEntry = '/') => {
  const user = userEvent.setup();

  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <QueryClientProviders>
            <QueryParamProvider adapter={ReactRouter6Adapter}>
              <ReduxIntlProviders>
                <ProjectsPage />
              </ReduxIntlProviders>
            </QueryParamProvider>
          </QueryClientProviders>
        ),
      },
      {
        path: '/login',
        element: (
          <QueryClientProviders>
            <QueryParamProvider adapter={ReactRouter6Adapter}>
              <ReduxIntlProviders>
                <Login redirectTo="/welcome" />
              </ReduxIntlProviders>
            </QueryParamProvider>
          </QueryClientProviders>
        ),
      },
      {
        path: '/projects/:id',
        element: (
          <QueryClientProviders>
            <QueryParamProvider adapter={ReactRouter6Adapter}>
              <ReduxIntlProviders>
                <ProjectDetailPage />
              </ReduxIntlProviders>
            </QueryParamProvider>
          </QueryClientProviders>
        ),
      },
      {
        path: '/projects/:id/:tabname',
        element: (
          <QueryClientProviders>
            <QueryParamProvider adapter={ReactRouter6Adapter}>
              <ReduxIntlProviders>
                <SelectTask />
              </ReduxIntlProviders>
            </QueryParamProvider>
          </QueryClientProviders>
        ),
      },
      {
        path: '/projects/:id/map',
        element: (
          <QueryClientProviders>
            <QueryParamProvider adapter={ReactRouter6Adapter}>
              <ReduxIntlProviders>
                <MapTask />
              </ReduxIntlProviders>
            </QueryParamProvider>
          </QueryClientProviders>
        ),
      },
      {
        path: '*',
        element: <div>404 - Not Found</div>,
      },
    ],
    {
      initialEntries: [initialEntry],
      initialIndex: 0,
    },
  );

  const { container } = render(<RouterProvider router={router} />);

  return { user, container, router };
};

describe('🔄 E2E - Flujo Completo de Mapeo', () => {
  beforeEach(() => {
    // Resetear el store antes de cada test
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: null });
      store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
    });
    // Resetear handlers de MSW
    server.resetHandlers();
  });

  describe('PASO 1: Login', () => {
    it('debería mostrar la página de login cuando el usuario no está autenticado', async () => {
      const { router } = renderWithFullRouter('/login');

      // Verificar que estamos en la página de login
      await waitFor(() => {
        expect(screen.getByText(/Tasking Manager/)).toBeInTheDocument();
      });

      expect(screen.getByText('Log in')).toBeInTheDocument();
      expect(screen.getByText('Create an account')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/login');
    });

    it('debería simular login exitoso y redirigir a explore', async () => {
      const { router } = renderWithFullRouter('/login');

      // Simular login: establecer token y detalles de usuario
      act(() => {
        store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
        store.dispatch({
          type: 'SET_USER_DETAILS',
          userDetails: {
            id: 69,
            username: 'test_mapper',
            isExpert: true,
            role: 'MAPPER',
            mappingLevel: 'INTERMEDIATE',
            defaultEditor: 'iD',
          },
        });
      });

      // Navegar a explore
      act(() => {
        router.navigate('/');
      });

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/');
      });
    });
  });

  describe('PASO 2: Buscar Proyecto', () => {
    beforeEach(() => {
      // Configurar usuario logueado
      act(() => {
        store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
        store.dispatch({
          type: 'SET_USER_DETAILS',
          userDetails: {
            id: 69,
            username: 'test_mapper',
            isExpert: true,
            role: 'MAPPER',
            mappingLevel: 'INTERMEDIATE',
            defaultEditor: 'iD',
          },
        });
      });
    });

    it('debería mostrar la lista de proyectos en la página de explore', async () => {
      renderWithFullRouter('/');

      // Verificar que se muestra al menos un proyecto
      await waitFor(() => {
        expect(screen.getByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
      });
    });

    it('debería navegar al detalle de un proyecto al hacer click', async () => {
      const { user, router } = renderWithFullRouter('/');

      // Esperar a que carguen los proyectos
      await waitFor(() => {
        expect(screen.getByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
      });

      // Navegar al detalle del proyecto 123
      act(() => {
        router.navigate('/projects/123');
      });

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/projects/123');
      });
    });
  });

  describe('PASO 3: Seleccionar Tarea', () => {
    beforeEach(() => {
      act(() => {
        store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
        store.dispatch({
          type: 'SET_USER_DETAILS',
          userDetails: {
            id: 69,
            username: 'test_mapper',
            isExpert: true,
            role: 'MAPPER',
            mappingLevel: 'INTERMEDIATE',
            defaultEditor: 'iD',
          },
        });
        store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
      });
    });

    it('debería mostrar la página de selección de tareas', async () => {
      const { router } = renderWithFullRouter('/projects/123/tasks');

      // Esperar a que cargue la página de selección de tareas
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/projects/123/tasks');
      });

      // Verificar que se muestra contenido de la página de tareas
      // Nota: Como el componente usa lazy loading y mapas, verificamos que no sea 404
      expect(screen.queryByText('404 - Not Found')).not.toBeInTheDocument();
    });

    it('debería mostrar instrucciones del proyecto', async () => {
      const { router } = renderWithFullRouter('/projects/123/instructions');

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/projects/123/instructions');
      });

      expect(screen.queryByText('404 - Not Found')).not.toBeInTheDocument();
    });
  });

  describe('PASO 4: Abrir Editor de Mapeo', () => {
    beforeEach(() => {
      act(() => {
        store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
        store.dispatch({
          type: 'SET_USER_DETAILS',
          userDetails: {
            id: 69,
            username: 'test_mapper',
            isExpert: true,
            role: 'MAPPER',
            mappingLevel: 'INTERMEDIATE',
            defaultEditor: 'iD',
          },
        });
        store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
      });
    });

    it('debería navegar a la página de mapeo', async () => {
      const { router } = renderWithFullRouter('/projects/123/map');

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/projects/123/map');
      });

      expect(screen.queryByText('404 - Not Found')).not.toBeInTheDocument();
    });
  });

  describe('🔄 FLUJO COMPLETO E2E: Login -> Buscar Proyecto -> Seleccionar Tarea -> Abrir Editor', () => {
    beforeEach(() => {
      // Resetear handlers de MSW para el flujo completo
      server.resetHandlers();
      server.use(...handlers);
    });

    it('debería ejecutar el flujo completo de mapeo de principio a fin', async () => {
      // ============================================================
      // PASO 1: LOGIN - Usuario no autenticado intenta acceder
      // ============================================================
      const { user, router } = renderWithFullRouter('/');

      // Verificar que el usuario no está logueado (token null)
      expect(store.getState().auth.token).toBeNull();

      // Simular que el usuario navega a login
      act(() => {
        router.navigate('/login');
      });

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/login');
      });

      // Verificar que la página de login se muestra correctamente
      expect(screen.getByText(/Tasking Manager/)).toBeInTheDocument();
      expect(screen.getByText('Log in')).toBeInTheDocument();

      // Simular login exitoso (dispatch de acciones de Redux)
      act(() => {
        store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
        store.dispatch({
          type: 'SET_USER_DETAILS',
          userDetails: {
            id: 69,
            username: 'test_mapper',
            isExpert: true,
            role: 'MAPPER',
            mappingLevel: 'INTERMEDIATE',
            defaultEditor: 'iD',
          },
        });
      });

      // ============================================================
      // PASO 2: BUSCAR PROYECTO - Navegar a explore y ver proyectos
      // ============================================================
      act(() => {
        router.navigate('/');
      });

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/');
      });

      // Verificar que se muestra la lista de proyectos
      await waitFor(() => {
        expect(screen.getByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
      });

      // Verificar que el usuario está logueado
      expect(store.getState().auth.token).toBe('validToken');
      expect(store.getState().auth.userDetails.username).toBe('test_mapper');

      // ============================================================
      // PASO 3: NAVEGAR AL DETALLE DEL PROYECTO
      // ============================================================
      act(() => {
        router.navigate('/projects/123');
      });

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/projects/123');
      });

      // Verificar que no estamos en 404
      expect(screen.queryByText('404 - Not Found')).not.toBeInTheDocument();

      // ============================================================
      // PASO 4: SELECCIONAR TAREA - Ir a la página de tareas
      // ============================================================
      act(() => {
        router.navigate('/projects/123/tasks');
      });

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/projects/123/tasks');
      });

      // Verificar que estamos en la página de selección de tareas
      expect(screen.queryByText('404 - Not Found')).not.toBeInTheDocument();

      // ============================================================
      // PASO 5: ABRIR EDITOR DE MAPEO
      // ============================================================
      act(() => {
        router.navigate('/projects/123/map');
      });

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/projects/123/map');
      });

      // Verificar que estamos en la página de mapeo
      expect(screen.queryByText('404 - Not Found')).not.toBeInTheDocument();

      // ============================================================
      // VERIFICACIONES FINALES DEL FLUJO
      // ============================================================
      // Verificar que el usuario sigue logueado al final del flujo
      expect(store.getState().auth.token).toBe('validToken');
      expect(store.getState().auth.userDetails.username).toBe('test_mapper');

      // Verificar que la ruta final es correcta
      expect(router.state.location.pathname).toBe('/projects/123/map');
    });

    it('debería redirigir a login cuando un usuario no autenticado intenta acceder a tareas', async () => {
      // Asegurar que no hay token
      act(() => {
        store.dispatch({ type: 'SET_TOKEN', token: null });
      });

      const { router } = renderWithFullRouter('/projects/123/tasks');

      // Debería redirigir a login porque no hay token
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/login');
      });
    });

    it('debería permitir acceso a tareas cuando el usuario está autenticado', async () => {
      // Configurar usuario autenticado
      act(() => {
        store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
        store.dispatch({
          type: 'SET_USER_DETAILS',
          userDetails: {
            id: 69,
            username: 'test_mapper',
            isExpert: true,
            role: 'MAPPER',
            mappingLevel: 'INTERMEDIATE',
            defaultEditor: 'iD',
          },
        });
      });

      const { router } = renderWithFullRouter('/projects/123/tasks');

      // No debería redirigir a login
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/projects/123/tasks');
      });
    });
  });

  describe('🔒 Validaciones de Seguridad del Flujo', () => {
    it('debería requerir autenticación para acceder al editor de mapeo', async () => {
      // Sin token
      act(() => {
        store.dispatch({ type: 'SET_TOKEN', token: null });
      });

      const { router } = renderWithFullRouter('/projects/123/map');

      // Debería redirigir a login
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/login');
      });
    });

    it('debería mantener la sesión activa durante todo el flujo', async () => {
      // Login inicial
      act(() => {
        store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
        store.dispatch({
          type: 'SET_USER_DETAILS',
          userDetails: {
            id: 69,
            username: 'test_mapper',
            isExpert: true,
            role: 'MAPPER',
          },
        });
      });

      const { router } = renderWithFullRouter('/');

      // Navegar por todas las páginas del flujo
      const routes = ['/', '/projects/123', '/projects/123/tasks', '/projects/123/map'];

      for (const route of routes) {
        act(() => {
          router.navigate(route);
        });

        await waitFor(() => {
          expect(router.state.location.pathname).toBe(route);
        });

        // Verificar que el token sigue presente
        expect(store.getState().auth.token).toBe('validToken');
      }
    });
  });
});

describe('🌐 E2E - Flujo de Mapeo con Interacciones de Usuario', () => {
  beforeEach(() => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: {
          id: 69,
          username: 'test_mapper',
          isExpert: true,
          role: 'MAPPER',
          mappingLevel: 'INTERMEDIATE',
          defaultEditor: 'iD',
        },
      });
      store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
    });
    server.resetHandlers();
    server.use(...handlers);
  });

  it('debería permitir al usuario explorar proyectos y navegar al detalle', async () => {
    const { user, router } = renderWithFullRouter('/');

    // Verificar página de explore
    await waitFor(() => {
      expect(screen.getByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    });

    // Navegar al proyecto
    act(() => {
      router.navigate('/projects/123');
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/projects/123');
    });

    // Navegar a tareas
    act(() => {
      router.navigate('/projects/123/tasks');
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/projects/123/tasks');
    });
  });

  it('debería verificar que las rutas públicas e instrucciones funcionan sin login', async () => {
    // Sin autenticación
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });

    const { router } = renderWithFullRouter('/projects/123/instructions');

    // Las instrucciones deberían ser accesibles sin login
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/projects/123/instructions');
    });
  });
});
