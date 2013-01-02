#! /usr/bin/env python
# encoding: utf-8

APPNAME = 'closure_boilerplate'
VERSION = '0.1'

top = '.'
out = 'build'

TOOLDIR = './tools'

import os
import itertools

from waflib import *

def options(ctx):
    ctx.load('appengine', tooldir=TOOLDIR);
    ctx.load('google_closure', tooldir=TOOLDIR);
    ctx.load('htmlcompressor', tooldir=TOOLDIR);
    ctx.load('htmlcssrenamer', tooldir=TOOLDIR);

    ctx.add_option('--mode', action='store', default='development',
            help='Build environment (production, development)')

def configure(ctx):
    ctx.load('appengine', tooldir=TOOLDIR);
    ctx.load('google_closure', tooldir=TOOLDIR);
    ctx.load('htmlcompressor', tooldir=TOOLDIR);
    ctx.load('htmlcssrenamer', tooldir=TOOLDIR);

    ctx.find_closure_tools(path='src/client/tools')
    ctx.find_htmlcompressor(path='src/client/tools')

    ctx.find_appengine_sdk();
    ctx.find_appengine_app('src')


def build(ctx):
    ctx.load('appengine', tooldir=TOOLDIR);
    ctx.load('google_closure', tooldir=TOOLDIR);
    ctx.load('htmlcompressor', tooldir=TOOLDIR);
    ctx.load('htmlcssrenamer', tooldir=TOOLDIR);

    print('Building project in \'{0}\' mode.'.format(ctx.options.mode))

    tmp_dir    = ctx.path.find_or_declare('tmp')
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

    css_renaming_map = client_dir.find_or_declare('src/renaming_map.js')

    ## Closure Stylesheets
    params = {
        }

    stylesheets_dir = client_dir.find_or_declare('gss')
    target_dir = client_dir.find_or_declare('www/css')

    if ctx.options.mode == 'development':
        params['pretty'] = True
    elif ctx.options.mode == 'production':
        params['renaming_map'] = css_renaming_map

    for node in stylesheets_dir.ant_glob('**/*.gss'):
        ctx.closure_stylesheets(
                stylesheet=node,
                target=target_dir.find_or_declare(node.path_from(stylesheets_dir)).change_ext('.css'),
                **params
        )

    ## Closure Templates
    source = itertools.chain.from_iterable([root.ant_glob('**/*.soy') for root in roots])
    ctx(source=source)

    ## Closure Compiler
    params = {
            'inputs': [],
        }

    # Google analytics script
    ga_script = client_dir.find_node('src/google_analytics.js')

    if ctx.options.mode == 'development':
        #params['source_map'] = client_dir.find_or_declare('www/js/source_map.js')
        #params['source_map_url'] = '/js/source_map.js'
        params['compile_type'] = 'simple'
    elif ctx.options.mode == 'production':
        params['compile_type'] = 'advanced'
        params['inputs'].append(ga_script)
        params['inputs'].append(css_renaming_map)

    ctx.closure_compiler(
            roots        = [r.abspath() for r in roots],
            namespaces   = ['__bootstrap'],
            target       = client_dir.find_or_declare('www/js/application.js'),
            **params
        )


    if ctx.options.mode == 'production':
        html_index = client_dir.find_node('www/index.html')

        html_index_tmp = tmp_dir.find_or_declare('www/index.html')


        # Rename HTML CSS classes
        ctx.htmlcssrenamer(
                renaming_map = css_renaming_map,
                inputs       = html_index,
                target       = html_index_tmp
            )

        # Compress HTML
        ctx.htmlcompressor(
                inputs       = html_index_tmp,
                target       = html_index.get_bld()
            )

    # Copy the www directory
    for node in client_dir.ant_glob('www/**/*'):
        ctx(rule='cp ${SRC} ${TGT}', source=node, target=node.get_bld())

    # Copy server scripts to the build directory
    for node in server_dir.ant_glob('**/*.py'):
        ctx(rule='cp ${SRC} ${TGT}', source=node, target=node.get_bld())

def fixjsstyle(ctx):
    ctx(features='fixjsstyle', roots=[ctx.path.find_dir('src/client/src')])

class fixjsstyle_cls(Build.InstallContext):
    cmd = 'fixjsstyle'
    fun = 'fixjsstyle'

