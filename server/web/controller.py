from flask import send_from_directory, render_template, current_app
from . import main


@main.route('/assets/<path:path>')
def assets(path):
    """
    Route for returning any files contained in the assets dir
    :param path: Path to the file the browser is requesting
    :return: The requested file
    """
    return send_from_directory(main.static_folder, 'assets/' + path)


@main.route('/app/<path:path>')
def app(path):
    """
    Route for returning any files contained in the app dir, typically javascript
    :param path: Path to the file the browser is requesting
    :return: The file
    """
    return send_from_directory(main.static_folder, 'app/' + path)


@main.route('/api-docs')
def api():
    """
    Route for API Docs welcome page
    """
    api_url = current_app.config['API_DOCS_URL']
    return render_template('welcome.html', doc_link=api_url)


@main.route('/', defaults={'path': 'index.html'})
@main.route('/<path:path>')
def default(path):
    """
    Default route for all other requests not handled above, which basically hands off to Angular to handle the routing
    """
    return main.send_static_file('index.html')
