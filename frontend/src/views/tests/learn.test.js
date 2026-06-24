import '@testing-library/jest-dom';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LearnPage } from '../learn';
import { renderWithRouter, ReduxIntlProviders, createComponentWithMemoryRouter } from '../../utils/testWithIntl';

jest.mock('../../components/svgIcons', () => ({
  PlayIcon: () => <svg data-testid="play-icon" />,
  CloseIcon: ({ onClick }) => <svg data-testid="close-icon" onClick={onClick} />,
  PolygonIcon: () => <svg data-testid="polygon-icon" />,
  SelectProject: () => <svg data-testid="select-project-icon" />,
  SelectTask: () => <svg data-testid="select-task-icon" />,
  ValidationIcon: () => <svg data-testid="validation-icon" />,
  HumanProcessingIcon: () => <svg data-testid="human-processing-icon" />,
  WorldNodesIcon: () => <svg data-testid="world-nodes-icon" />,
}));

describe('LearnPage Views', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderLearnPage = (type = 'map') => {
    return createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <LearnPage />
      </ReduxIntlProviders>,
      { route: `/learn/${type}` }
    );
  };

  it('renders learn map page correctly', () => {
    const { container } = renderLearnPage('map');
    expect(screen.getByText(/Learn to Map/i)).toBeInTheDocument();
    expect(screen.getByTestId('select-project-icon')).toBeInTheDocument();
    expect(screen.getByTestId('select-task-icon')).toBeInTheDocument();
    expect(screen.getByTestId('polygon-icon')).toBeInTheDocument();
  });

  it('renders learn validate page correctly', () => {
    renderLearnPage('validate');
    expect(screen.getByText(/Learn to Validate/i)).toBeInTheDocument();
    expect(screen.getByTestId('validation-icon')).toBeInTheDocument();
    expect(screen.getByTestId('human-processing-icon')).toBeInTheDocument();
    expect(screen.getByTestId('world-nodes-icon')).toBeInTheDocument();
  });

  it('renders learn manage page correctly', () => {
    renderLearnPage('manage');
    expect(screen.getByText(/Learn to Manage/i)).toBeInTheDocument();
  });

  it('navigates between sections', async () => {
    const user = userEvent.setup();
    renderLearnPage('map');
    
    // Check initial state
    expect(screen.getByText(/Learn to Map/i)).toBeInTheDocument();

    // Click on Validate section
    const validateNav = screen.getByText('Validate');
    await user.click(validateNav);
    
    // Since we mocked Router, we might need to check if setSection updated the view
    // The component manages local state for 'section', so clicking updates it directly
    expect(screen.getByText(/Learn to Validate/i)).toBeInTheDocument();

    // Click on Manage section
    const manageNav = screen.getByText('Manage');
    await user.click(manageNav);
    expect(screen.getByText(/Learn to Manage/i)).toBeInTheDocument();
  });

  it('opens and closes video popups', async () => {
    const user = userEvent.setup();
    renderLearnPage('map');
    
    // Find video thumbnail (using PlayIcon as a proxy or text)
    const playIcons = screen.getAllByTestId('play-icon');
    expect(playIcons.length).toBeGreaterThan(0);
    
    // Click first video
    fireEvent.click(playIcons[0]);
    
    // Popup should open
    await waitFor(() => {
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });

    // Close popup
    fireEvent.click(screen.getByTestId('close-icon'));
    await waitFor(() => {
      expect(screen.queryByTestId('close-icon')).not.toBeInTheDocument();
    });
  });

  it('handles invalid type parameter gracefully', () => {
    renderLearnPage('invalid');
    // If invalid type, it might not render any section, just the nav
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();
    expect(screen.getByText('Manage')).toBeInTheDocument();
  });

  it('displays step cards and manuals on manage page', () => {
    renderLearnPage('manage');
    // Manuals title
    expect(screen.getByText('Manuals')).toBeInTheDocument();
  });
  
  it('displays steps and videos on validate page', () => {
    renderLearnPage('validate');
    expect(screen.getByText('Videos')).toBeInTheDocument();
  });
});
