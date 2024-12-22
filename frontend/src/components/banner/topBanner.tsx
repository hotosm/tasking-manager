import { useLocation } from 'react-router-dom';
import { useFetchWithAbort } from '../../hooks/UseFetch';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import './styles.scss';
import { useEffect, useState } from 'react';

export function TopBanner() {
  const location = useLocation();
  const [, error, data] = useFetchWithAbort<{
    message: string;
  }>(`system/banner/`);
  const [safeHTML, setSafeHTML] = useState<string>();

  useEffect(() => {
    (async () => {
      if (data?.message) {
        const html = await htmlFromMarkdown(data.message);
        setSafeHTML(html.__html);
      }
    })();
  }, [data?.message])

  return (
    <>
      {/* @ts-expect-error TS Migrations */}
      {location.pathname === '/' && data?.visible && !error && (
        <div className="ph3 b--grey-light bb bg-tan top-banner-container">
          <div
            className="fw6 flex justify-center"
            dangerouslySetInnerHTML={{
              __html: safeHTML,
            }}
          />
        </div>
      )}
    </>
  );
}
