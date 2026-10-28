"""Regression tests for the state (de)serialization in UPHandler.

Desktops and application states have been stored in several formats over
time: DEncode-encoded JSON text (up to v6.0.6), double-encoded JSON
(v6.0.7/v6.0.8, json.dumps applied to an already serialized JSON text) and
plain JSON text (current format). All of them must decode back to the
original structure, otherwise the frontend fails to build the "My Desktops"
tree (https://github.com/DIRACGrid/WebAppDIRAC issues from v6.0.7 release).
"""

import base64
import json
import sys
import zlib
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from WebAppDIRAC.WebApp.handler.UPHandler import _safeDecode  # noqa: E402

STATE = {
    "version": 2,
    "data": [{"module": "DIRACSomeApp", "name": "a state"}],
    "views": {"tabs": {"activeTab": 0}},
}


def _compress(raw):
    return base64.b64encode(zlib.compress(raw, 9))


def test_decodeLegacyDEncodeEncodedJSON():
    # States saved before v6.0.7: DEncode.encode() of the JSON text
    from DIRAC.Core.Utilities import DEncode

    blob = _compress(DEncode.encode(json.dumps(STATE)))
    assert _safeDecode(blob) == STATE


def test_decodeDoubleEncodedJSON():
    # States saved with v6.0.7/v6.0.8: json.dumps() of the JSON text
    blob = _compress(json.dumps(json.dumps(STATE)).encode())
    assert _safeDecode(blob) == STATE


def test_decodeCurrentFormat():
    # Current format: the JSON text sent by the browser, stored as is
    blob = _compress(json.dumps(STATE).encode())
    assert _safeDecode(blob) == STATE


def test_decodePlainString():
    # Data that is neither JSON nor DEncode is rejected
    blob = _compress(b"a plain string")
    with pytest.raises(ValueError):
        _safeDecode(blob)


def test_decodeJSONStringState():
    # A state that legitimately is a JSON string is unwrapped to that string
    blob = _compress(json.dumps(json.dumps("just a string")).encode())
    assert _safeDecode(blob) == "just a string"


def test_decodeDeeplyNestedDENcodeRejected():
    # Defense-in-depth from the JSON migration must be kept: deeply nested
    # legacy DEncode data is rejected instead of being decoded
    nested = b"l" * 100 + b"e" * 100  # 100 nested empty lists
    blob = _compress(nested)
    with pytest.raises(ValueError):
        _safeDecode(blob)
