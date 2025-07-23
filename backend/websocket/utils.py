from api.models import PlaylistModel, SongModel
from api.serializers import SongSerializer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
import random

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
def get_next_song(code):
    playlist = PlaylistModel.objects.filter(playlist_code=code).first()
    if playlist:
        songs = list(SongModel.objects.filter(playlist=playlist, voted_in_playlist=True))
        if songs:
            next_song = random.choice(songs)  # Pick a random song
            playlist.current_song = next_song
            playlist.save()  # Save the updated playlist
            return {'song_id': next_song.song_id}
        return {'error': 'No songs in the playlist'}
    return {'error': 'Invalid playlist code'}

