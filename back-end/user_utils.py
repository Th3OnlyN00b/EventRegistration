from utils import get_db_container_client
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Literal

def remove_event_from_user(user_id: str, event_id: str, role: Literal["own", "host", "attend"]) -> dict[str, str|bool]:
    """
    Removes an event from a user's profile for the role passed in.

    Parameters
    -----------
    user_id `str`: The id of the user to remove this event from.\\
    event_id `str`: The id of the event to remove from this user.\\
    role `str`: Must be either `"own"`, `"host"`, or `"attend"`. Represents the role this user has in this event.

    Returns
    -----------
    The event removed from this user in the format `{'id': "event id string", 'public': True|False}`.
    """
    events_by_user_table = get_db_container_client('auth', 'events_by_user') # TODO: Change this out of auth once we leave free tier
    user_record = events_by_user_table.read_item(user_id, user_id)
    # Add this event to the user's owned list
    i = 0
    while i < len(user_record[role]):
        if user_record[role][i]['id'] == event_id:
            break
        i += 1
    if i == len(user_record[role]):
        # This means someone is trying to access a profile they have no right to access.
        raise Exception("This should absolutely never happen and means that we're having a big breach of security. There is no breach at this time, but fix the damn code!")
    # We now know the index of the item in the old user's list. Time to patch the two of them!
    record = user_record[role][i]
    user_record[role].remove(i)
    events_by_user_table.upsert_item(user_record)
    return record

def add_event_to_user(user_id: str, event: dict[str, str|bool], role: Literal["own", "host", "attend"]) -> None:
    """
    Adds an event to a user's profile for the role passed in.

    Parameters
    -----------
    user_id `str`: The id of the user to add this event to.\\
    event_id `dict[str, str|bool]`: The event to add to this user. Should be in the format `{'id': "event id string", 'public': True|False}`.\\
    role `str`: Must be either `"own"`, `"host"`, or `"attend"`. Represents the role this user should have in this event.
    """
    events_by_user_table = get_db_container_client('auth', 'events_by_user') # TODO: Change this out of auth once we leave free tier
    try:
        user_record = events_by_user_table.read_item(user_id, user_id)
    except CosmosResourceNotFoundError:
        user_record = {'id': user_id, 'own': [], 'host': [], 'attend': []}
    user_record[role].append(event)
    events_by_user_table.upsert_item(user_record)

def create_user_event_record(event_id: str, public: bool) -> dict[str,str|bool]:
    """
    Creates new user event record for the user account storage from the event id and the public setting.
    
    Parameters
    -----------
    event_id `str`: The id for the event to create the record for.\\
    public `bool`: If this event is public. Should match what is stored in the `events` table.

    Returns
    -----------
    A dictionary in the format for a user's event record.
    """
    return {'id': event_id, 'public': public}
