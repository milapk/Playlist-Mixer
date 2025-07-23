from django.db import models
from django.contrib.auth.models import User

class PlaylistModel(models.Model):
    host = models.OneToOneField(User, on_delete=models.CASCADE)
    playlist_code = models.CharField(max_length=8, unique=True, editable=False)
    votes_to_add_song = models.IntegerField(default=2)
    current_song = models.OneToOneField('SongModel', on_delete=models.CASCADE, null=True) # type: ignore
    song_timestamp = models.IntegerField(default=0)

class SongModel(models.Model):
    song_id = models.CharField(unique=False)
    playlist = models.ForeignKey('PlaylistModel', on_delete=models.CASCADE)
    song_name = models.CharField(max_length=100)
    song_artist = models.CharField(max_length=30)
    song_duration = models.IntegerField(default=0)
    votes = models.IntegerField(default=0)
    voted_in_playlist = models.BooleanField(default=False) #Tells you if a song is voted enough to have been added to the playlist
