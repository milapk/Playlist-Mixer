from rest_framework_simplejwt.tokens import RefreshToken
import random, string
import requests
import re
from pathlib import Path
import environ
import os
import base64

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env(
    DEBUG=(bool, False)
)
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

CODE_LENGTH = 8

def get_jwt_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh' : str(refresh),
        'access' : str(refresh.access_token)
    }

def generate_playlist_code():
    return (''.join(random.choices(string.ascii_uppercase + string.digits, k=CODE_LENGTH)))

def get_video_details(song_name, artist_name):
    query = song_name + ' by ' + artist_name + ' official'
    api_key = env('YT_API_KEY')
    url = f'https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q={query}&key={api_key}'

    response = requests.get(url)
    data = response.json()

    if response.status_code == 200:
        video_id = data['items'][0]['id']['videoId']
        url = f'https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id={video_id}&key={api_key}'

        response = requests.get(url)
        data = response.json()

        duration = data['items'][0]['contentDetails']['duration']
        duration = __YTDurationToSeconds(duration)
        song_name, artist_name = __get_song_name_and_artist(song_name, artist_name)        

        return {'videoId': video_id, 'duration': duration, 'song_name': song_name, 'artist_name': artist_name, 'status': '200'}
    return {'error': data.get('error', {}).get('message', 'YouTube fetch failed'), 'status': '404'}

def __get_song_name_and_artist(song_name, artist_name):
    access_token = __get_spotify_access_token()
    url = "https://api.spotify.com/v1/search"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {'q': f'track:"{song_name}" artist:"{artist_name}"', 'type': 'track', 'limit': 1}

    response = requests.get(url, headers=headers, params=params)
    data = response.json()

    if data.get("tracks") and data['tracks']['items']:
        track = data["tracks"]["items"][0]
        song_name = track['name']
        artist_names = ", ".join([artist["name"] for artist in track["artists"]])
        return song_name, artist_names
    return None, None

def __get_spotify_access_token():
    client_id = env('SPOTIFY_CLIENT')
    client_secret = env('SPOTIFY_SECRET')
    auth_str = f"{client_id}:{client_secret}"
    b64_auth_str = base64.b64encode(auth_str.encode()).decode()

    url = "https://accounts.spotify.com/api/token"
    headers = {"Authorization": f"Basic {b64_auth_str}"}
    data = {"grant_type": "client_credentials"}

    response = requests.post(url, headers=headers, data=data)
    response.raise_for_status()
    return response.json()["access_token"]

def __YTDurationToSeconds(duration):
    match = re.match('PT(\d+H)?(\d+M)?(\d+S)?', duration).groups()
    hours = _js_parseInt(match[0]) if match[0] else 0
    minutes = _js_parseInt(match[1]) if match[1] else 0
    seconds = _js_parseInt(match[2]) if match[2] else 0
    return hours * 3600 + minutes * 60 + seconds

def _js_parseInt(string):
    return int(''.join([x for x in string if x.isdigit()]))