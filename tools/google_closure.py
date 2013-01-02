#! /usr/bin/env python
# encoding: utf-8

import os, sys
from waflib import *
from waflib.Configure import conf

def options(ctx):
    pass

@conf
def find_closure_tools(ctx, path='.'):

    tool_path = ctx.path.find_dir(path)
    if not tool_path:
        ctx.fatal('Unable to locate tool path ({0})'.format(path))

    def find_tool(name, var, path=tool_path):
        node = path.find_node(name)
        if not node:
            ctx.fatal('Unable to locate the ({0}) tool.'.format(name))
        setattr(ctx.env, var, node.abspath())

    find_tool('closure_linter/gjslint.py', 'CLOSURE_LINTER')
    find_tool('closure_linter/fixjsstyle.py', 'CLOSURE_LINTER_FIX')
    find_tool('closure-compiler/compiler.jar', 'CLOSURE_COMPILER_JAR')
    find_tool('closure-templates/SoyToJsSrcCompiler.jar', 'CLOSURE_TEMPLATES_JAR')
    find_tool('closure-stylesheets/closure-stylesheets.jar', 'CLOSURE_STYLESHEETS_JAR')

    find_tool('closure-library', 'CLOSURE_LIBRARY')
    find_tool('closure/bin/build', 'CLOSURE_SCRIPTS', path=ctx.root.find_node(ctx.env.CLOSURE_LIBRARY))
    find_tool('closurebuilder.py', 'CLOSURE_BUILDER', path=ctx.root.find_node(ctx.env.CLOSURE_SCRIPTS))

    sys.path.append(ctx.env.CLOSURE_SCRIPTS)

def configure(ctx):
    ctx.load('python')
    ctx.find_program('java', var='JAVA')


class closure_compiler_task(Task.Task):

    vars = ['PYTHON', 'CLOSURE_BUILDER', 'CLOSURE_LIBRARY', 'CLOSURE_COMPILER']

    def __init__(self, namespaces, roots, target, inputs=None, source_map=None, source_map_url=None, compile_type=None, compiler_flags=[], *k, **kw):
        Task.Task.__init__(self, *k, **kw)

        self.treescan = __import__('treescan')
        self.depstree = __import__('depstree')
        self.jscompiler = __import__('jscompiler')
        self.closurebuilder = __import__('closurebuilder')

        self.namespaces = namespaces
        self.compiler_flags = compiler_flags

        self.paths = None

        self.input_nodes = inputs or []
        self.source_map = source_map
        self.source_map_url = source_map_url

        self.set_outputs(target)

        if not source_map is None:
            compiler_flags.append('--create_source_map='+source_map.abspath())
            compiler_flags.append('--source_map_format=V3')

        self.compile_type = compile_type
        if compile_type == 'whitespace':
            compiler_flags += ['--compilation_level=WHITESPACE']
        elif compile_type == 'simple':
            compiler_flags += ['--compilation_level=SIMPLE_OPTIMIZATIONS']
        elif compile_type == 'advanced':
            compiler_flags += ['--compilation_level=ADVANCED_OPTIMIZATIONS']
        elif compile_type == 'concat' or compile_type is None:
            pass # Default
        else:
            raise Execption('Unrecognized compile_type ({0})'.format(compile_type))

        self.roots = [
            os.path.join(self.env.CLOSURE_LIBRARY, 'closure/goog'),
            os.path.join(self.env.CLOSURE_LIBRARY, 'third_party/closure/goog')
        ]
        self.roots += roots

    def run(self):

        if self.compile_type == 'concat':
            ## Concatenate
            compiled_source = ''.join([s.read()+'\n' for s in self.inputs])
        else:
            ## Compile
            compiled_source = self.jscompiler.Compile(
                    self.env.CLOSURE_COMPILER_JAR,
                    [s.abspath() for s in self.inputs],
                    self.compiler_flags)

        if compiled_source is None:
            self.fatal('JavaScript compilation failed.')

        if not self.source_map_url is None:
            compiled_source = '//@ sourceMappingURL='+self.source_map_url+'\n'+compiled_source

        self.outputs[0].write(compiled_source)
        return 0

    def scan(self):

        sources = set()

        for path in self.roots:
            for js_path in self.treescan.ScanTreeForJsFiles(path):
                sources.add(self.closurebuilder._PathSource(js_path))

        tree = self.depstree.DepsTree(sources)

        input_namespaces = set()
        for ns in self.namespaces:
            input_namespaces.add(ns)

        # The Closure Library base file must go first.
        base = self.closurebuilder._GetClosureBaseFile(sources)
        deps = [base] + tree.GetDependencies(input_namespaces)

        dep_paths = (os.path.relpath(s.GetPath(), self.bld.path.srcpath()) for s in deps)
        dep_nodes = [self.bld.path.find_resource(p) for p in dep_paths]
        
        self.set_inputs(dep_nodes)
        self.set_inputs(self.input_nodes)

        return (dep_nodes, [])


@conf
def closure_compiler(self, *k, **kw):
    kw['env'] = self.env
    tsk = closure_compiler_task(*k, **kw)
    self.add_to_group(tsk)
    return tsk


@TaskGen.feature('gjslint')
def gjslint(self):

    command = [
            self.env.PYTHON[0],
            self.env.CLOSURE_LINTER,
            '--strict', '--summary',
            ]

    for root in self.roots:
        command += ['-r', root.abspath()]
    
    return self.bld.exec_command(command)

@TaskGen.feature('fixjsstyle')
def fixjsstyle(self):

    command = [
            self.env.PYTHON[0],
            self.env.CLOSURE_LINTER_FIX,
            '--strict'
            ]

    for root in self.roots:
        command += ['-r', root.abspath()]

    return self.bld.exec_command(command)

TaskGen.declare_chain(name='template',
        rule='${JAVA} -jar ${CLOSURE_TEMPLATES_JAR} \
                --shouldProvideRequireSoyNamespaces \
                --cssHandlingScheme GOOG \
                --outputPathFormat ${TGT} \
                ${SRC}',
        ext_in='.soy', ext_out='.soy.js',
        before='closure_compiler_task')

class closure_stylesheets_task(Task.Task):

    vars = ['JAVA', 'CLOSURE_STYLESHEETS_JAR']

    def __init__(self, stylesheet, target, renaming_map=None, pretty=None, *k, **kw):
        Task.Task.__init__(self, *k, **kw)


        self.renaming_map = renaming_map
        self.pretty = pretty

        self.set_inputs(stylesheet)
        self.set_outputs(target)
        if self.renaming_map:
            self.set_outputs(self.renaming_map)

    def run(self):
        command = [self.env.JAVA, '-jar',
                self.env.CLOSURE_STYLESHEETS_JAR,
                '--output-file', self.outputs[0].abspath(),
                ]

        if not self.pretty is None:
            command += ['--pretty-print']

        if not self.renaming_map is None:
            command += [
                    '--output-renaming-map-format', 'CLOSURE_COMPILED',
                    '--rename', 'CLOSURE',
                    '--output-renaming-map', self.renaming_map.abspath(),
            ]


        command += [self.inputs[0].abspath()]

        return self.bld.exec_command(command)

@conf
def closure_stylesheets(self, *k, **kw):
    kw['env'] = self.env
    tsk = closure_stylesheets_task(*k, **kw)
    self.add_to_group(tsk)
    return tsk
