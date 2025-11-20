import { TextRow, RectShape } from 'react-placeholder/lib/placeholders';

export const BudgetCardPlaceholderTemplate = () => (_n, i) =>
  (
    <div className="w-25-ns w-100 fl pr3 pb4" key={i}>
      <div className="cf bg-white blue-dark b--grey-light shadow-hover flex ph2 pv2">
        <RectShape
          className="show-loading-animation"
          color="#CCC"
          style={{ height: '60px', width: '60px' }}
        />
        <div className="flex flex-column w-100">
          <TextRow
            className="show-loading-animation"
            color="#CCC"
            style={{ height: '30px', width: '50%', marginTop: '0px' }}
          />
          <TextRow
            className="show-loading-animation"
            color="#CCC"
            style={{ height: '15px', width: '80%' }}
          />
        </div>
      </div>
    </div>
  );

export const nCardPlaceholders = (N) => {
  return [...Array(N).keys()].map(BudgetCardPlaceholderTemplate());
};
