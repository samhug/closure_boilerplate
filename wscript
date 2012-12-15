#! /usr/bin/env python
# encoding: utf-8

APPNAME = 'closure_boilerplate'
VERSION = '0.1'

top = '.'
out = 'build'

import sys
sys.path.append('./tools')

def options(opt):
    opt.load('appengine')
    opt.recurse('app/server')
    opt.recurse('app/client')

    opt.add_option('--env', action='store', default='development',
            help='Build environment (production, development)')

def configure(conf):
    conf.load('appengine')
    conf.recurse('app/server')
    conf.recurse('app/client')

def build(bld):
    print('Building in \'{0}\' mode.'.format(bld.options.env))

    bld.load('appengine')

    bld.recurse('app/server')
    bld.recurse('app/client')
