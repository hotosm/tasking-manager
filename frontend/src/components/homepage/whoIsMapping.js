import messages from './messages';
import { OverlayListDisplay } from '../common/overlayListDisplay.js';
import {
  TheWorldBankIcon,
  AmericanRedCrossIcon,
  UsAidIcon,
  BritishRedCrossIcon,
  MsfIcon,
  BingIcon,
} from '../svgIcons/organisations';

const organizations = [
  {
    url: 'https://www.redcross.org/',
    name: 'American Red Cross',
    Icon: AmericanRedCrossIcon,
  },
  {
    url: 'https://www.redcross.org.uk/',
    name: 'British Red Cross',
    Icon: BritishRedCrossIcon,
  },
  {
    url: 'https://www.msf.org/',
    name: 'Medecins Sans Frontieres',
    Icon: MsfIcon,
  },
  { url: 'https://www.worldbank.org/', name: 'World Bank', Icon: TheWorldBankIcon },
  { url: 'https://www.usaid.gov/', name: 'USAID', Icon: UsAidIcon },
  { url: 'https://www.bing.com/', name: 'Bing', Icon: BingIcon },
];

export function WhoIsMapping() {
  return (
    <OverlayListDisplay
      variant="dark"
      title={messages.whoIsMappingTitle}
      description={messages.whoIsMappingHeadline}
      organizations={organizations}
      contactTitle={messages.organizationContactTitle}
    />
  );
}
