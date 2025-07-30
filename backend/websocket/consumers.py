from channels.generic.websocket import AsyncWebsocketConsumer
from queue import Queue

from .utils import is_host, get_playlist_songs, check_playlist_code, get_user, get_next_song
import json

class PlaylistConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.code = self.scope['url_route']['kwargs']['code']
        self.token = self.scope['url_route']['kwargs']['token']
        self.user = await get_user(self.code, self.token) 
        
        if self.user and await check_playlist_code(self.code): 
            self.is_host = await is_host(self.code, self.user)
            if self.is_host:
                self.song_queue = []
                self.song_queue_index = -1
            self.room_group_name = f'playlist_{self.code}'

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if self.is_host:
            if data.get('event') == 'playlist_next_song':
                self.song_queue_index += 1
                if len(self.song_queue) > 100:
                    self.song_queue.pop(0)
                if self.song_queue_index + 1 > len(self.song_queue):
                    song = await get_next_song(data.get('code'))
                    if song.get('error'):
                        await self.channel_layer.group_send(self.room_group_name, {'type': str(data.get('event')), 'error': song.get('error')})
                    else:
                        self.song_queue.append(song.get('song_id'))
                        await self.channel_layer.group_send(self.room_group_name, {'type': str(data.get('event')), 'song_id': song.get('song_id')})
                else:
                    await self.channel_layer.group_send(self.room_group_name, {'type': str(data.get('event')), 'song_id': self.song_queue[self.song_queue_index]})

            elif data.get('event') == 'playlist_previous_song':
                self.song_queue_index -= 1
                if self.song_queue_index >= 0:
                    await self.channel_layer.group_send(self.room_group_name, {'type': str(data.get('event')), 'song_id': self.song_queue[self.song_queue_index]})
                else:
                    await self.channel_layer.group_send(self.room_group_name, {'type': str(data.get('event')), 'error': 'No previous songs'})
            elif data.get('event') == 'playlist_sync':
                await self.channel_layer.group_send(self.room_group_name, {'type': str(data.get('event')), 'timestamp': data.get('timestamp'), 'song_id': data.get('song_id')})

            else:
                await self.channel_layer.group_send(self.room_group_name, {'type': str(data.get('event')), 'timestamp': data.get('timestamp')})


    async def playlist_next_song(self, event):
        if event.get('error'):
            await self.send(text_data=json.dumps({'event': 'next', 'error': event['error']}))
        else:
            await self.send(text_data=json.dumps({'event': 'next', 'song_id': event['song_id']}))

    async def playlist_previous_song(self, event):
        if event.get('error'):
            await self.send(text_data=json.dumps({'event': 'next', 'error': event['error']}))
        else:
            await self.send(text_data=json.dumps({'event': 'next', 'song_id': event['song_id']}))

    async def playlist_sync(self, event):
        await self.send(text_data=json.dumps({'event': 'sync', 'timestamp': event['timestamp'], 'song_id': event['song_id']}))

    async def playlist_play(self, event):
        await self.send(text_data=json.dumps({'event': 'play', 'timestamp': event['timestamp']}))

    async def playlist_pause(self, event):
        await self.send(text_data=json.dumps({'event': 'pause', 'timestamp': event['timestamp']}))
  
    async def broadcast_playlist_songs(self, event):
        songs = await get_playlist_songs(event['code'])
        await self.send(text_data=json.dumps({'event': 'playlist_songs', 'songs': songs}))