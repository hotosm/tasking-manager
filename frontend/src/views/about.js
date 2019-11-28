import React from 'react';

export function AboutPage() {
  return <div className="pt180 pull-center">
    The Tasking Manager is a mapping tool designed and built for the coordination of volunteers and the organization of groups for collaborative mapping in OpenStreetMap.

    <blockquote><a href="https://openstreetmap.org">OpenStreetMap</a> is the community-driven free and editable map of the world, supported by the not-for-profit OpenStreetMap Foundation. Read more on the OSM Wiki or join the discussion with your local OSM community.</blockquote>

    <h3>How does it work?</h3>
    <p>The Tasking Manager allows to divide up a mapping project into smaller tasks that can be completed rapidly with many people working on the same overall area. It shows which areas need to be mapped and which areas need to be reviewed for quality assurance.</p>
    <p>This approach allows the distribution of tasks to many individual mappers in the context of emergency or other humanitarian mapping scenario. It also allows monitoring of the overall project progress and helps improve the consistency of the mapping (e.g., elements to cover, specific tags to use, etc.).</p>

    <h3>Free and Open Source Software</h3>

    <p>The Tasking Manager is Free and Open Source software. Please feel free to report issues and contribute. The <a href="https://github.com/hotosm/tasking-manager">application’s code is available</a> for you.</p>

  </div>;
}
