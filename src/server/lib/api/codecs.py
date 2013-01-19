import json

from messages import BaseAPIMessage

class BaseCodec(object):

    mime_type = 'text/plain'

    def encode(self, o):
        pass

    def decode(self, buf):
        pass

class JSONCodec(BaseCodec):

    mime_type = 'application/json'

    class JSONEncoder(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, BaseAPIMessage):
                return o.__json__()

            return super(JSONCodec.JSONEncoder, self).default(o)

    def __init__(self):
        self.encoder_ = self.JSONEncoder()

    def encode(self, o):
        return self.encoder_.encode(o)

    def decode(self, buf):
        return self.encoder_.decode(buf)
