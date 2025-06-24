import { FormattedMessage, useIntl } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { Form, Field } from 'react-final-form';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

import messages from './messages';
import { Button } from '../button';
import { Management } from '../teamsAndOrgs/management';
import { nCardPlaceholders } from '../licenses/licensesPlaceholder';
import { CircleMinusIcon } from '../svgIcons';
import { OHSOME_STATS_TOPICS } from '../../config';
import { SwitchToggle } from '../formInputs';

export const BadgeCard = ({ badge }) => {
  return (
    <Link to={`${badge.id}/`} className="bg-white shadow-4 w-100 pa3 black-90 no-underline badge-item">
      <div>
        <img src={ badge.imagePath } className="w3" />
      </div>
      <div>
        <strong className="ttu">{ badge.name }</strong>
        <p className="mb0">{ badge.description }</p>
      </div>
    </Link>
  );
};

export const BadgesManagement = ({badges, isFetched}) => {
  return (
    <Management
      title={
        <FormattedMessage
          {...messages.manage}
          values={{ entity: <FormattedMessage {...messages.badges} /> }}
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
        {badges?.length ? (
          <div className="badges-container">
            { badges.map((i, n) => <BadgeCard key={n} badge={i} />) }
          </div>
        ) : (
          <div className="pv3">
            <FormattedMessage {...messages.noBadges} />
          </div>
        )}
      </ReactPlaceholder>
    </Management>
  );
};

export const BadgeInformation = ({ badge }) => {
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';
  const intl = useIntl();
  const metrics = [
    {value: "changesets", label: intl.formatMessage(messages.changesets)},
  ];
  const [newRequirementMetric, setNewRequirementMetric] = useState();
  const [newRequirementValue, setNewRequirementValue] = useState('');
  const [requirements, setRequirements] = useState([]);
  const {getRootProps, getInputProps} = useDropzone({});

  for (let topic of OHSOME_STATS_TOPICS.split(',')) {
    metrics.push({
      value: `topics.${topic}.added`,
      label: intl.formatMessage(messages[topic]),
    });
  }

  const handleAddRequirement = () => {
    setRequirements([...requirements, {
      metric: newRequirementMetric.value,
      value: newRequirementValue,
    }]);

    setNewRequirementValue('');
    setNewRequirementMetric(null);
  };

  const newRequirementFieldsComplete = newRequirementMetric && newRequirementValue;

  const handleNewRequirementValueChange = (event) => {
    const value = Number(event.target.value);

    if (!isNaN(value)) {
      setNewRequirementValue(event.target.value);
    }
  };

  const handleRemoveRequirement = (requirement) => {
    setRequirements(requirements.filter((r) => r.metric !== requirement.metric));
  };

  return (
    <div className="cf badge-info">
      <label className={labelClasses}>
        <FormattedMessage {...messages.name} />
      </label>
      <Field name="name" component="input" type="text" className={fieldClasses} required />
      <label className={labelClasses}>
        <FormattedMessage {...messages.description} />
      </label>
      <Field name="description" component="textarea" rows={7} className={fieldClasses} required />

      <div class="mt2">
        <Field name="isInternal">
          {({input}) => {
            return <SwitchToggle
              isChecked={!!input.value}
              onChange={input.onChange}
              label={intl.formatMessage(messages.hidden)}
              labelPosition="right"
            />
          }}
        </Field>
      </div>

      <label className={labelClasses}>
        <FormattedMessage {...messages.image} />
      </label>
      <div className="badge-info__img-container">
        { badge && <img src={badge.imagePath} /> }
        <div className="badge-info__uploader" {...getRootProps()}>
          <input {...getInputProps()} />
          <p><FormattedMessage {...messages.uploadNew} /></p>
        </div>
      </div>

      <label className={labelClasses}>
        <FormattedMessage {...messages.requirements} />
      </label>
      <div className="badge-info__requirements">
        <div className="badge-info__input-container">
          <Select
            classNamePrefix="react-select"
            isClearable={true}
            options={metrics}
            value={newRequirementMetric}
            onChange={setNewRequirementMetric}
            className="z-5"
          />
        </div>
        <div className="badge-info__input-container">
          <input
            value={newRequirementValue}
            onChange={handleNewRequirementValueChange}
            className="input-reset ba b--grey-light bg-transparent"
            placeholder={intl.formatMessage(messages.value)}
          />
        </div>
        <Button
          onClick={handleAddRequirement}
          className="bg-red ba b--red white ph3 br1 f5 pointer"
          disabled={!newRequirementFieldsComplete}
        >
          <FormattedMessage {...messages.add} />
        </Button>
      </div>
      <div className="mt4">
        <table className="w-100">
          <thead className="">
            <tr>
              <th className="tl bb b--grey-light"><FormattedMessage {...messages.metric} /></th>
              <th className="tl bb b--grey-light tr"><FormattedMessage {...messages.value} /></th>
              <th className="tl bb b--grey-light tr w3"><FormattedMessage {...messages.remove} /></th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((r) => (
              <tr>
                <td className="h2">{ r.metric }</td>
                <td className="h2 tr">{ r.value }</td>
                <td className="h2 tr">
                  <button
                    className="bn pa0 bg-transparent"
                    onClick={() => handleRemoveRequirement(r)}
                  >
                    <CircleMinusIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const BadgeUpdateForm = ({ badge, updateBadge }) => {
  return (
    <Form
      onSubmit={(values) => updateBadge(values)}
      initialValues={badge}
      render={({
        handleSubmit,
        dirty,
        submitSucceeded,
        dirtySinceLastSubmit,
        form,
        submitting,
      }) => {
        const dirtyForm = submitSucceeded ? dirtySinceLastSubmit && dirty : dirty;
        return (
          <div className="blue-grey mb3">
            <div className={`bg-white b--grey-light pa4 ${dirtyForm ? 'bt bl br' : 'ba'}`}>
              <h3 className="f3 fw6 dib blue-dark mv0">
                <FormattedMessage {...messages.badgeInfo} />
              </h3>
              <form id="badge-form" onSubmit={handleSubmit}>
                <fieldset className="bn pa0" disabled={submitting}>
                  <BadgeInformation badge={badge} />
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
