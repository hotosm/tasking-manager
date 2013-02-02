<!DOCTYPE html>
<html lang="fr">
    <head>
        <title>OSM Tasking Manager - ${self.title()}</title>
        <meta http-equiv="Content-Type" content="text/html;charset=UTF-8"/>
        <link rel="stylesheet" type="text/css" href="${request.static_url('osmtm:static/css/main.css')}" />
        <script type="text/javascript" src="${request.static_url('osmtm:static/js/lib/jquery-1.7.2.min.js')}"></script>
        <script type="text/javascript" src="${request.static_url('osmtm:static/js/lib/showdown.js')}"></script>
    </head>
    <body id="${self.id()}">
        <!-- Topbar
        ================================================== -->
        <div class="navbar navbar-fixed-top" >
            <div class="navbar-inner">
                <div class="container">
                    <a class="brand" href="${request.route_url('home')}">OSM Tasking Manager</a>
                    <ul class="nav">
                    </ul>
                </div>
            </div>
        </div>
        ${self.body()}
        <footer class="footer">
            <div class="container">
                <p class="span6">
                Designed and built for the 
                <a href="http://hot.openstreetmap.org">Humanitarian OpenStreetMap Team</a> 
                with initial sponsorship from the Australia-Indonesia Facility for Disaster Reduction.
                <p class="pull-right">
                Fork the code on <a href="http://github.com/hotosm/osm-tasking-manager">github</a>.</p>
            </div>
        </footer>
    </body>
</html>
