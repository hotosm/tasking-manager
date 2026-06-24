import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import all SVG icons with 0% coverage
import { AreaIcon } from '../components/svgIcons/area';
import { ChecksGridIcon } from '../components/svgIcons/checksGrid';
import { CircleExclamationIcon } from '../components/svgIcons/circleExclamation';
import { CircleMinusIcon } from '../components/svgIcons/circleMinus';
import { ColumnsGapIcon } from '../components/svgIcons/columnsGap';
import { CutIcon } from '../components/svgIcons/cut';
import { DataUseIcon } from '../components/svgIcons/dataUse';
import { DisasterResponseIcon } from '../components/svgIcons/disasterResponse';
import { EmptySetIcon } from '../components/svgIcons/emptySet';
import { EnvelopeIcon } from '../components/svgIcons/envelope';
import { ExitIcon } from '../components/svgIcons/exit';
import { FileImportIcon } from '../components/svgIcons/fileImport';
import { FullscreenIcon } from '../components/svgIcons/fullscreen';
import { GithubIcon } from '../components/svgIcons/github';
import { HealthIcon } from '../components/svgIcons/health';
import { HumanProcessingIcon } from '../components/svgIcons/humanProcessing';
import { InstagramIcon } from '../components/svgIcons/instagram';
import { InvalidatedIcon } from '../components/svgIcons/invalidated';
import { MappedSquareIcon } from '../components/svgIcons/mappedSquare';
import { PencilIcon } from '../components/svgIcons/pencil';
import { PeopleIcon } from '../components/svgIcons/people';
import { PlayIcon } from '../components/svgIcons/play';
import { PolygonIcon } from '../components/svgIcons/polygon';
import { ProjectSelectionIcon } from '../components/svgIcons/projectSelection';
import { RefugeeResponseIcon } from '../components/svgIcons/refugeeResponse';
import { SelectProjectIcon } from '../components/svgIcons/selectProject';
import { SelectTaskIcon } from '../components/svgIcons/selectTask';
import { SubmitWorkIcon } from '../components/svgIcons/submitWork';
import { SwipeIcon } from '../components/svgIcons/swipe';
import { TaskSelectionIcon } from '../components/svgIcons/taskSelection';
import { ValidationIcon } from '../components/svgIcons/validation';
import { ViewIcon } from '../components/svgIcons/view';
import { WaterSanitationIcon } from '../components/svgIcons/waterSanitation';
import { WorldNodesIcon } from '../components/svgIcons/worldNodes';
import { YoutubeIcon } from '../components/svgIcons/youtube';
import { ZoomMinusIcon } from '../components/svgIcons/zoomMinus';

describe('SVG Icons - 0% coverage icons', () => {
  it('renders AreaIcon without crashing', () => {
    const { container } = render(<AreaIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders ChecksGridIcon without crashing', () => {
    const { container } = render(<ChecksGridIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders CircleExclamationIcon without crashing', () => {
    const { container } = render(<CircleExclamationIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders CircleMinusIcon without crashing', () => {
    const { container } = render(<CircleMinusIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders ColumnsGapIcon without crashing', () => {
    const { container } = render(<ColumnsGapIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders CutIcon without crashing', () => {
    const { container } = render(<CutIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders DataUseIcon without crashing', () => {
    const { container } = render(<DataUseIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders DisasterResponseIcon without crashing', () => {
    const { container } = render(<DisasterResponseIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders EmptySetIcon without crashing', () => {
    const { container } = render(<EmptySetIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders EnvelopeIcon without crashing', () => {
    const { container } = render(<EnvelopeIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders ExitIcon without crashing', () => {
    const { container } = render(<ExitIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders FileImportIcon without crashing', () => {
    const { container } = render(<FileImportIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders FullscreenIcon without crashing', () => {
    const { container } = render(<FullscreenIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders GithubIcon without crashing', () => {
    const { container } = render(<GithubIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders HealthIcon without crashing', () => {
    const { container } = render(<HealthIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders HumanProcessingIcon without crashing', () => {
    const { container } = render(<HumanProcessingIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders InstagramIcon without crashing', () => {
    const { container } = render(<InstagramIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders InvalidatedIcon without crashing', () => {
    const { container } = render(<InvalidatedIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders MappedSquareIcon without crashing', () => {
    const { container } = render(<MappedSquareIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders PencilIcon without crashing', () => {
    const { container } = render(<PencilIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders PeopleIcon without crashing', () => {
    const { container } = render(<PeopleIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders PlayIcon without crashing', () => {
    const { container } = render(<PlayIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders PolygonIcon without crashing', () => {
    const { container } = render(<PolygonIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders ProjectSelectionIcon without crashing', () => {
    const { container } = render(<ProjectSelectionIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders RefugeeResponseIcon without crashing', () => {
    const { container } = render(<RefugeeResponseIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders SelectProjectIcon without crashing', () => {
    const { container } = render(<SelectProjectIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders SelectTaskIcon without crashing', () => {
    const { container } = render(<SelectTaskIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders SubmitWorkIcon without crashing', () => {
    const { container } = render(<SubmitWorkIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders SwipeIcon without crashing', () => {
    const { container } = render(<SwipeIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders TaskSelectionIcon without crashing', () => {
    const { container } = render(<TaskSelectionIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders ValidationIcon without crashing', () => {
    const { container } = render(<ValidationIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders ViewIcon without crashing', () => {
    const { container } = render(<ViewIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders WaterSanitationIcon without crashing', () => {
    const { container } = render(<WaterSanitationIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders WorldNodesIcon without crashing', () => {
    const { container } = render(<WorldNodesIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders YoutubeIcon without crashing', () => {
    const { container } = render(<YoutubeIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders ZoomMinusIcon without crashing', () => {
    const { container } = render(<ZoomMinusIcon />);
    expect(container.firstChild).toBeTruthy();
  });
});
