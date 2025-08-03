import React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import "../styles/CreatePlaylist.css";
import { useNavigate } from "react-router-dom";
import api from "../api";
import AutoCloseAlert from "../components/AutoCloseAlert";

function CreatePlaylist() {
    const [votes, setVotes] = useState("");
    const [name, setName] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const navigate = useNavigate();

    const voteChange = (e) => {
        setVotes(e.target.value);
    };
    const nameChange = (e) => {
        setName(e.target.value);
    };
    const handleCreatePlaylist = async (e) => {
        try {
            if (votes === "" || name === "") {
                setAlertMessage("Votes or Playlist Name cant be empty!");
                return;
            }
            const response = await api.post("/api/create-room/", {
                votes_to_add_song: votes,
                playlist_name: name,
            });
            if (response.status === 201) {
                localStorage.setItem(
                    "playlist_code",
                    response.data.playlist_code
                );
                navigate(`/playlist/${localStorage.getItem("playlist_code")}/`);
            }
        } catch (error) {}
    };

    const handleHomeNavigate = (e) => {
        navigate("/");
    };

    return (
        <div id="create-root">
            <AutoCloseAlert
                message={alertMessage}
                severity="error"
                duration={3000}
                onClose={() => setAlertMessage("")}
            />
            <div id="create-box">
                <h1>Create playlist</h1>
                <div id="create-text-field">
                    <TextField
                        id="filled-basic"
                        label="Playlist Name"
                        variant="filled"
                        size="small"
                        onChange={nameChange}
                        fullWidth
                    />
                </div>
                <div id="create-text-field">
                    <TextField
                        id="filled-basic"
                        label="Votes"
                        variant="filled"
                        type="number"
                        size="small"
                        onChange={voteChange}
                        helperText="Votes needed to add song to playlist"
                        fullWidth
                    />
                </div>

                <Button
                    id="create-button"
                    variant="contained"
                    color="primary"
                    size="medium"
                    onClick={handleCreatePlaylist}
                >
                    Create Playlist
                </Button>
                <Button
                    id="create-button"
                    variant="contained"
                    color="secondary"
                    size="medium"
                    onClick={handleHomeNavigate}
                >
                    Home
                </Button>
            </div>
        </div>
    );
}

export default CreatePlaylist;
