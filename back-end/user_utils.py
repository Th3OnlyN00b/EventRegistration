from utils import get_db_container_client
from azure.cosmos.exceptions import CosmosHttpResponseError, CosmosResourceNotFoundError
import uuid as uuid_package
from enum import Enum

class Role(Enum):
    OWNER = "own"
    HOST = "host"
    ATTENDEE = "attend"
    INVITED = "invited"
    NONE = "none"
    
    @staticmethod
    def roles_above(role: 'Role') -> list['Role']:
        """
        Gets all roles with permissions above the role passed in.

        Parameters
        -----------
        role `Role`: The role to get all roles above.

        Returns
        -----------
        A list of all Role values with permissions above the role passed in.
        """
        return list(Role)[:list(Role).index(role)]
    
    @staticmethod
    def roles_above_and_including(role: 'Role') -> list['Role']:
        """
        Gets all roles with permissions above and including the role passed in.

        Parameters
        -----------
        role `Role`: The role to get all roles above (including the one passed in).

        Returns
        -----------
        A list of all Role values with permissions above the role passed in.
        """
        return list(Role)[:list(Role).index(role)+1]
    
    @staticmethod
    def roles_above_and_including_str(role: 'Role') -> list[str]:
        """
        Gets all roles with permissions above and including the role passed in.

        Parameters
        -----------
        role `Role`: The role to get all roles above (including the one passed in).

        Returns
        -----------
        A list of all Role names with permissions above the role passed in as strings.
        """
        return [r.name for r in list(Role)[:list(Role).index(role)+1]]

def remove_user_event(user_id: str, event_id: str) -> None:
    """
    Removes an event connection from a user to an event.

    Parameters
    -----------
    user_id `str`: The id of the user to remove this event from.\\
    event_id `str`: The id of the event to remove from this user.\\
    role `str`: Must be either `"own"`, `"host"`, or `"attend"`. Represents the role this user has in this event.
    """
    event_connections = get_db_container_client('auth', 'event_connections') # TODO: Change this out of auth once we leave free tier
    user_connections = get_db_container_client('auth', 'user_connections') # TODO: Change this out of auth once we leave free tier
    # NOTE: Hierarchical partition keys are currently in beta for python. This may be changed on full release
    event_connections.delete_item(event_id, partition_key=[event_id, user_id])
    user_connections.delete_item(user_id, partition_key=[user_id, event_id])

def upsert_user_event(user_id: str, event_id: str, role: Role) -> None:
    """
    Adds an event connection from a user to an event.

    Parameters
    -----------
    user_id `str`: The id of the user to add this event to.\\
    event_id `str`: The event to add to this user.\\
    role `Role`: Represents the role this user should have in this event.
    """
    event_connections = get_db_container_client('auth', 'event_connections') # TODO: Change this out of auth once we leave free tier
    user_connections = get_db_container_client('auth', 'user_connections') # TODO: Change this out of auth once we leave free tier
    event_connections.upsert_item(body=dict(
        id=event_id,
        user_id=user_id,
        event_id=event_id,
        role=role.name
    ))
    user_connections.upsert_item(body=dict(
        id=user_id,
        user_id=user_id,
        event_id=event_id,
        role=role.name
    ))

def get_user_event(user_id: str, event_id: str) -> Role:
    """
    Gets an event connection from a user to an event and returns that user's Role.

    Parameters
    -----------
    user_id `str`: The id of the user to add this event to.\\
    event_id `str`: The event to add to this user.

    Returns
    -----------
    The role this user_id has in this event 
    """
    event_connections = get_db_container_client('auth', 'event_connections') # TODO: Change this out of auth once we leave free tier
    try:
        return Role[event_connections.read_item(user_id, partition_key=[event_id, user_id])['role']]
    except CosmosResourceNotFoundError:
        return Role.NONE

def get_or_create_user(phone: str) -> str:
    """
    Creates a new user entity and adds it to the database of user ids. Generates a new UUID automatically.

    Parameters
    -----------
    phone `str`: The phone number for the new user to be created.

    Returns
    -----------
    The UUID of the user created.
    """
    # Get the user ID so we're storing the IDs instead of the phone #
    id_table = get_db_container_client("auth", "ids") # TODO: Change this from the 'auth' database once we leave Azure free tier
    try:
        uuid = id_table.read_item(phone, phone)['uuid']
    except CosmosHttpResponseError:
        uuid = str(uuid_package.uuid4())
        id_table.create_item({'id': phone, 'uuid': uuid})
    return uuid
