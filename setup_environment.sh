#!/bin/bash

sudo apt-get install mysql-server

sudo apt install python3.12-venv
python3 -m venv .venv
. .venv/bin/activate


pip install Flask mysql-connector-python
pip install flask_wtf

. .venv/bin/activate