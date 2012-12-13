import webapp2

from webapp2_extras import json


class MainPage(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.encode({'result': 'Hello World!'}))

app = webapp2.WSGIApplication([('/_/hello', MainPage)], debug=True)
