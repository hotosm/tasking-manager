import React, { useState, useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import projectEditMessages from '../components/projectEdit/messages';
import { DescriptionForm } from '../components/projectEdit/descriptionForm';
import { InstructionsForm } from '../components/projectEdit/instructionsForm';
import { MetadataForm } from '../components/projectEdit/metadataForm';
import { PriorityAreasForm } from '../components/projectEdit/priorityAreasForm';
import { ImageryForm } from '../components/projectEdit/imageryForm';
import { PermissionsForm } from '../components/projectEdit/permissionsForm';
import { SettingsForm } from '../components/projectEdit/settingsForm';
import { ActionsForm } from '../components/projectEdit/actionsForm';
import { CustomEditorForm } from '../components/projectEdit/customEditorForm';
import { Button } from '../components/button';
import { Dropdown } from '../components/dropdown';
import { Alert } from '../components/alert';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../network/genericJSONRequest';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { useFetch } from '../hooks/UseFetch';
import { useAsync } from '../hooks/UseAsync';
import { useEditProjectAllowed } from '../hooks/UsePermissions';

export const StateContext = React.createContext();

export const styleClasses = {
  divClass: 'w-70-l w-100 pb4 mb3',
  labelClass: 'f4 fw6 db mb3',
  pClass: 'db mb3 f5',
  inputClass: 'w-80 pa2 db mb2',
  numRows: '4',
  buttonClass: 'bg-blue-dark dib white',
  modalTitleClass: 'f3 pb3 mv0 bb',
  drawButtonClass: 'bg-blue-dark white mr2',
  redButtonClass: 'bg-red white',
  whiteButtonClass: 'bg-white blue-dark mr2',
  modalClass: 'pa4',
  actionClass: 'bg-blue-dark white dib mr2 mt2 pointer',
};

export const handleCheckButton = (event, arrayElement) => {
  if (event.target.checked === true) {
    arrayElement.push(event.target.value);
  } else {
    arrayElement = arrayElement.filter((t) => t !== event.target.value);
  }

  return arrayElement;
};

export default function ProjectEdit({ id }) {
  useSetTitleTag(`Edit project #${id}`);
  const [errorLanguages, loadingLanguages, languages] = useFetch('system/languages/');
  const mandatoryFields = ['name', 'shortDescription', 'description', 'instructions'];
  const token = useSelector((state) => state.auth.get('token'));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [option, setOption] = useState('description');
  const [projectInfo, setProjectInfo] = useState({
    mappingTypes: [],
    mappingEditors: [],
    validationEditors: [],
    organisation: '',
    teams: [],
    projectInfoLocales: [
      {
        locale: '',
        name: '',
        shortDescription: '',
        description: '',
        instructions: '',
        perTaskInstructions: '',
      },
    ],
  });
  const [userCanEditProject] = useEditProjectAllowed(projectInfo);
  const supportedLanguages =
    !errorLanguages && !loadingLanguages ? languages.supportedLanguages : [];

  useLayoutEffect(() => {
    setSuccess(false);
    setError(null);
  }, [projectInfo, option]);

  useLayoutEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchLocalJSONAPI(`projects/${id}/`, token, 'GET');
        setProjectInfo(res);
      } catch (e) {}
    }
    fetchData();
  }, [id, token]);

  const saveChanges = (resolve, reject) => {
    // Remove locales with less than 3 fields.
    const locales = projectInfo.projectInfoLocales;
    // Get data for default locale.
    const filtered = locales
      .filter((l) => l.locale === projectInfo.defaultLocale)
      .map((l) => {
        return {
          locale: l.locale,
          fields: mandatoryFields.filter(
            (m) => Object.keys(l).includes(m) === false || l[m] === '',
          ),
        };
      })
      .filter((l) => l.fields.length > 0);

    const nonLocaleMissingFields = { locale: null, fields: [] };

    if (projectInfo.mappingTypes.length === 0) {
      nonLocaleMissingFields.fields = [...nonLocaleMissingFields.fields, 'mappingTypes'];
    }

    if (!projectInfo.organisation) {
      nonLocaleMissingFields.fields = [...nonLocaleMissingFields.fields, 'organisation'];
    }

    if (nonLocaleMissingFields.fields.length > 0) {
      filtered.push(nonLocaleMissingFields);
    }

    if (filtered.length > 0) {
      setError(filtered);
      return new Promise((resolve, reject) => reject());
    } else {
      return pushToLocalJSONAPI(`projects/${id}/`, JSON.stringify(projectInfo), token, 'PATCH')
        .then((res) => {
          setSuccess(true);
          setError(null);
        })
        .catch((e) => setError('SERVER'));
    }
  };
  const saveChangesAsync = useAsync(saveChanges);

  if (!token) {
    return <Redirect to={'/login'} noThrow />;
  }

  if (projectInfo.projectId && !userCanEditProject) {
    return (
      <div className="cf w-100 pv5">
        <div className="tc">
          <h3 className="f3 fw8 mb4 barlow-condensed">
            <FormattedMessage {...messages.projectEditNotAllowed} />
          </h3>
        </div>
      </div>
    );
  }

  const renderList = () => {
    const checkSelected = (optionSelected) => {
      let liClass = 'w-90 link barlow-condensed f4 fw5 pv3 pl2 pointer';
      if (option === optionSelected) {
        liClass = liClass.concat(' fw6 bg-grey-light');
      }
      return liClass;
    };

    const elements = [
      { value: 'description', required: true },
      { value: 'instructions', required: true },
      { value: 'metadata', required: true },
      { value: 'priority_areas' },
      { value: 'imagery' },
      { value: 'permissions' },
      { value: 'settings' },
      { value: 'actions' },
      { value: 'custom_editor' },
    ];

    return (
      <div>
        <ul className="list pl0 mt0 ttu">
          {elements.map((elm, n) => (
            <li key={n} className={checkSelected(elm.value)} onClick={() => setOption(elm.value)}>
              <FormattedMessage {...messages[`projectEditSection_${elm.value}`]} />
              {elm.required && ' *'}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderForm = (option) => {
    switch (option) {
      case 'description':
        return <DescriptionForm languages={supportedLanguages} />;
      case 'instructions':
        return <InstructionsForm languages={supportedLanguages} />;
      case 'metadata':
        return <MetadataForm />;
      case 'imagery':
        return <ImageryForm />;
      case 'permissions':
        return <PermissionsForm />;
      case 'settings':
        return (
          <SettingsForm languages={supportedLanguages} defaultLocale={projectInfo.defaultLocale} />
        );
      case 'priority_areas':
        return <PriorityAreasForm />;
      case 'actions':
        return (
          <ActionsForm
            projectId={projectInfo.projectId}
            projectName={projectInfo.projectInfo.name}
          />
        );
      case 'custom_editor':
        return (
          <CustomEditorForm
            languages={supportedLanguages}
            defaultLocale={projectInfo.defaultLocale}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="cf pv3 blue-dark">
      <h2 className="pb2 f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
        <FormattedMessage {...messages.editProject} />
      </h2>
      <div className="fl w-30-l w-100 ph0-ns ph4-m ph2">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={8}
          ready={projectInfo && projectInfo.projectInfo}
          className="pr3"
        >
          {renderList()}
          <Button
            onClick={() => saveChangesAsync.execute()}
            className="db bg-red white pa3 bn"
            loading={saveChangesAsync.status === 'pending'}
          >
            <FormattedMessage {...messages.save} />
          </Button>
          <div style={{ minHeight: '3rem' }}>
            {(error || success) && <SaveStatus error={error} success={success} />}
          </div>
          <span className="db">
            <Dropdown
              onAdd={() => {}}
              onRemove={() => {}}
              value={null}
              options={[
                {
                  label: <FormattedMessage {...messages.projectPage} />,
                  href: `/projects/${projectInfo.projectId}/`,
                  internalLink: true,
                },
                {
                  label: <FormattedMessage {...messages.tasksPage} />,
                  href: `/projects/${projectInfo.projectId}/tasks/`,
                  internalLink: true,
                },
                {
                  label: <FormattedMessage {...messages.projectStats} />,
                  href: `/projects/${projectInfo.projectId}/stats/`,
                  internalLink: true,
                },
              ]}
              display={<FormattedMessage {...messages.accessProject} />}
              className={'ba b--grey-light bg-white mr1 f5 v-mid pv2 ph3'}
            />
          </span>
        </ReactPlaceholder>
      </div>
      <ReactPlaceholder
        showLoadingAnimation={true}
        type={'media'}
        rows={26}
        delay={200}
        ready={projectInfo && projectInfo.projectInfo}
      >
        <StateContext.Provider
          value={{
            projectInfo: projectInfo,
            setProjectInfo: setProjectInfo,
            success: success,
            setSuccess: setSuccess,
            error: error,
            setError: setError,
          }}
        >
          <div className="fl w-70-l w-100 ph0-l ph4-m ph2">{renderForm(option)}</div>
        </StateContext.Provider>
      </ReactPlaceholder>
    </div>
  );
}

const ErrorTitle = ({ locale, numberOfMissingFields }) => {
  if (locale === null) {
    return (
      <FormattedMessage {...messages.missingFields} values={{ number: numberOfMissingFields }} />
    );
  }

  return <FormattedMessage {...messages.missingFieldsForLocale} values={{ locale: locale }} />;
};

const ErrorMessage = ({ errors }) => {
  return (
    <>
      <span className="fw6">
        <FormattedMessage {...messages.saveProjectError} />
      </span>
      {errors.map((error, i) => {
        return (
          <div className="cf w-100 pt2 ml3 pl2" key={i}>
            <span>
              <ErrorTitle locale={error.locale} numberOfMissingFields={error.fields.length || 0} />
            </span>
            <ul className="mt2 mb0">
              {error.fields.map((f, i) => {
                return (
                  <li key={i}>
                    {<FormattedMessage {...projectEditMessages[f]} />}
                    {i === error.fields.length - 1 ? '' : ','}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </>
  );
};

const SaveStatus = ({ error, success }) => {
  let message = null;
  if (success === true) {
    message = <FormattedMessage {...messages.updateSuccess} />;
  }
  if (error !== null && error !== 'SERVER') {
    message = <ErrorMessage errors={error} />;
  }
  if (error !== null && error === 'SERVER') {
    message = <FormattedMessage {...messages.serverError} />;
  }

  return (
    <div className="pv3 pr3">
      <Alert type={success ? 'success' : 'error'}>{message}</Alert>
    </div>
  );
};
