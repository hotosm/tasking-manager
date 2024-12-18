import { useLocation } from 'react-router-dom';
import { useFetchWithAbort } from '../../hooks/UseFetch';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import './styles.scss';
import { useEffect, useState } from 'react';

export function TopBanner() {
  const location = useLocation();
  const [, error, data] = useFetchWithAbort(`system/banner/`);
  const [dangerousInner, setDangerousInner] = useState<null | string | TrustedHTML>(null);

  useEffect(() => {
    // TODO: Spotted this - is this meant to be ran? The IIFE is never called at the end.
    async () => {
      // @ts-expect-error
      setDangerousInner((await htmlFromMarkdown(data?.message)).__html);
    };
  }, [data]);

  return (
    <>
      {/* @ts-expect-error TS Migrations */}
      {location.pathname === '/' && data.visible && !error && (
        <div className="ph3 b--grey-light bb bg-tan top-banner-container">
          <div
            className="fw6 flex justify-center"
            dangerouslySetInnerHTML={{
              __html: dangerousInner ?? '',
            }}
          />
        </div>
      )}
    </>
  );
}
