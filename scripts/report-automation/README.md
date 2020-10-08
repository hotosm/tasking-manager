

The Jupyter notebook files in this directory are intended for managers who work with
Tasking Manager mapping campaigns that have a large number of TM Projects.

The notebooks are intentionally written in a way that they are independent of where they are stored.
This means that you can copy a notebook to a different workspace outside the tasking-manager repository, and it should still work the same.


# Installing dependencies

To run the notebooks on you own computer, you'll need:

- A jupyter notebook environment with a python3 kernel (https://jupyter.org)
- Python packages listed in [requirements.txt](./requirements.txt).

To install the python package dependencies, open a terminal session in the same directory as this readme file, and run:

```
python3 -m pip install -r requirements.txt
```


# Generating report documents

If you want to generate easily readable documents that don't require a Jupyter environment to read, use:

```
jupyter nbconver <notebook-file.ipynb> --to html --no-input --no-prompt --execute
```

This will execute the notebook (and therefore update it with all the latest data from Tasking Manager) and output a version of the notebook where all the code cells inputs are removed, making the actual content more readable.
