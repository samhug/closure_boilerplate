from webapp2 import WSGIApplication

from APIResponse import APIResponse

class Application(WSGIApplication):
    response_class = APIResponse

