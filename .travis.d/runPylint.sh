#!/bin/bash

git clone https://github.com/DIRACGrid/DIRAC.git --depth 1 --single-branch -b integration

find WebApp Lib Core scripts -name "*.py" -and -not -name 'pep8_*' -exec pylint -E --rcfile=.pylintrc --msg-template="{path}:{line}: [{msg_id}({symbol}), {obj}] {msg}" --extension-pkg-whitelist=numpy {} +
