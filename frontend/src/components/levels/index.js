import { FormattedMessage, useIntl } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { Form, Field } from 'react-final-form';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { useState } from 'react';

import messages from './messages';
import { Button } from '../button';
import { Management } from '../teamsAndOrgs/management';
import { nCardPlaceholders } from '../licenses/licensesPlaceholder';
import { SwitchToggle } from '../formInputs';
import { CircleMinusIcon } from '../svgIcons';

export const LevelCard = ({ level, number }) => {
  return (
    <Link to={`${level.id}/`} className="bg-white shadow-4 w-100 pa3 black-90 no-underline level-item">
      <div>
        <strong className="ttu">{ number }. { level.name }</strong>
      </div>
    </Link>
  );
};

export const LevelsManagement = ({levels, isFetched}) => {
  return (
    <Management
      title={
        <FormattedMessage
          {...messages.manage}
          values={{ entity: <FormattedMessage {...messages.levels} /> }}
        />
      }
      showAddButton={true}
      managementView
    >
      <ReactPlaceholder
        showLoadingAnimation={true}
        customPlaceholder={nCardPlaceholders(4)}
        delay={10}
        ready={isFetched}
      >
        {levels?.length ? (
          <div className="levels-container">
            { levels.map((i, n) => <LevelCard key={n} level={i} number={n+1} />) }
          </div>
        ) : (
          <div className="pv3">
            <FormattedMessage {...messages.noLevels} />
          </div>
        )}
      </ReactPlaceholder>
    </Management>
  );
};

export const LevelInformation = ({ badges }) => {
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';

  return (
    <>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.name} />
        </label>
        <Field name="name" component="input" type="text" className={fieldClasses} required />

        <Field name="approvalsRequired">
          {({input}) => ApprovalsRequiredField({ input })}
        </Field>

        <label className={labelClasses}>
          <FormattedMessage {...messages.color} />
        </label>
        <Field name="color">
          {({input}) => ColorField({ input })}
        </Field>

        <label className={labelClasses}>
          <FormattedMessage {...messages.required_badges} />
        </label>
        <Field name="requiredBadges" className={fieldClasses} required>
          {({input}) => RequiredBadgesField({input, badges})}
        </Field>
      </div>
    </>
  );
};

function RequiredBadgesField({input, badges}) {
  const badge_options = (badges || [])
    .filter((b) => input.value.find((ib) => ib.id == b.id) === undefined)
    .map((b) => ({ value: b.id, label: b.name}));

  const [selectedBadge, setSelectedBadge] = useState(null);

  function handleAddBadge() {
    input.onChange([...input.value, {
      id: selectedBadge.value,
      name: selectedBadge.label,
    }]);

    setSelectedBadge(null);
  }

  return <>
    <div className="flex" style={{gap: ".5rem"}}>
      <Select
        classNamePrefix="react-select"
        isClearable={false}
        options={badge_options}
        className="z-5 w-100"
        value={selectedBadge}
        onChange={setSelectedBadge}
      />
      <Button
        type="button"
        className="bg-red white ba b--red pointer br1"
        disabled={!selectedBadge}
        onClick={handleAddBadge}
      >
        <FormattedMessage {...messages.add} />
      </Button>
    </div>
    <div className="flex mt2" style={{gap: ".5rem"}}>
      {(input.value || []).map((badge) => <>
        <div className="bg-silver ph3 pv2 flex items-center br1 white" style={{gap: ".5rem"}}>
          <div>
            { badge.name }
          </div>
          <button
            type="button"
            className="pa0 pointer ba bg-transparent bn"
            onClick={() => input.onChange(input.value.filter((b) => b.id != badge.id))}
          >
            <CircleMinusIcon />
          </button>
        </div>
      </>)}
    </div>
  </>;
}

function ColorField({ input }) {
  const handleInputOnChange = (event) => {
    input.onChange(event.target.value);
  };

  return <>
    <div className="flex ba b--grey-light pr3 justify-between items-center" style={{gap: ".5rem"}}>
      <input type="text" value={input.value} onChange={handleInputOnChange} className="bn ph2 pv3" />
      <input type="color" value={input.value} onChange={handleInputOnChange} className="pointer pa0 bn w1 h1" />
    </div>
  </>;
}

function ApprovalsRequiredField({ input }) {
  const intl = useIntl();
  const num = Number(input.value);

  const handleSwitchOnChange = (event) => {
    if (event.target.checked) {
      input.onChange("1");
    } else {
      input.onChange("0");
    }
  };

  const handleInputOnChange = (event) => {
    const value = event.target.value;
    const num = Number(value);

    if (!isNaN(num)) {
      if (num <= 0) {
        input.onChange("0");
      } else {
        input.onChange(value.toString());
      }
    } else {
      input.onChange("1");
    }
  };

  return <>
    <div className="mt2">
      <SwitchToggle
        isChecked={num > 0}
        onChange={handleSwitchOnChange}
        label={intl.formatMessage(messages.peer_review)}
        labelPosition="right"
      />
    </div>
    {num > 0 && <>
      <label className="db pt3 pb2">
        <FormattedMessage {...messages.approvals_required} />
      </label>
      <input
        type="number"
        value={ input.value }
        onChange={handleInputOnChange}
        className="blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent"
      />
    </>}
  </>;
}

export const LevelForm = ({ level, badges, updateLevel }) => {
  return (
    <Form
      onSubmit={(values) => updateLevel(values)}
      initialValues={level}
      render={({
        handleSubmit,
        dirty,
        submitSucceeded,
        dirtySinceLastSubmit,
        form,
        submitting,
        values,
      }) => {
        const dirtyForm = submitSucceeded ? dirtySinceLastSubmit && dirty : dirty;
        return (
          <div className="blue-grey mb3">
            <div className={`bg-white b--grey-light pa4 ${dirtyForm ? 'bt bl br' : 'ba'}`}>
              <h3 className="f3 fw6 dib blue-dark mv0">
                <FormattedMessage {...messages.levelInfoTitle} />
              </h3>
              <form id="level-form" onSubmit={handleSubmit}>
                <fieldset className="bn pa0" disabled={submitting}>
                  <LevelInformation badges={badges} />
                </fieldset>
              </form>
            </div>
            {dirtyForm && (
              <div className="cf pt0 h3">
                <div className="w-70-l w-50 fl tr dib bg-grey-light">
                  <Button className="blue-dark bg-grey-light h3" onClick={() => form.restart()}>
                    <FormattedMessage {...messages.cancel} />
                  </Button>
                </div>
                <div className="w-30-l w-50 h-100 fr dib">
                  <Button
                    onClick={() => handleSubmit()}
                    className="w-100 h-100 bg-red white"
                    disabledClassName="bg-red o-50 white w-100 h-100"
                  >
                    <FormattedMessage {...messages.save} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      }}
    ></Form>
  );
};
