import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { useProjectQuery } from '../api/projects';
import { useAvailableCountriesQuery } from '../api/projects';

/**
 * A React custom hook that checks if a project can view live monitoring feature
 *
 * Returns null if the status is unknown, else returns boolean
 *
 */
export default function useHasLiveMonitoringFeature() {
  const { id: projectId } = useParams();
  const userDetails = useSelector((state) => state.auth.userDetails);
  const [hasLiveMonitoringFeature, setHasLiveMonitoringFeature] = useState(null);

  const { data: project } = useProjectQuery(projectId);
  const { data: availableCountries } = useAvailableCountriesQuery();

  useEffect(() => {
    if (!availableCountries || !project || !userDetails) return;

    // set hasLiveMonitoringFeature to false if project is not published
    // or expert mode is not enabled
    if (project.data.status !== 'PUBLISHED' || !userDetails.isExpert) {
      setHasLiveMonitoringFeature(false);
      return;
    }

    // check if the project has live monitoring feature enabled
    // based on the country list provided by available.json
    const isLiveMonitoringAvailableInCountry = project.data.countryTag.some((country) =>
      availableCountries.countries.some((item) => country.toLowerCase() === item.toLowerCase()),
    );

    setHasLiveMonitoringFeature(isLiveMonitoringAvailableInCountry);
  }, [availableCountries, project, userDetails]);

  return hasLiveMonitoringFeature;
}
