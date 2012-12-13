import os, common

PATHS = common.Config()

PATHS.ROOT  = common.root_path()
PATHS.TOOLS = os.path.join(PATHS.ROOT, 'tools')
PATHS.WWW   = os.path.join(PATHS.ROOT, 'www') 
PATHS.JS    = os.path.join(PATHS.WWW,  'js') 

PATHS.CLOSURE_LIBRARY     = os.path.join(PATHS.ROOT, 'lib', 'closure-library') 
PATHS.CLOSURE_APPLICATION = os.path.join(PATHS.ROOT, 'src') 
PATHS.CLOSURE_GOOG        = os.path.join(PATHS.CLOSURE_LIBRARY, 'closure', 'goog') 

PATHS.APPLICATION_BOOTSTRAP = os.path.join(PATHS.JS, 'bootstrap.js') 

PATHS.COMPILER = os.path.join(PATHS.TOOLS, 'closure-compiler', 'compiler.jar')
PATHS.PLOVR    = os.path.join(PATHS.TOOLS, 'plovr.jar')


PATHS.PLOVR_CONFIG = os.path.join(PATHS.JS, 'plovr_config.js')

PLOVR = common.Config({
    "id":       "client",
    "paths":    [PATHS.CLOSURE_APPLICATION],
    "inputs":   PATHS.APPLICATION_BOOTSTRAP,
    "mode":     "RAW",
    "level":  "VERBOSE",

    "output-charset": "UTF-8",
})
