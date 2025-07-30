from django.contrib.auth.models import User
from rest_framework import serializers
from .models import PlaylistModel, SongModel, UserVotesModel
from .utils import generate_playlist_code

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ('username', 'password')

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
    
class PlaylistSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaylistModel
        fields = ('host', 'playlist_code', 'votes_to_add_song', 'playlist_name')
        extra_kwargs = {
            'host' : {'read_only': True},
            'playlist_code': {'read_only': True},
        }

    def create(self, validated_data):
        validated_data['host'] = self.context['request'].user

        uniqueCode = False
        while not uniqueCode:
            code = generate_playlist_code()
            if not PlaylistModel.objects.filter(playlist_code=code).exists():
                validated_data['playlist_code'] = code
                return PlaylistModel.objects.create(**validated_data)

class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = SongModel
        fields = ['song_id', 'playlist', 'song_name', 'song_artist', 'song_duration', 'song_added', 'votes', 'voted_in_playlist']
        extra_kwargs = {
            'playlist': {'read_only': True},
            'votes': {'read_only': True},
            'voted_in_playlist' : {'read_only': True},
        }

    def create(self, validated_data):
        validated_data['playlist'] = self.context['playlist']
        return SongModel.objects.create(**validated_data)

class UserVotesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserVotesModel
        fields = ['playlist', 'user', 'song_id']
        extra_kwargs = {
            'playlist': {'read_only': True},
            'user' : {'read_only': True},
        }
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['playlist'] = self.context['playlist']
        return super().create(validated_data)