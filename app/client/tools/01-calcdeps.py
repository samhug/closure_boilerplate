#!/usr/bin/env python
import os
from config import *

# Destination path for the generated deps.js script
deps_file = os.path.join(js_root, 'deps.js') 

# Path to the Closure Library calcdeps.py script
#calcdeps = os.path.join(closure_path, 'closure/bin/calcdeps.py')

# Path to the Closure Library depswriter.py script
depswriter = os.path.join(closure_path, 'closure/bin/build/depswriter.py')

#cmd = "{calcdeps} -d {closure_path} -p {js_root} -o deps --output_file={deps_file}".format(**locals())

root_prefix = os.path.relpath(app_root, goog_path)

cmd = "{depswriter} --root_with_prefix=\"{app_root} {root_prefix}\" > {deps_file}".format(**locals())

print("> {0}".format(cmd))
os.system(cmd)
