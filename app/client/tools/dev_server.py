#!/usr/bin/env python

import os
import config
import json
from tempfile import mkstemp

def generate_plovr_config():
    '''Generates a Plovr config file and returns the path to it'''
    fd, f_path = mkstemp()

    f = os.fdopen(fd, 'w')

    f.write(json.dumps(config.PLOVR))

    f.close()

    return f_path


os.system("java -jar {0} serve {1}".format(
        config.PATHS.PLOVR, generate_plovr_config()))

