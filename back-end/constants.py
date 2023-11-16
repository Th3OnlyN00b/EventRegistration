import os
import string
# What is our product named (display name)
PLATFORM_NAME = "Untitled Event Planner"
# What alphabet should url-safe random values be pulled from
ALPHABET = string.ascii_lowercase + string.digits
# How many times should we try to regenerate a random ID if it has a collision
MAX_RANDOM_RETRIES_EVENTS = 5
# Some information for the texting API (currently Twilio)
TEXTING_API = {
    'account_sid': "ACe5273252a62a877177ef449eeed79d20", # Twilio API account ID
    'auth_token': os.environ["TWILIO_AUTH_TOKEN"], # Twilio's API token. Stored as a env variable
    'outgoing_number': '+18444201362' # The number from which all outgoing texts are sent from
}
# Name of the azure storage blob container for event images
EVENT_IMAGES_BLOB_CONTAINER_NAME = "event-images"
# Which fields should be publicly visible
EVENT_PUBLICLY_VISIBLE_FIELDS = {'title', 'description', 'datetime', 'id', 'public'}
EVENT_THUMBNAIL_FIELDS = ['title', 'description', 'datetime', 'id', 'public']

##### Validation vars #####
TITLE_MIN_LENGTH = 2
TITLE_MAX_LENGTH = 32
DESCRIPTION_MAX_LENGTH = 1024