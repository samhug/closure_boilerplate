Server Endpoints
================


## This server exports the following endpoints
* ### /\_/user/ - - Returns information about the user

    ##### HTTP Method
    >   GET

    ##### Response
    If there is a user logged in
    >   `{ email: "someguy@gmail.com", logout_url: "http://some_url_to_logout_the_user/" }`
    Otherwise
    >   `{ login_url: "http://some_url_to_login_the_user" }`


* ### /\_/items/ - - Returns a list of all the items

    ##### HTTP Method
    >   GET

    ##### Response
    >   `[ { id:"item_id_1", title:"Wash the dishes", state:"0" }, { id:"item_id_2", title:"Sweep the floor", state:"0" }, ... ]`


* ### /\_/items/:id -- Retrieves the item with the specified id

    ##### HTTP Method
    >   GET

    ##### URL Parameters
    - id -- The id of the item to retrieve

    ##### Response
    >   `{ id:"item_id_1", title:"Wash the dishes", state:"0" }`


* ### /\_/items/create/ -- Creates a new item

    ##### HTTP Method
    >   POST

    ##### HTTP Parameters
    - title -- The title of the new item

    ##### Response
    >   `{ id:"item_id_1", title:"Wash the dishes", state:"0" }`

