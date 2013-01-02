#! /usr/bin/env python
# encoding: utf-8

import os, sys
from waflib import *
from waflib.Configure import conf

def options(ctx):
    pass

@conf
def find_htmlcompressor(ctx, path='.'):

    tool_path = ctx.path.find_dir(path)
    if not tool_path:
        ctx.fatal('Unable to locate tool path ({0})'.format(path))


    def find_tool(name, var, path=tool_path):
        node = path.find_node(name)
        if not node:
            ctx.fatal('Unable to locate the ({0}) tool.'.format(name))
        setattr(ctx.env, var, node.abspath())

    find_tool('htmlcompressor.jar', 'HTMLCOMPRESSOR')


def configure(ctx):
    ctx.find_program('java', var='JAVA')


class htmlcompressor_task(Task.Task):

    vars = ['JAVA', 'HTMLCOMPRESSOR']

    def __init__(self, inputs=None, target=None, *k, **kw):
        Task.Task.__init__(self, *k, **kw)

        self.set_inputs(inputs or [])
        self.set_outputs(target)

    def run(self):
        command = [self.env.JAVA, '-jar', self.env.HTMLCOMPRESSOR]

        command += ['--output', self.outputs[0].abspath()]
        command += [self.inputs[0].abspath()]

        return self.bld.exec_command(command)

@conf
def htmlcompressor(self, *k, **kw):
    kw['env'] = self.env
    tsk = htmlcompressor_task(*k, **kw)
    self.add_to_group(tsk)
    return tsk
