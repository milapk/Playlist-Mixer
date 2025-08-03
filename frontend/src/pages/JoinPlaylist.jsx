import React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import "../styles/JoinPlaylist.css";
import { useNavigate } from "react-router-dom";
import api from "../api";
import AutoCloseAlert from "../components/AutoCloseAlert";

function JoinPlaylist() {
    const [code, setCode] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const navigate = useNavigate();

    const codeChange = (e) => {
        setCode(e.target.value);
    };
    const handleJoinPlaylist = async (e) => {
        try {
            if (code.length !== 8) {
                setAlertMessage("Playlist Code must be 8 characters long!");
                return;
            }
            const response = await api.post("/api/join-room/", { code });
            if (response.status === 200) {
                localStorage.setItem(
                    "playlist_code",
                    response.data.playlist_code
                );
                navigate(`/playlist/${localStorage.getItem("playlist_code")}/`);
            } 
        } catch (error) {
            if (error.response && error.response.status === 404){
                setAlertMessage('Invalid Playlist Code!')
            }
        }
    };

    const handleHomeNavigate = (e) => {
        navigate("/");
    };

    return (
        <div id="join-root">
            <AutoCloseAlert
                message={alertMessage}
                severity="error"
                duration={3000}
                onClose={() => setAlertMessage("")}
            />
            <div id="join-box">
                <h1>Join playlist</h1>
                <div id="join-text-field">
                    <TextField
                        id="filled-basic"
                        label="Code"
                        variant="filled"
                        size="small"
                        onChange={codeChange}
                        helperText="Enter 8 character playlist code"
                        fullWidth
                    />
                </div>

                <Button
                    id="join-button"
                    variant="contained"
                    color="primary"
                    size="medium"
                    onClick={handleJoinPlaylist}
                >
                    Join Playlist
                </Button>
                <Button
                    id="join-button"
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

export default JoinPlaylist;
