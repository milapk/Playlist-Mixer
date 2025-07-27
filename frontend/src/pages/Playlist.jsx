import React, { useState, useEffect, useRef } from "react";
import "../styles/Playlist.css";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Button, IconButton, Slider } from "@mui/material";
import YouTube from "react-youtube";
import { useNavigate } from "react-router-dom";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

function Playlist() {
    const [songProgress, setSongProgess] = useState(0);
    const [videoId, setVideoId] = useState("");
    const [songDuration, setSongDuration] = useState(100);
    const [playstate, setPlayState] = useState("PLAY");
    const [songs, setSongs] = useState([]);
    const [host, setHost] = useState(false);
    const [hostUsername, setHostUsername] = useState('');
    const [numOfSongs, setNumOfSongs] = useState(0);
    const navigate = useNavigate();
    const socketRef = useRef(null);
    const playerRef = useRef(null); 

    useEffect(() => {
        const getSongs = async () => {
            try {
                const response = await api.get("/api/get-playlist-songs/", {
                    params: {
                        playlist_code: localStorage.getItem("playlist_code"),
                    },
                });
                if (response.status === 200) {
                    if (response.data.songs.length > 0){
                        setSongs([...response.data.songs]);
                        setNumOfSongs(response.data.songs.length);
                    } else {
                        setNumOfSongs(0);
                        setSongs([])
                    }
                    setHostUsername(response.data.host)
                } else {
                    setSongs([]);
                    setNumOfSongs(0);
                    setHostUsername(' ')
                }
            } catch (error) {
                setSongs([]);
            }
        };
        getSongs();

        const code = localStorage.getItem("playlist_code");
        if (localStorage.getItem('host') === 'true'){
            setHost(true);
        } else {
            setHost(false)
        }

        const access = localStorage.getItem(ACCESS_TOKEN);
        const socket = new WebSocket(
            `${import.meta.env.VITE_WS_URL}/ws/playlist/${code}/${access}/`
        );
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connected");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.event === "playlist_songs") {
                setSongs([...data.songs]);
                setNumOfSongs(numOfSongs+1)
            } else if (data.event === "next") {
                setVideoId(data.song_id);
                setSongProgess(0);
                if (playerRef.current) {
                    playerRef.current.playVideo();
                }
            } else if (data.event === "previous") {
                setVideoId(data.song_id);
                setSongProgess(0);
                if (playerRef.current) {
                    playerRef.current.playVideo();
                }
            } else if (data.event === "sync") {
                const newValue = data.timestamp;
                setSongProgess(newValue);
                if (playerRef.current) {
                    playerRef.current.seekTo(newValue, true);
                }
            } else if (data.event === "pause") {
                if (playerRef.current) {
                    playerRef.current.pauseVideo();
                }
                setPlayState("PAUSE");
            } else if (data.event === "play") {
                if (playerRef.current) {
                    playerRef.current.playVideo();
                }
                setPlayState("PLAY");
            }
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
        };

        return () => {
            socket.close();
        };
    }, []);

    useEffect(() => {
        let interval = null;

        if (playstate === "PLAY" && playerRef.current) {
            interval = setInterval(() => {
                const currentTime = playerRef.current.getCurrentTime
                    ? playerRef.current.getCurrentTime()
                    : 0;
                setSongProgess(currentTime);
            }, 1000);
        } else {
            clearInterval(interval);
        }

        return () => clearInterval(interval);
    }, [playstate, videoId]);

    useEffect(() => {
        if (playerRef.current) {
            setSongDuration(playerRef.current.getDuration());
        }
    }, [videoId]);

    const handleNextSong = () => {
        socketRef.current.send(
            JSON.stringify({
                event: "playlist_next_song",
                code: localStorage.getItem("playlist_code"),
            })
        );
    };

    const handlePreviousSong = () => {
        socketRef.current.send(
            JSON.stringify({
                event: "playlist_previous_song",
                code: localStorage.getItem("playlist_code"),
            })
        );
    };

    const handlePauseSong = () => {
        socketRef.current.send(
            JSON.stringify({
                event: "playlist_pause",
                timestamp: songProgress,
                code: localStorage.getItem("playlist_code"),
            })
        );
    };

    const handlePlaySong = () => {
        socketRef.current.send(
            JSON.stringify({
                event: "playlist_play",
                timestamp: songProgress,
                code: localStorage.getItem("playlist_code"),
            })
        );
    };

    const handleSongDurationChange = (e, newValue) => {
        socketRef.current.send(
            JSON.stringify({
                event: "playlist_sync",
                timestamp: newValue,
                code: localStorage.getItem("playlist_code"),
            })
        );
    };

    const handleSongSuggest = () => {
        navigate(
            `/playlist/${localStorage.getItem("playlist_code")}/suggest-song`
        );
    };

    const handleViewSongSuggest = () => {
        navigate(
            `/playlist/${localStorage.getItem("playlist_code")}/vote-for-songs`
        );
    };

    const handlePlayerReady = (event) => {
        playerRef.current = event.target;
        setSongDuration(event.target.getDuration());
    };

    const handlePlayerStateChange = (event) => {
        const status = event.data;
        console.log('Player State Changed: ' + status);

        if (status === 0) {
            handleNextSong();
        } if (status === 5) {
            playerRef.current.playVideo()
        }
    };

    return (
        <div id="playlist-root">
            <div id="playlist-top">
                <SimpleBar style={{ maxHeight: "100%" }}>
                    <h1 id="playlist-title">Playlist Name</h1>
                    <div id="playlist-description">Creator: {hostUsername}</div>
                    <div id="playlist-description">{numOfSongs} songs</div>
                    <div id="playlist-song-table">
                        <div id="playlist-table-header">
                            <div>#</div>
                            <div>Title</div>
                            <div>Artist</div>
                            <div>Date Added</div>
                            <div>Duration</div>
                        </div>
                        {songs.map((song, index) => (
                            <div key={index} className="playlist-table-row">
                                <div>{index + 1}</div>
                                <div>{song.song_name}</div>
                                <div>{song.song_artist}</div>
                                <div>{song.song_added}</div>
                                <div>
                                    {Math.floor(song.song_duration / 60)}:
                                    {String(song.song_duration % 60).padStart(
                                        2,
                                        "0"
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </SimpleBar>
            </div>

            <div id="playlist-bottom">
                <div id="playlist-yt-player">
                    <div id="playlist-blocker"></div>
                    <YouTube
                        videoId={videoId}
                        opts={{
                            width: "115",
                            height: "100",
                            playerVars: {
                                autoplay: 0,
                                controls: 0,
                                disablekb: 1,
                                modestbranding: 1,
                                rel: 0,
                                fs: 0,
                            },
                        }}
                        onReady={handlePlayerReady}
                        onStateChange={handlePlayerStateChange}
                    />
                </div>
                <div id="playlist-controller">
                    <div id="playlist-controller-buttons">
                        <IconButton
                            color="primary"
                            onClick={handlePreviousSong}
                            disabled={host === false}
                        >
                            <SkipPreviousIcon />
                        </IconButton>
                        {playstate === "PLAY" ? (
                            <IconButton
                                color="primary"
                                onClick={handlePauseSong}
                                disabled={host === false}
                            >
                                <PauseIcon />
                            </IconButton>
                        ) : (
                            <IconButton
                                color="primary"
                                onClick={handlePlaySong}
                                disabled={host === false}
                            >
                                <PlayArrowIcon />
                            </IconButton>
                        )}
                        <IconButton color="primary" onClick={handleNextSong} disabled={host === false}>
                            <SkipNextIcon />
                        </IconButton>
                    </div>
                    <div id="playlist-progess-bar">
                        <Slider
                            color="primary"
                            size="small"
                            defaultValue={0}
                            value={songProgress}
                            max={songDuration}
                            onChange={handleSongDurationChange}
                            disabled={host === false}
                        />
                    </div>
                </div>
                <div id="playlist-suggest-div">
                    <div id="playlist-suggest-button">
                        <Button
                            id="suggest-button"
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleSongSuggest}
                        >
                            Suggest Song
                        </Button>
                    </div>
                    <div id="playlist-suggest-button">
                        <Button
                            id="suggest-button"
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleViewSongSuggest}
                        >
                            Vote Song
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Playlist;
