<%def  name="instance_name()">
  OSM Tasking Manager
</%def>

<%def  name="about_tasking_manager_intro()">
    <p>
    ${_('OSM Tasking Manager is a mapping tool designed and built for the Humanitarian OSM Team collaborative mapping. The purpose of the tool is to divide up a mapping job into smaller tasks that can be completed rapidly. It shows which areas need to be mapped and which areas need the mapping validated.')}
    </p>
    <p>
    ${_('This approach facilitates the distribution of tasks to the various mappers in a context of emergency. It also permits control of the progress and the homogeneity of the work done (e.g. elements to cover, specific tags to use, etc.).')}
    </p>
</%def>


<%def  name="main_page_right_panel()">
    <h3>${_('About the Tasking Manager')}</h3>
    ${about_tasking_manager_intro()}
    <hr />
    <h4>${_('New to Mapping?')}</h4>
    <p>
    ${_('Just jump over to <a target="_blank" href="http://www.openstreetmap.org">OpenStreetMap</a>, create an account, and then visit the LearnOSM tutorials on the <a target="_blank" href="http://learnosm.org/en/coordination/tasking-manager/">Tasking Manager</a> and the <a target="_blank" href="http://learnosm.org/en/beginner/id-editor">iD editor</a>. Alternatively check out the <a target="_blank" href="http://mapgive.state.gov">MapGive website</a> which also provides information on the Tasking Manager and mapping. Once you have read up on how to map, come back here to help map for people on the ground!')|n}
    </p>
    <hr>
    <h4>${_('Questions About Tasks, Mapping or HOT?')}</h4>
    <p>
    ${_('If you have any questions about a project, a task or mapping in general please ask on our mailing list: <a href="https://lists.openstreetmap.org/listinfo/hot">HOT E-Mail List</a>.')|n}
    </p>
    <p>
    ${_('Or visit us in our IRC Chat Channel, just select #hot from the pop down channel list: <a href="http://irc.openstreetmap.org/">OSM HOT IRC Channel #hot</a>.')|n}
    </p>
    <p>
    ${_('General inquries and comments are welcomed at: <a href="mailto:info@hotosm.org" target="_top">info@hotosm.org</a>.')|n}
    </p>
</%def>

<%def  name="footer_contact_text()">
  ${_('Email HOT at')} <a href='mailto:info@hotosm.org'>info@hotosm.org</a><br />
  ${_('Follow HOT on')} <a href='http://www.twitter.com/hotosm'>Twitter</a><br />
  ${_('Like HOT on')} <a href='http://facebook.com/hotosm'>Facebook</a>
</%def>

<%def name="analytics()">
  <!--
  put here any code to track usage
  piwik or google analytics code
  -->
</%def>

<%def name="before_content()">
  <style>
    /* The ribbons */
    .corner-ribbon {
      z-index: 1031;
      width: 210px;
      background: #e43;
      position: absolute;
      top: 30px;
      left: -50px;
      text-align: center;
      line-height: 40px;
      letter-spacing: 1px;
      transform: rotate(-45deg);
      -webkit-transform: rotate(-45deg);
      cursor: default;
      -moz-user-select: none;
      -webkit-user-select: none;
      -ms-user-select: none;
      background: #e82;
      box-shadow: 0 0 3px rgba(0,0,0,.3);
      position: fixed;
    }
    .corner-ribbon a {
      color: #f0f0f0;
    }

    #donate-banner {
      position: fixed;
      top: 80px;
      z-index: 10000;
      left: 0px;
      right: 0px;
      display:none;
    }
    #donate-banner > div {
      padding: 5px 10px;
      border-radius: 5px;
      background-image: radial-gradient(circle at 100% 0% , transparent 0%, transparent 18px, #e82 18px, #e82 100%);
      color: #f0f0f0;
      box-shadow: 0 0 3px rgba(0,0,0,.3);
    }
    #donate-banner > div > p {
      display: inline-block;
      width: 80%;
      margin: 0px;
      text-align:justify;
    }
    #donate-banner .donate {
      display: inline-block;
      width: 15%;
      position: relative;
      margin: 10px 17px;
    }
    #donate-banner .close_ {
      cursor: pointer;
      display: block;
      position: absolute;
      text-decoration: none;
      border-radius: 50%;
      background-color: #e82;
      color: rgb(0, 0, 0);
      font-size: 18px;
      line-height: 15px;
      top: -12px;
      padding: 5px 3.5px;
      text-indent: 0.5px;
      right: -12.5px;
      box-shadow: 0 0 3px rgba(0,0,0,.3);
    }
  </style>
  <div class="corner-ribbon top-left sticky orange shadow ">
    <a href="https://donate.hotosm.org" target="_blank">${_('Please donate!')}</a>
  </div>
</%def>
