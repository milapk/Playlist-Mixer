import React, { useState, useEffect, useRef } from "react";
import "../styles/Playlist.css";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SyncIcon from "@mui/icons-material/Sync";
import { Button, IconButton, Slider } from "@mui/material";
import YouTube from "react-youtube";
import { useNavigate } from "react-router-dom";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import AutoCloseAlert from "../components/AutoCloseAlert";

function Playlist() {
    const [songs, setSongs] = useState([]);
    const [songProgress, setSongProgess] = useState(0);
    const [songDuration, setSongDuration] = useState(100);
    const [videoId, setVideoId] = useState("");
    const [playstate, setPlayState] = useState("PAUSED");
    const [host, setHost] = useState(false);
    const [hostUsername, setHostUsername] = useState("");
    const [playlistName, setPlaylistName] = useState("");
    const [numOfSongs, setNumOfSongs] = useState(0);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("error");
    const socketRef = useRef(null);
    const playerRef = useRef(null);
    const videoIdRef = useRef(videoId);
    const songProgressRef = useRef(songProgress);
    const hostRef = useRef(host);
    const navigate = useNavigate();

    useEffect(() => {
        const initialize = async () => {
            try {
                const response = await api.get("/api/get-playlist-songs/", {
                    params: {
                        playlist_code: localStorage.getItem("playlist_code"),
                    },
                });
                if (response.status === 200) {
                    if (response.data.songs.length > 0) {
                        setSongs([...response.data.songs]);
                        setNumOfSongs(response.data.songs.length);
                    } else {
                        setNumOfSongs(0);
                        setSongs([]);
                        setAlertType("info");
                        setAlertMessage("This playlist is currently empty!");
                    }
                    if (response.data.host === "True") {
                        setHost(true);
                        hostRef.current = true;
                    } else {
                        setHost(false);
                        hostRef.current = false;
                    }
                    setPlaylistName(response.data.playlist_name);
                    setHostUsername(response.data.username);
                }
            } catch (error) {
                setSongs([]);
                setNumOfSongs(0);
                setHostUsername(" ");
                setPlaylistName(" ");
                setAlertType("error");
                if (error.response) {
                    setAlertMessage(
                        "An error occurred when getting suggested songs. Please refresh or try again later!"
                    );
                }
            }

            const code = localStorage.getItem("playlist_code");
            const access = localStorage.getItem(ACCESS_TOKEN);
            const socket = new WebSocket(
                `${import.meta.env.VITE_WS_URL}/ws/playlist/${code}/${access}/`
            );
            socketRef.current = socket;

            socket.onopen = () => {
                console.log("WebSocket connected");
                if (hostRef.current === false) {
                    console.log(hostRef.current);
                    socketRef.current.send(
                        JSON.stringify({
                            event: "playlist_sync_request",
                        })
                    );
                }
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.event === "playlist_songs") {
                    setSongs([...data.songs]);
                    setNumOfSongs(numOfSongs + 1);
                    setAlertType("info");
                    setAlertMessage("New song has been added to the playlist!");
                } else if (data.event === "next" || data.event === "previous") {
                    setVideoId(data.song_id);
                    setSongProgess(0);
                    if (playerRef.current) {
                        playerRef.current.playVideo();
                        playerRef.current.seekTo(0);
                    }
                } else if (data.event === "sync") {
                    const newValue = data.timestamp;
                    if (videoId !== data.song_id) {
                        setVideoId(data.song_id);
                    }
                    setSongProgess(newValue);
                    setPlayState("PLAY");
                    if (playerRef.current) {
                        playerRef.current.seekTo(newValue, true);
                        playerRef.current.playVideo();
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
                } else if (data.event == "sync_request") {
                    socketRef.current.send(
                        JSON.stringify({
                            event: "playlist_sync_user",
                            song_id: videoIdRef.current,
                            timestamp: songProgressRef.current,
                            request_from: data.request_from,
                        })
                    );
                }
            };

            socket.onclose = () => {
                console.log("WebSocket disconnected");
            };
        };

        initialize();

        return () => {
            socketRef.current.close();
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
        videoIdRef.current = videoId;
        if (playerRef.current) {
            setSongDuration(playerRef.current.getDuration());
        }
    }, [videoId]);

    useEffect(() => {
        songProgressRef.current = songProgress;
    }, [songProgress]);

    const handleNextSong = () => {
        setPlayState("PLAY");
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
        if (videoId === "") {
            handleNextSong();
        } else {
            socketRef.current.send(
                JSON.stringify({
                    event: "playlist_play",
                    timestamp: songProgress,
                    code: localStorage.getItem("playlist_code"),
                })
            );
        }
    };

    const handleSongDurationChange = (e, newValue) => {
        socketRef.current.send(
            JSON.stringify({
                event: "playlist_sync",
                timestamp: newValue,
                code: localStorage.getItem("playlist_code"),
                song_id: videoId,
            })
        );
    };

    const handleSync = () => {
        if (host === true) {
            //pass
        } else {
            socketRef.current.send(
                JSON.stringify({
                    event: "playlist_sync_request",
                })
            );
        }
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
        if (status === 0) {
            handleNextSong();
        }
        if (status === 5) {
            playerRef.current.seekTo(songProgress, true);
            playerRef.current.playVideo();
        }
    };

    return (
        <div id="playlist-root">
            <AutoCloseAlert
                message={alertMessage}
                severity={alertType}
                duration={3000}
                onClose={() => setAlertMessage("")}
            />
            <div id="playlist-top">
                <SimpleBar style={{ maxHeight: "100%" }}>
                    <h1 id="playlist-title">{playlistName}</h1>
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
                        <IconButton color="primary" onClick={handleSync}>
                            <SyncIcon />
                        </IconButton>
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
                        <IconButton
                            color="primary"
                            onClick={handleNextSong}
                            disabled={host === false}
                        >
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
