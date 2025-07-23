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


# Create your views here.
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
    
class GetVideoId(APIView):
    permission_classes = [AllowAny]
    def post(self, request, format=None):
        query = request.data.get('query')
        if query:
            api_key = 'AIzaSyAonBdMJl0jJKrnAcrAhxKJTWpCuLoC2k0'  #------------------DO NOT USE THIS IN PRODUCTION------------------
            url = f'https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q={query}&key={api_key}'
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                return Response({'videoId': data['items'][0]['id']['videoId']}, status=status.HTTP_200_OK)
            error_data = response.json()  # Extract error message from the failed response
            return Response({'error': error_data.get('error', {}).get('message', 'YouTube fetch failed')},
                    status=status.HTTP_404_NOT_FOUND)
        return Response({'error': 'Expected "query" in request'}, status=status.HTTP_400_BAD_REQUEST)


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
        else:
            return Response({'error': response['error']}, status=status.HTTP_404_NOT_FOUND)
        
        playlist = PlaylistModel.objects.filter(playlist_code=code).first()
        if not playlist:
            return Response({'error': 'Invalid playlist code'}, status=status.HTTP_404_NOT_FOUND)
        count = SongModel.objects.filter(playlist=playlist, song_id=song_id).count()
        if count > 0:
            return Response({'error': 'Song is already in playlist or is suggested'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(duration)
        request.data['song_duration'] = duration
        request.data['song_id'] = song_id
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

        songs = SongModel.objects.filter(playlist=playlist, voted_in_playlist=False)
        if songs.exists():
            serializer = SongSerializer(songs, many=True)
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
        if songs.exists():
            serializer = SongSerializer(songs, many=True)
            return Response({'songs': serializer.data}, status=status.HTTP_200_OK)
        return Response({'songs': {}}, status=status.HTTP_200_OK)

