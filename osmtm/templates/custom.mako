<%def  name="instance_name()">
  OSM Tasking Manager
</%def>

<%def  name="main_page_new_to_mapping_info()">
  <h4>${_('New to Mapping?')}</h4>
  ${_('Just jump over to <a target="_blank" href="http//www.openstreetmap.org">OpenStreetMap</a>, create an account, and then visit <a target="_blank" href="http://learnosm.org/en/beginner/id-editor">this tutorial</a>. Then come back here to help map for people on the ground!')|n}
</%def>

<%def  name="main_page_community_info()">
  <h4>${_('Questions About Tasks, Mapping or HOT?')}</h4>
  ${_('If you have any questions about a project, a task or mapping in general please ask on our mailing list: <a href="https://lists.openstreetmap.org/listinfo/hot">HOT E-Mail List</a><br /><br />Or visit us in our IRC Chat Channel, just select #hot from the pop down channel list:<br /><a href="http://irc.openstreetmap.org/">OSM HOT IRC Channel #hot</a><br /><br />General inquries and comments are welcomed at: <a href="mailto:info@hotosm.org" target="_top">info@hotosm.org</a>')|n}
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

  <div id="donate-banner" class="container">
    <div class="col-md-12">
      <p>
      ${_("Each day, nearly 1000 people use the Tasking Manager, one of several mapping tools supported by the Humanitarian OpenStreetMap Team (HOT). HOT is a nonprofit organization that relies entirely on grants and donations from people like you. We need your help today to meet our goal of raising $50,000 by December 31 so we can all keep mapping. We're counting on your support - donate now and #mapthedifference!")}
      </p>
      <a class="btn btn-success pull-right donate" href="https://donate.hotosm.org" target="_blank">Donate Now</a>
      <span onclick="$('#donate-banner').fadeOut(500);sessionStorage.setItem('donate_dismissed', true);" class="glyphicon glyphicon-remove close_"></span>
    </div>
  </div>

  <script type="text/javascript">
    $(document).ready(function () {
      var donate_dismissed = sessionStorage.getItem('donate_dismissed');
      if (donate_dismissed) {
        $('#donate-banner').css('display', 'none');
      } else {
        $('#donate-banner').fadeIn(500);
      }
  });
  </script>
</%def>
