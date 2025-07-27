from django.db import models
from django.contrib.auth.models import User

class PlaylistModel(models.Model):
    host = models.OneToOneField(User, on_delete=models.CASCADE)
    playlist_code = models.CharField(max_length=8, unique=True, editable=False)
    votes_to_add_song = models.IntegerField(default=2)

class SongModel(models.Model):
    song_id = models.CharField(unique=False)
    playlist = models.ForeignKey('PlaylistModel', on_delete=models.CASCADE)
    song_name = models.CharField(max_length=100)
    song_artist = models.CharField(max_length=30)
    song_duration = models.IntegerField(default=0)
    song_added = models.DateField(auto_now_add=True)
    votes = models.IntegerField(default=0)
    voted_in_playlist = models.BooleanField(default=False)


class UserVotesModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    playlist = models.ForeignKey('PlaylistModel', on_delete=models.CASCADE)
    song_id = models.CharField(unique=False)
