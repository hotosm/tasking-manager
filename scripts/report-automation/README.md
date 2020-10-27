

The Jupyter notebook files in this directory are intended for managers who work with
Tasking Manager mapping campaigns that have a large number of TM Projects.

The notebooks are intentionally written in a way that they are independent of where they are stored.
This means that you can copy a notebook to a different workspace outside the tasking-manager repository, and it should still work the same.


# Using on Google Colab

Hosting a Jupyter notebook in google colab allows all team members in an activation
to run and/or view the report results in a browser without having to install
a Jupyter runtime.

The notes in this section refer to the Google Colab user interface.

To update the data displayed in the notebook, use the _Runtime_ > _Run all_ menu item in the top menu bar.

Running the notebook in _playground mode_ lets you execute the notebook to update the data, without making any changes permanent changes. When you close the browser tab, any changes you've made or results of running the notebook are discarded. You don't have to always run the notebook.
See the _TM Data aquisition_ section of the notebook to check to timestamp of when the data was updated.

Run the notebook in regular mode (as opposed to playground mode) and save using _File_ > _Save_ to update the notebook data outputs so that the next person sees the updated view.

# Installing dependencies

If you are using Google Colab, this section does not apply, as the environment is
already configured.

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
jupyter nbconvert <notebook-file.ipynb> --to html --no-input --no-prompt --execute
```

This will execute the notebook (and therefore update it with all the latest data from Tasking Manager) and output a version of the notebook where all the code cells inputs are removed, making the actual content more readable.
