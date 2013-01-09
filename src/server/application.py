from webapp2 import Route

from api.Application import Application
from api.handlers import BaseAPIHandler
from api.messages import BaseAPIMessage

import settings


class HelloHandler(BaseAPIHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.message = BaseAPIMessage('Hello World!')


from time import gmtime, strftime
class TimeHandler(BaseAPIHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.message = BaseAPIMessage(strftime("%a, %d %b %Y %H:%M:%S +0000", gmtime()))


app = Application([
        Route('/_/hello', handler=HelloHandler, name='hello'),
        Route('/_/time', handler=TimeHandler, name='time'),
    ], debug=settings.DEBUG)
