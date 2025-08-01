from rest_framework.views import APIView
from rest_framework.response import Response
import requests
from rest_framework import status
from .serializers import *
from .utils import get_jwt_tokens, get_video_details
from .models import *
from rest_framework.permissions import AllowAny, IsAuthenticated
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, format=None):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_jwt_tokens(user)
            return Response(tokens, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CreateRoomView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, format=None):
        serializer = PlaylistSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            playlist = serializer.save() 
            return Response({'playlist_code': playlist.playlist_code, 'votes_to_add_song' : playlist.votes_to_add_song}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class JoinRoomView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, format=None):
        code = request.data.get('code')
        if code:
            playlist = PlaylistModel.objects.filter(playlist_code=code).first()
            if (playlist):
                playlist_code = playlist.playlist_code
                return Response({'playlist_code': playlist_code, 'votes_to_add_song': playlist.votes_to_add_song}, status=status.HTTP_200_OK)
            return Response({'error': 'Invalid playlist code'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'error': 'Expected "playlist_code" in request'}, status=status.HTTP_400_BAD_REQUEST)
    

class SuggestSong(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        code = request.data.get('playlist_code')
        if not code:
            return Response({'error': 'You must join a playlist to suggest songs'}, status=status.HTTP_400_BAD_REQUEST)
        
        song_name = request.data.get('song_name')
        artist_name = request.data.get('song_artist')
        if not song_name:
            return Response({'error': 'Expected "songName" in request'}, status=status.HTTP_400_BAD_REQUEST)
        if not artist_name:
            return Response({'error': 'Expected "artistName" in request'}, status=status.HTTP_400_BAD_REQUEST)
        
        response = get_video_details(song_name, artist_name)
        if response['status'] == '200':
            song_id = response['videoId']
            duration = response['duration']
            song_name = response['song_name']
            artist_name = response['artist_name']
        else:
            return Response({'error': response['error']}, status=status.HTTP_404_NOT_FOUND)
        
        playlist = PlaylistModel.objects.filter(playlist_code=code).first()
        if not playlist:
            return Response({'error': 'Invalid playlist code'}, status=status.HTTP_404_NOT_FOUND)
        count = SongModel.objects.filter(playlist=playlist, song_id=song_id).count()
        if count > 0:
            return Response({'error': 'Song is already in playlist or is suggested'}, status=status.HTTP_400_BAD_REQUEST)
        
        request.data['song_duration'] = duration
        request.data['song_id'] = song_id
        request.data['song_name'] = song_name
        request.data['song_artist'] = artist_name
        serializer = SongSerializer(data=request.data, context={'playlist': playlist})
        if serializer.is_valid():
            song = serializer.save()
            return Response({'message': 'Suggestion added to playlist'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VoteSong(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, format=None):
        code = request.data.get('playlist_code')
        if not code:
            return Response({'error': 'You must join a playlist to suggest songs'}, status=status.HTTP_400_BAD_REQUEST)
        song_id = request.data.get('song_id')
        if not song_id:
            return Response({'error': 'Expected "songId" in request'}, status=status.HTTP_400_BAD_REQUEST)
        playlist = PlaylistModel.objects.filter(playlist_code=code).first()
        if not playlist:
            return Response({'error': 'Invalid playlist code'}, status=status.HTTP_404_NOT_FOUND)
        song = SongModel.objects.filter(song_id=song_id, playlist=playlist).first()
        if not song:
            return Response({'error': 'This song has not been suggested'}, status=status.HTTP_404_NOT_FOUND)
        
        if UserVotesModel.objects.filter(user=request.user, playlist=playlist, song_id=song_id).exists():
            return Response({'error': 'You have already voted for song'}, status=status.HTTP_401_UNAUTHORIZED)
        
        UserVotesModel.objects.create(user=request.user, playlist=playlist, song_id=song_id)
        song.votes += 1
        if song.votes >= playlist.votes_to_add_song:
            song.voted_in_playlist = True
            channel_layer = get_channel_layer()
            room_group_name = f'playlist_{code}'
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {'type': 'broadcast_playlist_songs', 'code': str(code)}
            )
        song.save()
        return Response({'meassage': 'You have voted for this song'}, status=status.HTTP_200_OK)
    
class GetSuggestedSongs(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        code = request.query_params.get('playlist_code')
        if not code:
            return Response({'error': 'You are not part of any playlist'}, status=status.HTTP_400_BAD_REQUEST)

        playlist = PlaylistModel.objects.filter(playlist_code=code).first()
        if not playlist:
            return Response({'error': 'Invalid playlist code'}, status=status.HTTP_404_NOT_FOUND)

        voted_ids = UserVotesModel.objects.filter(user=request.user, playlist=playlist).values_list('song_id', flat=True)
        unvoted_songs = SongModel.objects.filter(playlist=playlist, voted_in_playlist=False).exclude(song_id__in=voted_ids)
        if unvoted_songs.exists():
            serializer = SongSerializer(unvoted_songs, many=True)
            return Response({'songs': serializer.data}, status=status.HTTP_200_OK)
        return Response({'songs': {}}, status=status.HTTP_200_OK)

class GetSongsInPlaylist(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        code = request.query_params.get('playlist_code')
        if not code:
            return Response({'error': 'You are not part of any playlist'}, status=status.HTTP_400_BAD_REQUEST)

        playlist = PlaylistModel.objects.filter(playlist_code=code).first()
        if not playlist:
            return Response({'error': 'Invalid playlist code'}, status=status.HTTP_404_NOT_FOUND)

        songs = SongModel.objects.filter(playlist=playlist, voted_in_playlist=True)
        username = playlist.host.get_username()
        host = playlist.host == request.user
        if songs.exists():
            serializer = SongSerializer(songs, many=True)
            return Response({'songs': serializer.data, 'username': str(username), 'host': str(host), 'playlist_name': playlist.playlist_name}, status=status.HTTP_200_OK)
        return Response({'songs': {}, 'username': str(username), 'host': str(host), 'playlist_name': playlist.playlist_name}, status=status.HTTP_200_OK)

