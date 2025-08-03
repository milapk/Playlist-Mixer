import React from "react";
import { useState } from "react";
import { TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/SuggestSong.css";
import AutoCloseAlert from "../components/AutoCloseAlert";

function SuggestSong() {
    const [songName, setSongName] = useState("");
    const [artistName, setArtistName] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("error");
    const navigate = useNavigate();

    const handleBackNavigate = (e) => {
        navigate(`/playlist/${localStorage.getItem("playlist_code")}`);
    };

    const songNameChange = (e) => {
        setSongName(e.target.value);
    };

    const artistNameChange = (e) => {
        setArtistName(e.target.value);
    };

    const handleSuggest = async (e) => {
        if (songName === "" || artistName === "") {
            setAlertType("error");
            setAlertMessage("");
            setAlertMessage("Please enter both song name and artist!");
            return;
        }
        try {
            const response = await api.post(
                "/api/suggest-song/",
                {
                    playlist_code: localStorage.getItem("playlist_code"),
                    song_artist: artistName,
                    song_name: songName,
                },
                { withCredentials: true }
            );
            if (response.status === 201) {
                setAlertType("success");
                setAlertMessage("Song added for suggestion!");
                setArtistName("");
                setSongName("");
            }
        } catch (error) {
            if (error.response && error.response.status === 400) {
                setAlertType("error");
                setAlertMessage(
                    "Song already listed for suggestion or in the playlist!"
                );
            }
        }
    };

    return (
        <div id="suggest-root">
            <AutoCloseAlert
                message={alertMessage}
                severity={alertType}
                duration={3000}
                onClose={() => setAlertMessage("")}
            />
            <div id="suggest-box">
                <h1 id="title">Suggest Song</h1>
                <div id="suggest-text-field-song">
                    <TextField
                        id="filled-basic"
                        label="Song Name"
                        variant="filled"
                        size="small"
                        value={songName}
                        onChange={songNameChange}
                        fullWidth
                    />
                </div>
                <div id="suggest-text-field-artist">
                    <TextField
                        id="filled-basic"
                        label="Artist Name"
                        variant="filled"
                        size="small"
                        value={artistName}
                        onChange={artistNameChange}
                        fullWidth
                    />
                </div>

                <Button
                    id="suggest-button"
                    variant="contained"
                    color="primary"
                    size="medium"
                    onClick={handleSuggest}
                >
                    Suggest Song
                </Button>
                <Button
                    id="suggest-button"
                    variant="contained"
                    color="secondary"
                    size="medium"
                    onClick={handleBackNavigate}
                >
                    Back
                </Button>
            </div>
        </div>
    );
}

export default SuggestSong;
