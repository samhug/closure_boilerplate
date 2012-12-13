#! /usr/bin/env python
# encoding: utf-8

import os
from waflib import TaskGen

def configure(conf):

    conf.load('python')
    conf.find_program('java', var='JAVA')

    conf.find_program('gjslint.py', path_list=os.path.join(conf.path.abspath(), 'lib', 'closure_linter'), var='CLOSURE_LINTER')

    conf.find_program('fixjsstyle.py', path_list=os.path.join(conf.path.abspath(), 'lib', 'closure_linter'), var='CLOSURE_LINTER_FIX')

    conf.find_program('compiler.jar', path_list=os.path.join(conf.path.abspath(), 'tools','closure-compiler'), var='CLOSURE_COMPILER')

    conf.find_program('SoyToJsSrcCompiler.jar', path_list=os.path.join(conf.path.abspath(), 'lib','closure-templates'), var='CLOSURE_TEMPLATES')

    conf.find_program('closure-stylesheets.jar', path_list=os.path.join(conf.path.abspath(), 'lib','closure-stylesheets'), var='CLOSURE_STYLESHEETS')

    conf.find_program('closurebuilder.py', path_list=os.path.join(conf.path.abspath(), 'lib','closure-library','closure','bin','build'), var='CLOSURE_BUILDER')

    conf.env.CLOSURE_LIBRARY  = os.path.join(conf.path.abspath(), 'lib', 'closure-library')


@TaskGen.feature('closure_compiler')
def closure_compiler(self):
    namespace = getattr(self, 'namespace', 'application.start')

    command = [self.env.PYTHON[0], self.env.CLOSURE_BUILDER]
    command.append('--root='+os.path.join(self.env.CLOSURE_LIBRARY, 'closure/goog'))
    command.append('--root='+os.path.join(self.env.CLOSURE_LIBRARY, 'third_party/closure/goog'))

    if isinstance(self.roots, str):
        self.roots = self.roots.split()
    command += ['--root='+p for p in self.roots]

    command.append('--output_mode=compiled')
    command.append('--compiler_jar='+self.env.CLOSURE_COMPILER)
    command.append('--namespace='+namespace)
    command.append('--compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS"')
    command.append('--output_file='+self.target)

    return self.bld.exec_command(' '.join(command))

@TaskGen.feature('gjslint')
def gjslint(self):

    command = [self.env.PYTHON, self.env.CLOSURE_LINTER, '--strict', '-r']

    if isinstance(self.roots, str):
        self.roots = self.roots.split()
    command += self.roots

    return self.bld.exec_command(command)

@TaskGen.feature('fixjsstyle')
def fixjsstyle(self):

    command = [self.env.PYTHON, self.env.CLOSURE_LINTER_FIX, '--strict', '-r']

    if isinstance(self.roots, str):
        self.roots = self.roots.split()
    command += self.roots

    return self.bld.exec_command(command)

from waflib import TaskGen
TaskGen.declare_chain(name='template',
        rule='${JAVA} -jar ${CLOSURE_TEMPLATES} \
                --shouldProvideRequireSoyNamespaces \
                --cssHandlingScheme GOOG \
                --outputPathFormat ${TGT} \
                ${SRC}',
        ext_in='.soy', ext_out='.soy.js')

'''
        --pretty-print \
        --output-renameing-map ${TGT[0].parent.abspath()}/renaming_map.js \
        --output-renameing-map-format CLOSURE_UNCOMPILED \
        --rename CLOSURE \
'''
TaskGen.declare_chain(name='stylesheet',
        rule='${JAVA} -jar ${CLOSURE_STYLESHEETS} \
                --output-file ${TGT} \
                ${SRC}',
        ext_in='.css .gss', ext_out='.min.css',
        reentrant = False)
