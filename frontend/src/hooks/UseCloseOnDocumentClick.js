// https://github.com/yjose/reactjs-popup/issues/174
import { useEffect, useState } from 'react';

/**
 * This hook is a workaround for an issue in reactjs-popup
 *
 * What this hook does is:
 *
 * - on mouse down inside the popup, set closeOnDocumentClick to false
 * - on mouse up, set closeOnDocumentClick to true
 *
 * Usage:
 *
 *    const closeOnDocumentClick = useCloseOnDocumentClick()
 *
 *    return (
 *      <Popup ... closeOnDocumentClick={closeOnDocumentClick} >
 *        ...
 *      </Popup>
 *    )
 */
export default function useCloseOnDocumentClick() {
  const [closeOnDocumentClick, setCloseOnDocumentClick] = useState(true);

  useEffect(() => {
    function insidePopupContents(target: any): boolean {
      return target.querySelector('.popup-content') == null;
    }

    function handleMouseDown(event: MouseEvent) {
      if (insidePopupContents(event.target)) {
        setCloseOnDocumentClick(false);
      }
    }

    function handleMouseUp() {
      setTimeout(() => setCloseOnDocumentClick(true));
    }

    window.document.addEventListener('mousedown', handleMouseDown);
    window.document.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.document.removeEventListener('mousedown', handleMouseDown);
      window.document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setCloseOnDocumentClick]);

  return closeOnDocumentClick;
}
