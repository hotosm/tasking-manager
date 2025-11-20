import { TextRow, RectShape } from 'react-placeholder/lib/placeholders';

export const LevelCardPlaceholderTemplate = () => (_n, i) =>
  (
    <div className="w-100-ns w-100 fl pr3 pb3" key={i}>
      <div className="cf bg-white blue-dark b--grey-light shadow-hover flex ph2 pv2">
        <RectShape
          className="show-loading-animation"
          color="#CCC"
          style={{ height: '35px', width: '20px' }}
        />
        <div className="flex flex-column w-100 justify-center">
          <TextRow
            className="show-loading-animation"
            color="#CCC"
            style={{ height: '35px', width: '100%', marginTop: '0px' }}
          />
        </div>
      </div>
    </div>
  );

export const nCardPlaceholders = (N) => {
  return [...Array(N).keys()].map(LevelCardPlaceholderTemplate());
};
