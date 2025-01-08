import { TextBlock, RoundShape } from 'react-placeholder/lib/placeholders';

export const projectCardPlaceholderTemplate = () => (_, i) =>
  (
    <div
      className={`ph3 ba br1 b--grey-light bg-white shadow-hover h-100 flex flex-column justify-between project-card`}
      key={i}
    >
      <div className="">
        <div className="flex justify-between items-center mb4">
          <RoundShape
            className="show-loading-animation"
            color="#DDD"
            style={{ width: 50, height: 50 }}
          />
          <TextBlock
            rows={1}
            className="show-loading-animation"
            color="#CCC"
            style={{ width: 60 }}
          />
        </div>
        <TextBlock rows={3} className="show-loading-animation mb4" color="#CCC" />
        <TextBlock
          rows={2}
          className="show-loading-animation"
          color="#CCC"
          style={{ height: 35 }}
        />
      </div>
      <TextBlock rows={2} className="show-loading-animation mb4" color="#CCC" />
    </div>
  );

export const nCardPlaceholders = (N) => {
  return [...Array(N).keys()].map(projectCardPlaceholderTemplate());
};
