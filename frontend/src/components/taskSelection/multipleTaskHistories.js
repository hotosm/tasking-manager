import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from 'react-accessible-accordion';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { TaskHistory } from './taskActivity';

export const MultipleTaskHistoriesAccordion = ({ tasks, projectId }) => {
  return (
    <Accordion className="bn" allowMultipleExpanded allowZeroExpanded>
      {tasks
        .sort((n1, n2) => n1.taskId - n2.taskId)
        .map((t) => (
          <AccordionItem className="bb b--light-gray" key={t.taskId} uuid={t.taskId}>
            <AccordionItemHeading className="b ttu tracked">
              <AccordionItemButton className="bg-white blue-grey pointer pa3 w-100 tl bn accordion_button">
                <FormattedMessage {...messages.taskActivity} values={{ n: t.taskId }} />
              </AccordionItemButton>
            </AccordionItemHeading>
            <AccordionItemPanel className="ph2 pb2 accordion_panel">
              <TaskHistory projectId={projectId} taskId={t.taskId} />
            </AccordionItemPanel>
          </AccordionItem>
        ))}
    </Accordion>
  );
};
