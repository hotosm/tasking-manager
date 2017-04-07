REM Installer for tasking-manager on Windows,
REM This is needed for any library which has C++ bindings rather than being pure python
REM Only an issue for local development on Windows.
REM Run from root of application, venv MUST be activated prior to running
REM Sourced from http://www.lfd.uci.edu/~gohlke/pythonlibs/

python -m pip install -U pip
pip install .\devops\win\Shapely-1.5.17-cp36-cp36m-win_amd64.whl
pip install -r requirements.txt
