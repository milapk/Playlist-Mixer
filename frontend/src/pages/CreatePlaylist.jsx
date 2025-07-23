import React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import "../styles/CreatePlaylist.css";
import { useNavigate } from "react-router-dom";
import api from "../api";

function CreatePlaylist() {
    const [votes, setVotes] = useState("");
    const navigate = useNavigate();

    const voteChange = (e) => {
        setVotes(e.target.value);
    };
    const handleCreatePlaylist = async (e) => {
        const votes1 = votes;

        const response = await api.post("/api/create-room/", {
            votes_to_add_song: votes,
        });
        if (response.status === 201) {
            localStorage.setItem("playlist_code", response.data.playlist_code);

            navigate(`/playlist/${localStorage.getItem("playlist_code")}/`);
        } else {
            console.error(response.detail);
        }
    };

    const handleHomeNavigate = (e) => {
        navigate("/");
    };

    return (
        <div id="create-root">
            <div id="create-box">
                <h1>Create playlist</h1>
                <div id="create-text-field">
                    <TextField
                        id="filled-basic"
                        label="Votes"
                        variant="filled"
                        type="number"
                        size="small"
                        onChange={voteChange}
                        helperText="Enter number of votes"
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
                    Join Playlist
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
