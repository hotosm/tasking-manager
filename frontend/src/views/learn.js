import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { TopBar } from '../components/header/topBar';

export function LearnPage() {
  const [activeSection, setActiveSection] = useState('mapping');
  return <div className="pt180 pull-center">
    <TopBar pageName={<FormattedMessage {...messages.learn} />} />
    <div className="pl6-l ph4 mr4-l pt4 f5 w-60-l">
      <div className="cf ttu barlow-condensed f3 pv2 blue-dark">
        <span
          className={`mr4 pb2 pointer ${activeSection === 'mapping' && 'bb b--blue-dark'}`}
          onClick={() => setActiveSection('mapping')}
        >
          <FormattedMessage {...messages.howToMap} />
        </span>
        <span
          className={`mr4 pb2 pointer ${activeSection === 'validation' &&
            'bb b--blue-dark'}`}
          onClick={() => setActiveSection('validation')}
        >
          <FormattedMessage {...messages.howToValidate} />
        </span>
      </div>
      <div className="pt3">
        {activeSection === 'mapping' && <MappingInstructions />}
        {activeSection === 'validation' && <ValidationInstructions />}
      </div>
    </div>
  </div>;
}


function MappingInstructions() {
  return (
    <>
      <p className="avenir b f4 tracked mt0"><a className="link red fw5" href="https://openstreetmap.org">OpenStreetMap</a> is a collaborative, crowd sourced, free map of the world. Anyone can contribute to OpenStreetMap to map any part of the world that interests them.</p>
      <p className="helvetica f4 normal tracked mt0">The <span className="b">Tasking Manager</span> is a tool that coordinates many people mapping a specific geographic area in OpenStreetMap.</p>
      <p className="helvetica i normal tracked mt0"><i>Do you have an <a className="link red fw5" href="https://openstreetmap.org">OpenStreetMap</a> account already? You can start over with step 4.</i></p>
      <p className="athelas f4 tracked mt0">1) Click on the sign-up button in the upper right corner of the Tasking Manager homepage
      <p>2) Provide your email address. We will use it to send you further information during the sign-up process.</p>
        <p>3) You will be redirected to OpenStreetMap.org. Select Register Now and fill out the sign-up form.</p>
        <p>4) Go to the Tasking Manager homepage and click on the login button in the upper right corner.</p>
        <p>5) Choose one of the recommended projects on the welcome page or click on “Explore” in the main navigation to find a mapping project to work on, and select one of your interest.</p>
        <p>5) Choose one of the recommended projects on the welcome page or click on “Explore” in the main navigation to find a mapping project to work on, and select one of your interest.</p>
        <p>6) Read the instructions for the project</p>
        <p>7) Map a randomly selected task for mapping by clicking on the button “Map a task”.
      <i>Alternatively you can also select one from the list or map and choose “Map selected task”.</i></p>
        <p>8) You will be switched to an OpenStreetMap editor; map all the features asked for in the instructions.</p>
        <i>In case you need assistance on mapping, check the documentation on learnOSM.org.</i>
        <p>9) When finished mapping, save your edits and select the button “Submit task”.</p>
        <p><i>After this, you can go back to step 7 and select a new task for mapping. Thank you for your contribution to OpenStreetMap.</i></p>
      </p>

    </>
  );
}

function ValidationInstructions() {
  return (
    <>
      <p>Instructions on how to validate</p>
    </>
  );
}
