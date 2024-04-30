import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { CustomButton } from '../button';

export function EditModeControl({ editMode, switchModeFn }: Object) {
  if (!editMode) {
    return (
      <CustomButton
        className="pv2 ph3 ba b--red white bg-red fr mv1"
        onClick={() => switchModeFn(!editMode)}
      >
        <FormattedMessage {...messages.edit} />
      </CustomButton>
    );
  } else {
    return <></>;
  }
}
