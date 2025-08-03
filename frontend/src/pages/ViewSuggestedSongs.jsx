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
import AutoCloseAlert from "../components/AutoCloseAlert";

function ViewSuggestSongs() {
    const [suggestedSongs, setSuggestedSongs] = useState([]);
    const [votesNeeded, setVotesNeeded] = useState(null);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("error");
    const navigate = useNavigate();

    const getSuggestedSongs = async () => {
        try {
            const response = await api.get("/api/get-suggested-songs/", {
                params: {
                    playlist_code: localStorage.getItem("playlist_code"),
                },
            });
            if (response.status === 200) {
                const data = response.data;
                if (Array.isArray(data.songs) && data.songs.length > 0) {
                    setSuggestedSongs([...data.songs]);
                    setVotesNeeded(data.votes_to_add_song);
                } else {
                    setSuggestedSongs([]);
                    setVotesNeeded(null);
                }
            }
        } catch (error) {
            setAlertType("error");
            setAlertMessage(
                "An error occurred when getting suggested songs. Please refresh or try again later!"
            );
            setSuggestedSongs([]);
        }
    };

    useEffect(() => {
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
                getSuggestedSongs();
                setAlertType("success");
                setAlertMessage("Voted for song successfully!");
            }
        } catch (error) {
            setAlertType("error");
            if (error.response && error.response.status === 401) {
                setAlertMessage("You have already voted for this song!");
                getSuggestedSongs();
            } else {
                setAlertMessage(
                    "An error occurred when getting suggested songs. Please refresh or try again later!"
                );
            }
        }
    };

    const handleBackNavigate = (e) => {
        navigate(`/playlist/${localStorage.getItem("playlist_code")}`);
    };

    return (
        <Box className="suggested-songs-container">
            <AutoCloseAlert
                message={alertMessage}
                severity={alertType}
                duration={3000}
                onClose={() => setAlertMessage("")}
            />
            <div id="title">View Suggested Songs</div>
            <Grid container spacing={2}>
                {suggestedSongs.length > 0 ? (
                    suggestedSongs.map((song, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card className="song-card">
                                <CardContent>
                                    <div id="song-name">
                                        <Typography
                                            variant="h6"
                                            className="song-name"
                                        >
                                            {song.song_name}
                                        </Typography>
                                    </div>

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
                                    <Typography
                                        variant="body2"
                                        className="song-votes"
                                    >
                                        Votes: {song.votes} / {votesNeeded}
                                    </Typography>
                                    <div id="vote-button">
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            className="vote-button"
                                            onClick={() =>
                                                handleVote(song.song_id)
                                            }
                                        >
                                            Vote
                                        </Button>
                                    </div>
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
