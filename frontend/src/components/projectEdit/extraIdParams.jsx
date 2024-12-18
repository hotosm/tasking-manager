import { styleClasses } from '../../views/projectEdit';

export const ExtraIdParams = ({ value, setProjectInfo }) => {
  const onInputChange = (e) => {
    setProjectInfo((p) => ({ ...p, extraIdParams: e.target.value }));
  };

  return (
    <input
      className={styleClasses.inputClass}
      onChange={onInputChange}
      type="text"
      name={`extraIdParams`}
      placeholder="disabled_features=buildings&offset=-10,5"
      value={value}
    />
  );
};
