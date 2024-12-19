import { useLocation } from 'react-router-dom';
import { useFetchWithAbort } from '../../hooks/UseFetch';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import './styles.scss';

export function TopBanner() {
  const location = useLocation();
  const [, error, data] = useFetchWithAbort<{
    message: string;
  }>(`system/banner/`);

  return (
    <>
      {/* @ts-expect-error TS Migrations */}
      {location.pathname === '/' && data?.visible && !error && (
        <div className="ph3 b--grey-light bb bg-tan top-banner-container">
          <div
            className="fw6 flex justify-center"
            dangerouslySetInnerHTML={{
              __html: htmlFromMarkdown(data.message),
            }}
          />
        </div>
      )}
    </>
  );
}