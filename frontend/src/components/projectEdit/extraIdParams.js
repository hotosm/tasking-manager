import { styleClasses } from '../../views/projectEdit';

export const ExtraIdParams = ({ id, value, setProjectInfo }) => {
  const onInputChange = (e) => {
    setProjectInfo((p) => ({ ...p, extraIdParams: e.target.value }));
  };

  return (
    <input
      id={id}
      className={styleClasses.inputClass}
      onChange={onInputChange}
      type="text"
      name={`extraIdParams`}
      placeholder="disabled_features=buildings&offset=-10,5"
      value={value}
    />
  );
};
