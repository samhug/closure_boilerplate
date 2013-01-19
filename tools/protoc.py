#!/usr/bin/env python
# encoding: utf-8
# Samuel Hug, 2013

"""
Support for compiling Google Protocol Buffers into various languages.

Protocol Buffer Homepage: https://developers.google.com/protocol-buffers/

===========================================================
EXAMPLE
===========================================================

def configure(ctx):
    ctx.load('protoc')

def build(ctx):
    ctx.load('protoc')
    ctx(features='protoc', source=ctx.path.find_node('test.proto'))

===========================================================
"""
from waflib import Task
from waflib.TaskGen import feature, extension, before_method
from waflib.Configure import conf

import os

def configure(ctx):
    ctx.find_program('protoc', var='PROTOC')
    ctx.find_program('protoc-gen-js', var='PROTOC_PLUGIN_JS')

@extension('.proto')
def proto_hook(self, node):
    pass

@feature('protoc_js')
@before_method('process_source')
def compile_proto_js(self):
    """Create a protoc_js task"""

    for src in self.source:
        tgt = src.get_bld().change_ext('.pb.js')
        self.create_task('protoc_js', src, tgt)

class protoc_js(Task.Task):
    """Compiles .proto files into javascript sources"""
    color   = 'PINK'

    def run(self):
        command = [self.env.PROTOC, '--plugin', self.env.PROTOC_PLUGIN_JS,
                '-I', os.path.dirname(self.inputs[0].abspath()), 
                '--js_out', self.outputs[0].parent.abspath(),
                self.inputs[0].abspath()
                ]

        return self.exec_command(command)

@feature('protoc_python')
@before_method('process_source')
def compile_proto_python(self):
    """Create a protoc_python task"""

    for src in self.source:
        tgt = src.get_bld().change_ext('_pb2.py')
        self.create_task('protoc_python', src, tgt)

class protoc_python(Task.Task):
    """Compiles .proto files into python sources"""
    color   = 'PINK'

    def run(self):
        command = [self.env.PROTOC,
                '-I', os.path.dirname(self.inputs[0].abspath()), 
                '--python_out', self.outputs[0].parent.abspath(),
                self.inputs[0].abspath()
                ]

        return self.exec_command(command)
