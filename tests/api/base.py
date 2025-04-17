from shapely.geometry import shape


# Code modified from https://github.com/larsbutler/oq-engine/blob/master/tests/utils/helpers.py
# Note: Was originally in test_resources.py (author Aadesh-Baral)
def assertDeepAlmostEqual(self, expected, actual, *args, **kwargs):
    """
    Assert that two complex structures have almost equal contents.

    Compares lists, dicts and tuples recursively. Checks numeric values
    using test_case's :py:meth:`unittest.TestCase.assertAlmostEqual` and
    checks all other values with :py:meth:`unittest.TestCase.assertEqual`.
    Accepts additional positional and keyword arguments and pass those
    intact to assertAlmostEqual() (that's how you specify comparison
    precision).

    :type test_case: :py:class:`unittest.TestCase` object
    """
    kwargs.pop("__trace", "ROOT")
    if (
        hasattr(expected, "__geo_interface__")
        and hasattr(actual, "__geo_interface__")
        and expected.__geo_interface__["type"] == actual.__geo_interface__["type"]
        and expected.__geo_interface__["type"] not in ["Feature", "FeatureCollection"]
    ):
        shape_expected = shape(expected)
        shape_actual = shape(actual)
        assert shape_expected.equals(shape_actual)
    elif isinstance(expected, (int, float, complex)):
        self.assertAlmostEqual(expected, actual, *args, **kwargs)
    elif isinstance(expected, (list, tuple)):
        self.assertEqual(len(expected), len(actual))
        for index in range(len(expected)):
            v1, v2 = expected[index], actual[index]
            self.assertDeepAlmostEqual(v1, v2, __trace=repr(index), *args, **kwargs)
    elif isinstance(expected, dict):
        self.assertEqual(set(expected), set(actual))
        for key in expected:
            self.assertDeepAlmostEqual(
                expected[key], actual[key], __trace=repr(key), *args, **kwargs
            )
    else:
        self.assertEqual(expected, actual)
