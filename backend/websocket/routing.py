from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path("ws/playlist/<slug:code>/<path:token>/", consumers.PlaylistConsumer.as_asgi()),
]