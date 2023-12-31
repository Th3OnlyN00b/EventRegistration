import azure.functions as func
import logging
import os
import json
from azure.cosmos import CosmosClient
from azure.cosmos.exceptions import CosmosHttpResponseError
from azure.identity import DefaultAzureCredential

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)
@app.route(route="getAttendees")
def getAttendees(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('getAttendees trigger function processed a request.')
    
    client = CosmosClient.from_connection_string(os.environ['COSMOS_CONNECTION_STRING'])
    database = client.get_database_client("Drinking Olympics")
    users_table = database.get_container_client("users")
    items = list(users_table.read_all_items(100))
    print(items)
    return func.HttpResponse(json.dumps(items), status_code=200)

@app.route(route="addOrUpdate", auth_level=func.AuthLevel.ANONYMOUS)
def addOrUpdate(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('addOrUpdate trigger function processed a request.')
    req_json = req.get_json()
    logging.info(req_json)
    # Now perform data checking!
    if "name" not in req_json:
        return func.HttpResponse("Stop fucking with my website, jesus christ it's supposed to be for one event. Chill. You forgot your name though.", status_code=403)
    if "phone" not in req_json:
        return func.HttpResponse("Stop fucking with my website, jesus christ it's supposed to be for one event. Chill. You forgot your phone though.", status_code=403)
    if "team" not in req_json:
        return func.HttpResponse("Stop fucking with my website, jesus christ it's supposed to be for one event. Chill. You forgot your team though.", status_code=403)
    if "note" not in req_json:
        return func.HttpResponse("Stop fucking with my website, jesus christ it's supposed to be for one event. Chill. You forgot your name though.", status_code=403)
    # Get only the final 10 digits from the phone number
    req_json["phone"] = ''.join(list(filter(lambda x: x.isdigit(), str(req_json["phone"]))))[-10:]
    if len(req_json["phone"]) != 10:
        return func.HttpResponse("Stop fucking with my website, jesus christ it's supposed to be for one event. Chill. That's not even a phone number.", status_code=403)
    if req_json["team"] not in {str(i) for i in range(11)}:
        return func.HttpResponse("Stop fucking with my website, jesus christ it's supposed to be for one event. Chill. That's not even a valid team.", status_code=403)
    if len(req_json["name"]) < 1:
        return func.HttpResponse("Stop fucking with my website, jesus christ it's supposed to be for one event. Chill. That's not even a real name.", status_code=403)
    # Shorten note if too long.
    req_json["note"] = req_json["note"][:128]

    client = CosmosClient.from_connection_string(os.environ['COSMOS_CONNECTION_STRING'])
    database = client.get_database_client("Drinking Olympics")
    users_table = database.get_container_client("users")
    teams_table = database.get_container_client("teams")
    try:
        # Try to get the user info. If not present, will throw a CosmosHttpResponseError
        # Rename "phone" key to "id"
        req_json['id'] = req_json['phone']
        del req_json['phone']
        logging.info(f"phone number: {req_json['id']}")
        user = users_table.read_item(req_json["id"], req_json["id"])
        logging.info(user)
        # We have a user entry already. We must then:
        # 1. IF REQUIRED, check to make sure the new team has room
        if user['team'] != req_json['team']:
            try:
                # Add the user to the team only if there's not already 6 people
                teams_table.patch_item(
                    req_json["team"],
                    req_json["team"],
                    patch_operations=[{'op': 'add', 'path': '/members/-', 'value': req_json['id']}],
                    filter_predicate="FROM t WHERE ARRAY_LENGTH(t.members) < 6"
                )
            except CosmosHttpResponseError as e:
                # This means that the team we're trying to add to is already full
                return func.HttpResponse(json.dumps({'code': 'full', 'message': "That team is full"}), status_code=409)
            # The team both has room, and the user was added. Must remove them from their old team
            team = teams_table.read_item(user["team"], user["team"])
            logging.info("team: " + str(team))
            team['members'].remove(user['id'])
            teams_table.upsert_item(team)
        users_table.upsert_item(req_json)
        return func.HttpResponse(json.dumps({'code': "success", 'message': "user updated successfully"}), status_code=200)
    except CosmosHttpResponseError as e:
        # No user entry
        try:
            # Add the user to the team only if there's not already 6 people
            teams_table.patch_item(
                req_json["team"],
                req_json["team"],
                patch_operations=[{'op': 'add', 'path': '/members/-', 'value': req_json['id']}],
                filter_predicate="FROM t WHERE ARRAY_LENGTH(t.members) < 6"
            )
        except CosmosHttpResponseError as e:
            # This means that the team we're trying to add to is already full
            return func.HttpResponse(json.dumps({'code': 'full', 'message': "That team is full"}), status_code=409)
        users_table.upsert_item(req_json)
        return func.HttpResponse(json.dumps({'code': 'success', 'message': 'new user registered'}), status_code=200)

@app.route(route="getTeams", auth_level=func.AuthLevel.ANONYMOUS)
def getTeams(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('getTeams trigger function processed a request.')
    
    client = CosmosClient.from_connection_string(os.environ['COSMOS_CONNECTION_STRING'])
    database = client.get_database_client("Drinking Olympics")
    teams_table = database.get_container_client("teams")
    items = list(teams_table.read_all_items(100))
    return func.HttpResponse(json.dumps(items), status_code=200)
    