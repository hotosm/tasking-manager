import { useLocation } from 'react-router-dom';
import { useFetchWithAbort } from '../../hooks/UseFetch';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import './styles.scss';

export function TopBanner() {
  const location = useLocation();
  const [, error, data] = useFetchWithAbort(`system/banner/`);

  return (
    <>
      {location.pathname === '/' && data.visible && !error && (
        <div className="ph3 b--grey-light bb bg-tan top-banner-container">
          <div
            className="fw6 flex justify-center"
            dangerouslySetInnerHTML={htmlFromMarkdown(data.message)}
          />
        </div>
      )}
    </>
  );
}
