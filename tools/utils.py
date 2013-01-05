#!/usr/bin/env python
# encoding: utf-8
# Samuel Hug, 2013

from waflib import Task
from waflib.TaskGen import feature
from waflib.Configure import conf

import shutil, os

class copy_file(Task.Task):
    """Copies files """
    color   = 'GREEN'

    def run(self):
        target_dir = self.outputs[0].parent.abspath()
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)

        shutil.copy(self.inputs[0].abspath(), self.outputs[0].abspath())
        return 0

@conf
def copy(self, source, target=None, **kw):
    kw['env'] = self.env

    target = target or source.get_bld()
    tsk = copy_file(**kw)
    tsk.set_inputs(source)
    tsk.set_outputs(target)
    self.add_to_group(tsk)
    return tsk

