#!/bin/bash

venv_name=virtualenv
current_dir=$(pwd)
venv_path=$current_dir/$venv_name

if [[ -d "$venv_path" ]]
then
    echo "Virtual env found, activating"
    source $venv_path/bin/activate
else
    echo "Virtual Env with name $venv_name not found, running pip install"
    python3 -m venv $venv_name
    source $venv_path/bin/activate
    pip3 install -r requirements.txt
fi

python3 server.py
