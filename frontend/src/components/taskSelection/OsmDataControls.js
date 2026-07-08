import { FormattedMessage, useIntl } from 'react-intl';
import messages from './messages';
import { EyeIcon, LoadingIcon } from '../svgIcons';

export function OsmDataControls({
  showOsmFeatures,
  setShowOsmFeatures,
  osmLayerOpacity,
  setOsmLayerOpacity,
  isFetching,
  isSuccess,
  isError,
}) {
  const intl = useIntl();

  // 1. Fetching State (only show full screen loader when we don't have success cached data yet)
  if (showOsmFeatures && isFetching && !isSuccess) {
    return (
      <div className="ba b--light-gray br2 mt3 mb3 pa3 bg-washed-blue flex justify-center items-center">
        <LoadingIcon className="blue-dark h1 w1 mr2" style={{ animation: 'spin 1s linear infinite' }} />
        <span className="f7 fw5 blue-grey animate-pulse">
          <FormattedMessage {...messages.osmDataControlsFetching} />
        </span>
      </div>
    );
  }

  // 2. Error State
  if (showOsmFeatures && isError) {
    return (
      <div className="ba b--red br2 mt3 mb3 pa3 bg-washed-red flex justify-between items-center">
        <div>
          <h4 className="f6 fw6 red mt0 mb1">
            <FormattedMessage {...messages.osmDataControlsErrorTitle} />
          </h4>
          <p className="f7 gray mt0 mb0">
            <FormattedMessage {...messages.osmDataControlsErrorDescription} />
          </p>
        </div>
        <button
          className="bg-red white f7 fw6 ph3 pv2 br2 bn pointer dim"
          onClick={() => setShowOsmFeatures(false)}
        >
          <FormattedMessage {...messages.osmDataControlsReset} />
        </button>
      </div>
    );
  }

  // 3. Loaded/Fetched State (Active)
  if (showOsmFeatures && isSuccess) {
    return (
      <div className="ba b--light-gray br2 mt3 mb3">
        <div className="flex items-center justify-between pa2 bb b--light-gray bg-washed-blue">
          <span className="f6 fw7 ttu blue-grey tracked-tight">
            <FormattedMessage {...messages.osmDataControlsTitle} />
          </span>
          <button
            className="pa1 br2 bn pointer flex items-center justify-center bg-blue-dark white dim"
            style={{ width: '28px', height: '28px' }}
            onClick={() => setShowOsmFeatures(false)}
            title={intl.formatMessage(messages.osmDataControlsHideTitle)}
          >
            <EyeIcon style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
        <div className="pa2">
          <p className="f7 ttu blue-grey tracked-tight mt0 mb2">
            <FormattedMessage {...messages.osmDataControlsOpacityDescription} />
          </p>
          <div className="flex items-center">
            <span className="f7 gray nowrap mr2">
              <FormattedMessage {...messages.osmDataControlsOpacityHidden} />
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(osmLayerOpacity * 100)}
              onChange={(e) => setOsmLayerOpacity(e.target.value / 100)}
              className="flex-auto"
              style={{ cursor: 'pointer' }}
            />
            <span className="f7 gray nowrap ml2">
              <FormattedMessage {...messages.osmDataControlsOpacitySolid} />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Initial / Hidden State
  return (
    <div className="ba b--light-gray br2 mt3 mb3 pa3 flex justify-between items-center bg-near-white">
      <div className="pr2">
        <h4 className="f6 fw6 blue-grey mt0 mb1">
          <FormattedMessage {...messages.osmDataControlsLayerTitle} />
        </h4>
        <p className="f7 gray mt0 mb0">
          {isSuccess ? (
            <FormattedMessage {...messages.osmDataControlsLayerDescriptionReady} />
          ) : (
            <FormattedMessage {...messages.osmDataControlsLayerDescriptionInitial} />
          )}
        </p>
      </div>
      <button
        className="bg-blue-dark white f6 fw6 ph3 pv2 br2 bn pointer dim shrink-0"
        onClick={() => setShowOsmFeatures(true)}
        title={
          isSuccess
            ? intl.formatMessage(messages.osmDataControlsShowTitle)
            : intl.formatMessage(messages.osmDataControlsLoadButton)
        }
      >
        {isSuccess ? (
          <FormattedMessage {...messages.osmDataControlsShowButton} />
        ) : (
          <FormattedMessage {...messages.osmDataControlsLoadButton} />
        )}
      </button>
    </div>
  );
}
