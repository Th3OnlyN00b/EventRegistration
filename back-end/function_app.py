import azure.functions as func
import logging
import os
import json
from azure.cosmos import CosmosClient
from azure.cosmos.exceptions import CosmosHttpResponseError
from auth import auth_utils
from argon2 import PasswordHasher

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)
app.register_functions(func.Blueprint()) 

@app.function_name('Create Phone Code')
@app.route(route="createPhoneCode")
def createPhoneCode(req: func.HttpRequest) -> func.HttpResponse:
    """
    Gets a six-digit phone code for validation that will be texted to the user and registers
    it in a database table. This method will not return the code in it's call.

    Parameters
    ------------
    req `HttpRequest`: The request needing token validation. Required body fields are `["phone"]`

    Returns
    ------------
    A `func.HttpResponse`, denoting the success or failure of this code creation.
    """
    logging.info('createPhoneCode trigger function processed a request.')
    return auth_utils.create_token_request(req)

@app.route(route="getAuthToken")
def getAuthToken(req: func.HttpRequest) -> func.HttpResponse:
    """
    Gets a 128-bit authorization token validating a user's login status and registers it in
    the authorization database. This will be the only time this code is sent to the client,
    so please store it securely. It will be needed for all authed requests.

    Parameters
    ------------
    req `func.HttpRequest`: The request needing token validation. Required body fields are `["phone", "code"]`

    Returns
    ------------
    A `func.HttpResponse`, denoting the success or failure of this token creation. If successful, will include a
    `'Set-Cookie'` header with the token.
    """
    logging.info('getAuthToken trigger function processed a request.')
    return auth_utils.create_token(req)

@app.route(route="createEvent")
def createEvent(req: func.HttpRequest) -> func.HttpResponse:
    """
    Creates an event structure via the JSON passed in and stores it in the database.\\
    *Requires authentication*

    Parameters
    ------------ 
    req `func.HttpRequest`: The request needing token validation. Required fields are `["event"]`

    Returns
    ------------
    A `func.HttpResponse`, denoting the success or failure of this token creation. If successful, will include a
    `'Set-Cookie'` header with the token.
    """
    return func.HttpResponse("Not implemented", status_code=501) # TODO

@app.route(route="getEvent")
def getEvent(req: func.HttpRequest) -> func.HttpResponse:
    """
    Creates an event structure via the JSON passed in and stores it in the database.
        - If authenticated and the host, will return all event information and attendee info.
        - If authenticated and an attendee, will return all RSVP info. 
        - If unauthenticated, will show only publicly available info. 
            - If a private event, will return 403. 
            - If public, will return publicly available info like attendee count, name, and possibly location. <-- TODO

    Parameters
    ------------ 
    req `func.HttpRequest`: The request needing token validation. Required fields are `["eventId"]`

    Returns
    ------------
    A `func.HttpResponse`, denoting the success or failure of this token creation. If successful, will include a
    `'Set-Cookie'` header with the token.
    """
    return func.HttpResponse("Not implemented", status_code=501) # TODO

@app.route(route="getAllEventsHostedBy")
def getAllHostedBy(req: func.HttpRequest) -> func.HttpResponse:
    """
    Creates an event structure via the JSON passed in and stores it in the database.
        - If authenticated will return all public events, as well as private events that the requester has been invited to.
        - If unauthenticated, will show only publicly available events.

    Parameters
    ------------ 
    req `func.HttpRequest`: The request needing token validation. Required fields are `["eventId"]`

    Returns
    ------------
    A `func.HttpResponse`, denoting the success or failure of this token creation. If successful, will include a
    `'Set-Cookie'` header with the token.
    """
    return func.HttpResponse("Not implemented", status_code=501) # TODO

app.route(route="getAllPrivateEvents")
def getAllPrivateEvents(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("Not implemented", status_code=501) # TODO

@app.route(route="getAllEvents")
def getAllEvents(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("Not implemented", status_code=501) # TODO
