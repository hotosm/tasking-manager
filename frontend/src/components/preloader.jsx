import { LoadingIcon } from './svgIcons';

export function Preloader() {
  return (
    <div className="fixed vh-100 w-100 flex justify-center items-center bg-white">
      <LoadingIcon className="red h3 w3" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );
}
