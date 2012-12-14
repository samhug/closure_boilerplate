from webapp2 import Response

from codecs import JSONCodec


class APIResponse(Response):

    default_codec = JSONCodec

    def __init__(self, *args, **kwargs):
        try:
            self.codec = kwargs['codec']()
            del kwargs['codec']
        except KeyError:
            self.codec = self.default_codec()

        super(APIResponse, self).__init__(*args, **kwargs)

    def _message__get(self):
        self.codec.decode(self.body.decode(self.charset or 'UTF-8'))

    def _message__set(self, value):
        self.body = self.codec.encode(value).encode(self.charset or 'UTF-8')

    def _message__del(self):
        del self.body

    message = property(_message__get, _message__set, _message__del)

