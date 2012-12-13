#!/usr/bin/env python
import os
from config import *

namespace = "closure_boilerplate.start"

# Path to the Closure Library closurebuilder.py script
closurebuilder = os.path.join(PATHS.CLOSURE_LIBRARY, 'closure/bin/build/closurebuilder.py')

output_file = os.path.join(PATHS.JS, 'app.min.js')

flags = ' '.join([
    '--compilation_level=ADVANCED_OPTIMIZATIONS',
    ])

cmd = """{closurebuilder} \\
        --root={PATHS.CLOSURE_LIBRARY} \\
        --root={PATHS.CLOSURE_APPLICATION} \\
        --namespace=\"{namespace}\" \\
        --output_mode=compiled \\
        --compiler_jar={PATHS.COMPILER} \\
        --compiler_flags=\"{flags}\" \\
        > {output_file}""".format(**locals())


print("> {0}".format(cmd))
os.system(cmd)
