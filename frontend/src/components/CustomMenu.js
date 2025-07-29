export function CustomMenu({ items, activeMenuItem, onItemClick }: Object) {
  const linkCombo = 'link mh2 blue-dark ttc pointer hover-black bw0 bg-transparent';
  const isActive = (itemId) => itemId === activeMenuItem;

  return (
    <div className="cf mb2 pb3 pt3-ns ph2-m dib flex bg-grey-light">
      {items.map((item) => (
        <button
          key={item.id}
          className={
            isActive(item.id) ? `${linkCombo} bw1 br-0 bl-0 bt-0 b--blue-dark pb1` : linkCombo
          }
          onClick={() => onItemClick(item.id)}
        >
          <span className="db dib-ns">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
