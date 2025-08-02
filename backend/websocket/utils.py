import redis.asyncio as redis
import os
from api.models import PlaylistModel, SongModel
from api.serializers import SongSerializer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
import random

REDIS_URL = os.environ.get('REDIS_URL')

@database_sync_to_async
def is_host(code, user):
    return PlaylistModel.objects.filter(playlist_code=code, host=user).exists()
    
@database_sync_to_async
def check_playlist_code(code):
    return PlaylistModel.objects.filter(playlist_code=code).exists()

@database_sync_to_async
def get_playlist_songs(code):
    playlist = PlaylistModel.objects.filter(playlist_code=code).first()
    if not playlist:
        return []
    songs = SongModel.objects.filter(playlist=playlist, voted_in_playlist=True)
    if songs.exists():
        serializer = SongSerializer(songs, many=True)
        return serializer.data
    return []

@database_sync_to_async
def get_user(code, token):
    auth = JWTAuthentication()
    try:
        token = auth.get_validated_token(token)

        return auth.get_user(validated_token=token)
    except InvalidToken:
        return None

@database_sync_to_async
def get_next_song(code, current_song=None):
    playlist = PlaylistModel.objects.filter(playlist_code=code).first()
    if playlist:
        songs = list(SongModel.objects.filter(playlist=playlist, voted_in_playlist=True))
        if len(songs) == 1:
            return {'song_id': songs[0].song_id}
        elif len(songs) > 1:
            count = 0
            next_song = random.choice(songs)
            while (next_song.song_id == current_song):
                if count == 3:
                    break
                next_song = random.choice(songs)
                count += 1
            playlist.save()
            return {'song_id': next_song.song_id}
        return {'error': 'No songs in the playlist'}
    return {'error': 'Invalid playlist code'}

async def get_redis():
    return await redis.from_url(url=REDIS_URL, decode_responses=True)

async def get_host(playlist_code):
    r = await get_redis()
    return await r.get(f'playlist:{playlist_code}')

async def set_host(playlist_code, channel_name):
    r = await get_redis()
    await r.set(f'playlist:{playlist_code}', channel_name)
