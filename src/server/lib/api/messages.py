
class BaseAPIMessage(object):

    def __init__(self, result, error=None):
        self.result = result
        self.error = error

    def __json__(self):
        return self.__dict__

