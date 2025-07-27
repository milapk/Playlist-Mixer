from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path, include
from .views import *

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('create-room/', CreateRoomView.as_view(), name='create_room'),
    path('join-room/', JoinRoomView.as_view(), name='join_room'),
    path('suggest-song/', SuggestSong.as_view(), name='suggest_song'),
    path('vote-song/', VoteSong.as_view(), name='vote_song'),
    path('get-suggested-songs/', GetSuggestedSongs.as_view(), name='get_suggested_songs'),
    path('get-playlist-songs/', GetSongsInPlaylist.as_view(), name='get_playlist_songs')
]