#!/bin/bash

# Construct virtualenv environment
virtualenv .

# Activate the environment
source ./bin/activate

# Install project dependancies
pip install -r requirements.txt

# Deactivate the environment
deactivate
