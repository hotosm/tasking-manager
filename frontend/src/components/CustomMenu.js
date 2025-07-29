export function CustomMenu({ items, activeMenuItem, onItemClick }: Object) {
  const linkCombo = 'link mh2 blue-dark ttc pointer hover-black';
  const isActive = (itemId) => itemId === activeMenuItem;

  return (
    <div className="cf mb2 pb3 pt3-ns ph2-m dib flex bg-grey-light">
      {items.map((item) => (
        <div
          key={item.id}
          className={isActive(item.id) ? `${linkCombo} bb b--blue-dark bw1 pb1` : linkCombo}
          onClick={() => onItemClick(item.id)}
        >
          <span className="db dib-ns">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
