import { useSetTitleTag } from '../hooks/UseMetaTags';
import { useFetch } from '../hooks/UseFetch';
import { BadgesManagement } from '../components/badges';

export const ListBadges = () => {
  useSetTitleTag('Manage Badges');

  const [error, loading, result] = useFetch('mapping_badges/');
  const isFetched = !loading && !error;

  return (
    <BadgesManagement
      badges={result.badges}
      isFetched={isFetched}
    />
  );
};
