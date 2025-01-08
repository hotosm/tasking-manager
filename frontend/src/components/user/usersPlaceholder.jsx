import { TextRow, RoundShape } from 'react-placeholder/lib/placeholders';

export const userCardPlaceholderTemplate = () => (_n, i) =>
  (
    <div
      key={i}
      className={`bg-white cf flex items-center pa3 ba mb1 b--grey-light blue-dark shadow-hover`}
    >
      <div className="w-50-ns w-100 fl flex items-center">
        <RoundShape
          className="show-loading-animation dib mt1"
          style={{ width: 32, height: 32 }}
          color="#DDD"
        />
        <TextRow
          className="show-loading-animation blue-grey mr2 ml3 dib"
          color="#CCC"
          style={{ width: '45%', marginTop: 0 }}
        />
      </div>
      <div className="w-20 fl dib-ns dn tc">
        <TextRow
          className="show-loading-animation blue-grey mr2 ml3"
          color="#CCC"
          style={{ width: '45%', marginTop: 0 }}
        />
      </div>
      <div className="w-20 fl dib-ns dn tc">
        <TextRow
          className="show-loading-animation blue-grey mr2 ml3"
          color="#CCC"
          style={{ width: '45%', marginTop: 0 }}
        />
      </div>
    </div>
  );

export const nCardPlaceholders = (N) => {
  return [...Array(N).keys()].map(userCardPlaceholderTemplate());
};
