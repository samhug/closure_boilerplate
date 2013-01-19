from api.handlers import BaseAPIHandler
from api.messages import BaseAPIMessage

from models import Greeting


class GuestbookHandler(BaseAPIHandler):

    def list_greetings(self):
        """
        Retrievies a list of guestbook entries from the database and sends it the
        the client.
        """
        self.response.headers['Content-Type'] = 'application/json'

        greetings = Greeting.query()

        self.response.message = BaseAPIMessage(list(greetings))

    def post_greeting(self):
        """
        Accepts a greeting from the client and saves it to the database.
        """
        self.response.headers['Content-Type'] = 'application/json'

        self.request.get('content')

        greeting = Greeting(content=)

        key = greeting.put()

        self.response.message = BaseAPIMessage({'id': key})

    def delete_greeting(self):
        """
        Deletes the specified greeting.
        """
        self.response.headers['Content-Type'] = 'application/json'

        greetings = Greeting.query()

        self.response.message = BaseAPIMessage(list(greetings))
