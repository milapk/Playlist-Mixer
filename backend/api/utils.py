from rest_framework_simplejwt.tokens import RefreshToken
import random, string
import requests
import re
from pathlib import Path
import environ
import os

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
        url = f'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id={video_id}&key={api_key}'
        response = requests.get(url)
        data = response.json()
        duration = data['items'][0]['contentDetails']['duration']
        duration = YTDurationToSeconds(duration)
        return {'videoId': video_id, 'duration': duration, 'status': '200'}
    return {'error': data.get('error', {}).get('message', 'YouTube fetch failed'), 'status': '404'}

def YTDurationToSeconds(duration):
  match = re.match('PT(\d+H)?(\d+M)?(\d+S)?', duration).groups()
  hours = _js_parseInt(match[0]) if match[0] else 0
  minutes = _js_parseInt(match[1]) if match[1] else 0
  seconds = _js_parseInt(match[2]) if match[2] else 0
  return hours * 3600 + minutes * 60 + seconds

def _js_parseInt(string):
    return int(''.join([x for x in string if x.isdigit()]))