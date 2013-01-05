#!/usr/bin/env python
# encoding: utf-8

from subprocess import Popen
from waflib import *
import os, sys

from waflib.Configure import conf

def options(ctx):

    ctx.add_option('--port', action='store',
            help='Port for local development server')

@conf
def find_python_program(self, filename, **kwargs):
    """
    Search for a python program on the operating system

    :param filename: file to search for
    :type filename: string
    :param path_list: list of paths to look into
    :type path_list: list of string
    :param var: store the results into *conf.env.var*
    :type var: string
    :param environ: operating system environment to pass to :py:func:`waflib.Configure.find_program`
    :type environ: dict
    :param exts: extensions given to :py:func:`waflib.Configure.find_program`
    :type exts: list
    """

    try:
        app = self.find_program(filename, **kwargs)
    except Exception:
        self.find_program('python', var='PYTHON_BIN')
        app = self.find_file(filename, os.environ['PATH'].split(os.pathsep))
        if not app:
            raise
        if kwargs.get('var', None):
            self.env[kwargs.get('var')] = Utils.to_list(self.env['PYTHON_BIN']) + [app]
        self.msg('Checking for %r' % filename, app)

@conf
def find_appengine_sdk(ctx, path_list=[]):
    ctx.find_python_program('dev_appserver.py', path_list=path_list, var='APPENGINE_DEV_APPSERVER')
    ctx.find_python_program('appcfg.py', path_list=path_list, var='APPENGINE_APPCFG')

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
    ctx.load('utils')
    ctx.check_python_version(minver=(2,7,0))


def build(ctx):
    # Copy YAML file to the build directory
    yaml = ctx.root.find_node(ctx.env.APPENGINE_APP_YAML)
    if not yaml:
        ctx.fatal('Unable to locate YAML file at ({0})'.format(ctx.env.APPENGINE_APP_YAML))
    ctx.copy(yaml)


def serve(ctx):
    print('Starting Development Server...')

    app_node = ctx.root.find_dir(ctx.env.APPENGINE_APP_ROOT)
    if not app_node:
        ctx.fatal('Unable to locate application directory at ({0})'.format(ctx.env.APPENGINE_APP_ROOT))

    options = ['--use_sqlite']
    if not ctx.options.port is None:
        options += ['--port', str(ctx.options.port)]

    server = ctx.env.APPENGINE_DEV_APPSERVER
    if isinstance(server, list):
        server = server[1]

    serve_cmd = "{python} {server} {options} {project}".format(
            python  = ctx.env.PYTHON[0],
            server  = server,
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

    script = ctx.env.APPENGINE_APPCFG
    if isinstance(script, list):
        script = script[1]

    cmd = "{python} {script} {options} update {project}".format(
            python  = ctx.env.PYTHON[0],
            script  = script,
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
