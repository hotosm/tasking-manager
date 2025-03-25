import { TextBlock, RoundShape } from 'react-placeholder/lib/placeholders';

function NotificationPlaceholder() {
  return (
    <div>
      {[...Array(2)].map((_, i) => (
        <article
          key={i}
          className="db base-font w-100 mb2 mw8 bg-white blue-dark br1 shadow-1 pl3 pv2 pr4 pv3"
        >
          <div className="flex">
            <RoundShape
              className="show-loading-animation"
              color="#DDD"
              style={{ height: '32px', width: '32px' }}
            />
            <TextBlock className="show-loading-animation h2 pl3" color="#DDD" rows={2} />
          </div>
        </article>
      ))}
    </div>
  );
}

export default NotificationPlaceholder;
