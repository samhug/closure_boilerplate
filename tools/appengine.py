#!/usr/bin/env python
# encoding: utf-8

from subprocess import Popen
from waflib import *
import os

from waflib.Configure import conf

def options(ctx):

    ctx.add_option('--port', action='store', default='8080',
            help='Port for local development server')

@conf
def find_appengine_sdk(ctx, path=None):
    ctx.find_program('dev_appserver.py', path_list=path, var='APPENGINE_DEV_APPSERVER')
    ctx.find_program('appcfg.py', path_list=path, var='APPENGINE_APPCFG')

@conf
def find_appengine_app(ctx, path='.'):
    app_root = ctx.path.find_dir(path)
    if not app_root:
        ctx.fatal('Unable to locate application directory ({0})'.format(path))

    yaml = app_root.find_node('app.yaml')
    if not yaml:
        ctx.fatal('Unable to locate application YAML in ({0})'.format(app_root.nice_path()))

    ctx.env.APPENGINE_APP_ROOT = app_root.abspath()
    ctx.env.APPENGINE_APP_YAML = yaml.abspath()

def configure(ctx):
    ctx.load('python')
    ctx.check_python_version(minver=(2,7,0))


def build(ctx):
    # Copy YAML file to the build directory
    yaml = ctx.root.find_node(ctx.env.APPENGINE_APP_YAML)
    if not yaml:
        ctx.fatal('Unable to locate YAML file at ({0})'.format(ctx.env.APPENGINE_APP_YAML))
    ctx(rule='cp ${SRC} ${TGT}', source=yaml, target=yaml.get_bld())


def serve(ctx):
    print('Starting Development Server...')

    app_node = ctx.root.find_dir(ctx.env.APPENGINE_APP_ROOT)
    if not app_node:
        ctx.fatal('Unable to locate application directory at ({0})'.format(ctx.env.APPENGINE_APP_ROOT))

    options = ['--use_sqlite', '--port', ctx.options.port]

    serve_cmd = "{python} {server} {options} {project}".format(
            python  = ctx.env.PYTHON[0],
            server  = ctx.env.APPENGINE_DEV_APPSERVER,
            project = app_node.get_bld().abspath(),
            options = ' '.join(options),
        )

    proc = Popen(serve_cmd, shell=True)

    try:
        proc.wait()
    except KeyboardInterrupt:
        Logs.pprint('RED', 'Development Server Interrupted... Shutting Down')
        proc.terminate()

def deploy(ctx):
    print('Deploying Application to AppEngine...')

    #TODO: Remove use of subprocess here.

    app_dir = ctx.root.find_dir(ctx.env.APPENGINE_APP_ROOT)
    if not app_dir:
        ctx.fatal('Unable to locate application at ({0})'.format(ctx.env.APPENGINE_APP_ROOT))

    cmd = "{python} {script} {options} update {project}".format(
            python  = ctx.env.PYTHON[0],
            script  = ctx.env.APPENGINE_APPCFG,
            project = app_dir.get_bld().abspath(),
            options = ' '.join([
                '--oauth2',
                '--no_cookies',
                ]),
        )

    proc = Popen(cmd, shell=True)

    try:
        proc.wait()
    except KeyboardInterrupt:
        Logs.pprint('RED', 'Deployment Interrupted... Shutting Down')
        proc.terminate()


Context.g_module.__dict__['serve'] = serve 
Context.g_module.__dict__['deploy'] = deploy 

class serve_cls(Build.InstallContext):
    cmd = 'serve'
    fun = 'serve'
class deploy_cls(Build.InstallContext):
    cmd = 'deploy'
    fun = 'deploy'
