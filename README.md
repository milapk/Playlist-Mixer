# 🎵 Playlist Mixer 🎵

Playlist Mixer is a collaborative real-time music playlist web app that allows users to create or join shared playlists, suggest songs, vote on which songs should be added to the playlist(hence the name 'Playlist Mixer'), and listen together in perfect sync.

Built using React and Django, with WebSockets and Redis to support real-time features.


## Deployment
Frontend deployed in vercel and Backend hosted on Render.

[**Try out Playlist Mixer here**](https://playlist-mixers.vercel.app/)

*Note: Backend deployed on a render free plan and will likely take a few minutes to spin-up, so please do wait when logging in or registering.

## Features

- JWT-based authentication
- Create or join a playlist with a unique code
- Suggest songs via YouTube Search
- Vote on suggested songs, songs get added to playlist once a threshold of votes are reached
- Host controls synchronized playback for all members using YouTube IFrame Player
- Real-time updates via WebSockets (Django Channels + Redis)
- Sessions used to track user playlist participation

## Looking Forward

I plan on adding extra features and quality of life improvement.

Such potential feature include but not limited to; leaving a playlist, allowing non-host users to control the player, diplaying song art cover.

Feel free to contribute or suggest new ideas.

## Tech Stack


Frontend: React (Vite) | Axios

Backend: Django(DRF + Django Channels)

Technologies used: WebSockets (via Channels + Redis) | APIs (DRF + YouTube Data API)


## Languages

 Python, JavaScript
 
