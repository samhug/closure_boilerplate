#!/usr/bin/env python
# encoding: utf-8
# Samuel Hug, 2013

"""
Support for compiling LESS stylesheets into CSS.

Less Homepage: http://lesscss.org

===========================================================
EXAMPLE
===========================================================

def configure(ctx):
    ctx.load('less')

def build(ctx):
    ctx.load('less')
    ctx(features='less', source=ctx.path.find_node('test.less'))

===========================================================
"""
from waflib import Task
from waflib.TaskGen import feature, extension

def configure(ctx):
    ctx.find_program('lessc', var='LESSC')

@extension('.less')
def less_hook(self, node):
    pass

@feature('less')
def compile_less(self):
    """Create a lessc task"""
    target = self.target or self.source.get_bld().change_ext('.css')
    self.create_task('lessc', self.source, [target])

class lessc(Task.Task):
    """Compiles .less files """
    color   = 'YELLOW'
    run_str = '${LESSC} ${SRC} ${TGT}'
