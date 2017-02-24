from os.path import dirname, basename, isfile
import glob

# Iterate thru all model classes and set __all__ so we can easily import them at app start up
modules = glob.glob(dirname(__file__)+"/*.py")
__all__ = [basename(f)[:-3] for f in modules if isfile(f)]
