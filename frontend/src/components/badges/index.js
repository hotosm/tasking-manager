import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import ReactPlaceholder from 'react-placeholder';
import { Form, Field } from 'react-final-form';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

import messages from './messages';
import { Button } from '../button';
import { Management } from '../teamsAndOrgs/management';
import { nCardPlaceholders } from './nCardPlaceholders';
import { CircleMinusIcon } from '../svgIcons';
import { OHSOME_STATS_TOPICS, IMAGE_UPLOAD_SERVICE } from '../../config';
import { SwitchToggle } from '../formInputs';
import { useUploadImage } from '../../hooks/UseUploadImage';

export const BadgeCard = ({ badge }) => {
  return (
    <Link to={`${badge.id}/`} className="bg-white shadow-4 w-100 pa3 black-90 no-underline badge-item">
      <div>
        <img
          src={ badge.imagePath }
          className="w3"
          alt={`${badge.name} badge icon`}
        />
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
            { badges.map((b) => <BadgeCard key={b.id} badge={b} />) }
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

  const validateRequirements = (value) => {
    let isError = false;

    try {
      const v = JSON.parse(value);

      if (Object.keys(v).length === 0) {
        isError = true;
      }
    } catch (e) {
      isError = true;
    }

    if (isError) {
      return <FormattedMessage {...messages.needsRequirements} />;
    }
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

      <div className="mt2">
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
      {IMAGE_UPLOAD_SERVICE ? <Field name="imagePath">
        {({input}) => BadgeImageField({ input })}
      </Field> : <Field name="imagePath" component="input" type="text" className={fieldClasses} /> }

      <label className={labelClasses}>
        <FormattedMessage {...messages.requirements} />
      </label>
      <Field name="requirements" validate={validateRequirements}>
        {({input}) => BadgeRequirementsField({ input })}
      </Field>
    </div>
  );
};

function BadgeImageField({ input }) {
  const [uploadError, uploading, uploadImg] = useUploadImage();
  const [dropError, setDropError] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const error = uploadError || dropError;
  const intl = useIntl();

  const {getRootProps, getInputProps} = useDropzone({
    maxFiles: 1,
    maxSize: 1000000,
    multiple: false,
    accept: '.png,.jpg',
    onDropAccepted: (files) => {
      uploadImg(files[0], input.onChange, token);
      setDropError(false);
    },
    onDropRejected: () => setDropError(true),
  });

  let message = intl.formatMessage(messages.uploadNew);

  if (uploading) {
    message = intl.formatMessage(messages.uploading);
  } else if (error) {
    message = intl.formatMessage(messages.imageError);
  }

  return <div className="badge-info__img-container">
    { input.value && <img src={input.value} alt="previous badge" /> }
    <div
      className={"badge-info__uploader" + (uploading?" uploading":"") + (error?" error":"")}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <p>{ message }</p>
    </div>
  </div>;
}

function BadgeRequirementsField({ input }) {
  const intl = useIntl();

  const [newRequirementMetric, setNewRequirementMetric] = useState();
  const [newRequirementValue, setNewRequirementValue] = useState('');

  const data = JSON.parse(input.value || '{}');
  const keys = Object.keys(data);
  const items = keys.map((k) => [k, data[k]]);

  const newRequirementFieldsComplete = newRequirementMetric && newRequirementValue;

  const metrics = OHSOME_STATS_TOPICS.split(',').map((topic) => {
    return {
      value: topic,
      label: intl.formatMessage(messages[topic]),
    };
  });

  const handleRemoveRequirement = (metric) => {
    data[metric] = undefined;

    input.onChange(JSON.stringify(data));
  };

  const handleAddRequirement = () => {
    data[newRequirementMetric.value] = Number(newRequirementValue);

    input.onChange(JSON.stringify(data));

    setNewRequirementValue('');
    setNewRequirementMetric(null);
  };

  const handleNewRequirementValueChange = (event) => {
    const value = Number(event.target.value);

    if (!isNaN(value)) {
      setNewRequirementValue(event.target.value);
    }
  };

  return <>
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

    {items.length > 0 && <div className="mt4">
      <table className="w-100">
        <thead className="">
          <tr>
            <th className="tl bb b--grey-light"><FormattedMessage {...messages.metric} /></th>
            <th className="tl bb b--grey-light tr"><FormattedMessage {...messages.value} /></th>
            <th className="tl bb b--grey-light tr w3"><FormattedMessage {...messages.remove} /></th>
          </tr>
        </thead>
        <tbody>
          {items.map(([metric, value]) => (
            <tr key={metric}>
              <td className="h2">{ metric }</td>
              <td className="h2 tr">{ value }</td>
              <td className="h2 tr">
                <button
                  type="button"
                  className="bn pa0 bg-transparent pointer"
                  onClick={() => handleRemoveRequirement(metric)}
                >
                  <CircleMinusIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>}
  </>
}

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
