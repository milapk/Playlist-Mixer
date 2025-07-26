import React, { useState, useEffect } from "react";
import api from "../api";
import {
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Box,
    ThemeProvider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../styles/ViewSuggestedSongs.css";

function ViewSuggestSongs() {
    const [suggestedSongs, setSuggestedSongs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const getSuggestedSongs = async () => {
            try {
                const response = await api.get("/api/get-suggested-songs/", {
                    params: {
                        playlist_code: localStorage.getItem("playlist_code"),
                    },
                });
                if (response.status === 200) {
                    const data = response.data.songs;
                    if (Array.isArray(data) && data.length > 0) {
                        setSuggestedSongs([...data]);
                    } else {
                        setSuggestedSongs([]);
                    }
                } else {
                    setSuggestedSongs([]);
                }
            } catch (error) {
                console.error("Error fetching suggested songs:", error);
                setSuggestedSongs([]);
            }
        };
        getSuggestedSongs();
    }, []);

    const handleVote = async (songId) => {
        try {
            const response = await api.post("/api/vote-song/", {
                playlist_code: localStorage.getItem("playlist_code"),
                song_id: songId,
            });
            if (response.status === 200) {
                console.log(response.data.message);
            }
        } catch (error) {
            console.error("error", error);
        }
    };

    const handleBackNavigate = (e) => {
        navigate(`/playlist/${localStorage.getItem("playlist_code")}`);
    };

    return (
        <Box className="suggested-songs-container">
            <Typography variant="h4" className="page-title">
                Suggested Songs
            </Typography>
            <Grid container spacing={2}>
                {suggestedSongs.length > 0 ? (
                    suggestedSongs.map((song, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card className="song-card">
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        className="song-name"
                                    >
                                        {song.song_name}
                                    </Typography>
                                    <Typography
                                        variant="subtitle1"
                                        className="song-artist"
                                    >
                                        Artist: {song.song_artist}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        className="song-duration"
                                    >
                                        Duration: {song.song_duration} seconds
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        className="vote-button"
                                        onClick={() => handleVote(song.song_id)}
                                    >
                                        Vote
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : (
                    <Typography variant="body1" className="no-songs-message">
                        No suggested songs available.
                    </Typography>
                )}
            </Grid>
            <Button
                id="create-button"
                variant="contained"
                color="secondary"
                size="medium"
                onClick={handleBackNavigate}
            >
                Back
            </Button>
        </Box>
    );
}

export default ViewSuggestSongs;
