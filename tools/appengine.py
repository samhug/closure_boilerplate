#!/usr/bin/env python
# encoding: utf-8

from subprocess import Popen
from waflib import *
import os

def options(ctx):
    pass

def configure(ctx):
    """
    Try and locate an Appengine SDK
    """

    ctx.load('python')
    ctx.check_python_version(minver=(2,7,0))

    ctx.find_program('dev_appserver.py', var='DEV_APPSERVER')
    ctx.find_program('appcfg.py', var='APPCFG')

    ctx.env.APPLICATION_YAML = ctx.find_file('app.yaml', path_list=['.', 'app'])
    if not ctx.env.APPLICATION_YAML:
        ctx.fatal('Unable to locate `app.yaml`')

    ctx.env.APPLICATION_ROOT = os.path.dirname(ctx.env.APPLICATION_YAML)
    ctx.env.APPLICATION_DIR = os.path.relpath(ctx.env.APPLICATION_ROOT, ctx.srcnode.abspath())


def build(ctx):

    app_dir = os.path.join(ctx.srcnode.abspath(), ctx.env.APPLICATION_DIR)

    # Copy the YAML file to the build directory
    yaml = ctx.path.find_node(ctx.env.APPLICATION_YAML)
    ctx(rule='cp ${SRC} ${TGT}', source=yaml, target=yaml.get_bld())


def serve(ctx):
    print('Starting Development Server...')

    serve_cmd = "{python} {server} {options} {project}".format(
            python  = ctx.env.PYTHON[0],
            server  = ctx.env.DEV_APPSERVER,
            project = os.path.join(ctx.bldnode.abspath(), ctx.env.APPLICATION_DIR),
            options = ' '.join([
                '--use_sqlite',
                ]),
        )

    proc = Popen(serve_cmd, shell=True)

    try:
        proc.wait()
    except KeyboardInterrupt:
        Logs.pprint('RED', 'Development Server Interrupted... Shutting Down')
        proc.terminate()

def deploy(ctx):
    print('Deploying Application to AppEngine...')

    cmd = "{python} {script} {options} update {project}".format(
            python  = ctx.env.PYTHON[0],
            script  = ctx.env.APPCFG,
            project = os.path.join(ctx.bldnode.abspath(), ctx.env.APPLICATION_DIR),
            options = ' '.join([
                '--oauth2',
                '--no_cookies',
                ]),
        )

    proc = Popen(cmd, shell=True)

    try:
        proc.wait()
    except KeyboardInterrupt:
        Logs.pprint('RED', 'Development Server Interrupted... Shutting Down')
        proc.terminate()


Context.g_module.__dict__['serve'] = serve 
Context.g_module.__dict__['deploy'] = deploy 

class serve_cls(Build.InstallContext):
    cmd = 'serve'
    fun = 'serve'
class deploy_cls(Build.InstallContext):
    cmd = 'deploy'
    fun = 'deploy'
