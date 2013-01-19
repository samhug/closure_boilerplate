from api.handlers import BaseAPIHandler
from api.messages import BaseAPIMessage

from time import gmtime, strftime


class TimeHandler(BaseAPIHandler):
    """Sends the current time to the client"""

    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.message = BaseAPIMessage(strftime("%a, %d %b %Y %H:%M:%S +0000", gmtime()))
