#! /usr/bin/env python
# encoding: utf-8

APPNAME = 'closure_boilerplate'
VERSION = '0.1'

top = '.'
out = 'build'

TOOLDIR = './tools'

import os
import itertools

def options(ctx):
    ctx.load('appengine', tooldir=TOOLDIR);
    ctx.load('google_closure', tooldir=TOOLDIR);

    #ctx.add_option('--env', action='store', default='development',
    #        help='Build environment (production, development)')

def configure(ctx):
    ctx.load('appengine', tooldir=TOOLDIR);
    ctx.load('google_closure', tooldir=TOOLDIR);

    ctx.find_closure_tools(path='src/client/tools')

    ctx.find_appengine_sdk();
    ctx.find_appengine_app('src')


def build(ctx):
    ctx.load('appengine', tooldir=TOOLDIR);
    ctx.load('google_closure', tooldir=TOOLDIR);

    #print('Building in \'{0}\' mode.'.format(ctx.options.env))

    client_dir = ctx.path.find_dir('src/client')
    server_dir = ctx.path.find_dir('src/server')

    def find_roots(paths):
        roots = set()
        for p in paths:
            node = client_dir.find_dir(p)
            if not node:
                ctx.fatal('Unable to find root directory ({0})'.format(p))
            roots.add(node)
        return roots


    app_roots = find_roots({
            'src',
        })
    lib_roots = find_roots({
            'tools/closure-templates',
            'lib/relief/relief',
        })

    roots = set()
    roots.update(app_roots)
    roots.update(lib_roots)
    roots.update({r.get_bld() for r in roots if r.get_bld().mkdir() or True})

    ## Closure Linter -- Detect style issues in the Javascript
    ctx(features='gjslint', roots=app_roots)

    ## Closure Stylesheets
    stylesheets_dir = client_dir.find_or_declare('gss')
    target_dir = client_dir.find_or_declare('www/css')
    for node in stylesheets_dir.ant_glob('**/*.gss'):
        ctx.closure_stylesheets(
                stylesheet=node,
                target=target_dir.find_or_declare(node.path_from(stylesheets_dir)).change_ext('.css')
                )

    ## Closure Templates
    source = itertools.chain.from_iterable([root.ant_glob('**/*.soy') for root in roots])
    ctx(source=source)

    ## Closure Compiler
    compiler_flags = []
    #compiler_flags += ['--compilation_level=SIMPLE_OPTIMIZATIONS']
    #compiler_flags += ['--compilation_level=ADVANCED_OPTIMIZATIONS']
    compiler_flags.append('--create_source_map='+client_dir.find_or_declare('www/js/source_map.js').abspath())

    ctx.closure_compiler(
            roots        = [r.abspath() for r in roots],
            namespaces   = ['__bootstrap'],
            target       = client_dir.find_or_declare('www/js/application.js'),
            #compile_type = 'concat',
            compile_type = 'advanced',
            compiler_flags = compiler_flags,
        )


    # Copy the www directory
    for node in client_dir.ant_glob('www/**/*'):
        ctx(rule='cp ${SRC} ${TGT}', source=node, target=node.get_bld())

    # Copy server scripts to the build directory
    for node in server_dir.ant_glob('**/*.py'):
        ctx(rule='cp ${SRC} ${TGT}', source=node, target=node.get_bld())
