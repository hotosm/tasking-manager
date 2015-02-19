import os
import subprocess
from pyramid.static import PathSegmentCacheBuster


class GitCacheBuster(PathSegmentCacheBuster):
    """
    Assuming your code is installed as a Git checkout, as opposed to as an
    egg from an egg repository like PYPI, you can use this cachebuster to
    get the current commit's SHA1 to use as the cache bust token.
    """
    def __init__(self):
        super(GitCacheBuster, self).__init__()
        here = os.path.dirname(os.path.abspath(__file__))
        self.sha1 = subprocess.check_output(
            ['git', 'rev-parse', 'HEAD'],
            cwd=here).strip()

    def tokenize(self, pathspec):
        return self.sha1
