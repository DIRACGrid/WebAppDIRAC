#!/bin/bash

if [[ "${CHECK}" == "pylintPY3K"  ]]; then
  find WebApp Lib Core scripts -name "*.py" -and -not -name 'pep8_*' -exec pylint -E --rcfile=.pylintrc3k --py3k --msg-template="{path}:{line}: [{msg_id}({symbol}), {obj}] {msg}" {} +
else
  find WebApp Lib Core scripts -name "*.py" -and -not -name 'pep8_*' -exec pylint -E --rcfile=.pylintrc --msg-template="{path}:{line}: [{msg_id}({symbol}), {obj}] {msg}" {} +
fi
