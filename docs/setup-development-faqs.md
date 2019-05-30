# Development setup FAQs

### 1. I'm on Linux and see a _ENOSPC_ error when running the client with Gulp
There's a known issue with Gulp watch that is discussed in [this Stack Overflow post](http://stackoverflow.com/questions/16748737/grunt-watch-error-waiting-fatal-error-watch-enospc)

If you run the following command it should resolve this issue:

`echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`

### 2. I'm on Mac and see _pg_config executable not found_ when pip installing requirements.txt
Unfortunately, on Mac, the latest [psycopg](http://initd.org/psycopg/) release requires postgresql to be intalled locally to build, as described in [this Stack Overflow post](http://stackoverflow.com/questions/33866695/install-psycopg2-on-mac-osx-10-9-5-pg-config-pip)

Easiest way to resolve to to install postgres with [Homebrew](https://brew.sh/)

`brew install postgresql`

### 3. I'm on Mac and see [SSL: CERTIFICATE_VERIFY_FAILED] when authenticating locally
This is super annoying (as it works fine on Win and Lin)  I couldn't find any elegant solution other than monkey patching my local request.py file, at line 1363, replacing https_open to look like this.  [Some background here](http://stackoverflow.com/questions/33770129/how-do-i-disable-the-ssl-check-in-python-3-x) Better solutions are most welcome, please submit if you have them 😄 


```
def https_open(self, req):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    return self.do_open(http.client.HTTPSConnection, req,
            context=ctx, check_hostname=self._check_hostname)
```

**Update:**
- Run `venv/bin/pip install requests[security]` from TM working directory
- If the [error still persists](https://stackoverflow.com/questions/27835619/urllib-and-ssl-certificate-verify-failed-error), there are chances that might be running a fresh installation of Python 3.6. You'll have to install the `certifi` package using:
`/Applications/Python\ 3.6/Install\ Certificates.command`

### 4. I can't login locally when not running the API locally
Your login callback will be redirected relatively to the API URL. If you running the client locally but not pointing to a local API, this means that you cannot login locally. To work around this, you can do the following:
- open your developer tools in your browser and watch the network tab
- click the login button and login to OSM. After a successful login it will redirect you where the API lives.
- look for the URL "...../authorized?username=username-here&session_token=token-here&ng=0&redirect_to=/" in your network tab in your developer tools. Take the relative part of the URL and point it to localhost. E.g. "localhost:3000/authorized?username=username-here&session_token=token-here&ng=0&redirect_to=/". 
- now you should be logged in locally
