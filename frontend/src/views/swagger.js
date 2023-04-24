import { API_URL } from '../config';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export function SwaggerView() {
  useSetTitleTag('API Docs');
  return (
    <div className="w-100 cf">
      <iframe
        className="fixed w-100 bn vh-minus-122 vh-minus-122-ns"
        title="api-docs"
        src={`https://hotosm.github.io/swagger/?url=${API_URL}system/docs/json/`}
      />
    </div>
  );
}
