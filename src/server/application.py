from webapp2 import Route

import os, sys


def fix_path():
    sys.path.append(os.path.dirname(__file__))
    sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))


def main():
    import settings

    ## Construct URL Routes
    routes = []

    # Server Time
    routes.append(Route('/_/time',
            handler='services.server_time.TimeHandler',
            name='time'
        ))


    # Guestbook
    routes.append(Route('/_/guestbook/list',
            handler='services.guestbook.GuestbookHandler:list_greetings',
            name='guestbook-list'
        ))
    routes.append(Route('/_/guestbook/post',
            handler='services.guestbook.GuestbookHandler:post_greeting',
            name='guestbook-post'
        ))

    from api.Application import Application
    return Application(routes, debug=settings.DEBUG)


## Initialize Application
fix_path()
bootstrap__ = main()
