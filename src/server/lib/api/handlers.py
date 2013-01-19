from webapp2 import RequestHandler

from codecs import JSONCodec


class BaseAPIHandler(RequestHandler):
    default_codec = JSONCodec
