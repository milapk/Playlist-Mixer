import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import '../styles/Home.css'
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();

    const handleJoinPlaylist = (e) => {
        navigate('/join-playlist')
    }

    const handleCreatePlaylist = (e) => {
        navigate('/create-playlist')
    }
    const handleLogout = (e) => {
        navigate('/logout')
    }
    return (
        <div id="home-root">
            <div id='home-box'>
                <h1 id="title">Mixing Playlists</h1>
                <Button id="button" variant="contained" color="primary" size="medium" onClick={handleJoinPlaylist}>Join Playlist</Button>
                <Button id="button" variant="contained" color="primary" size="medium" onClick={handleCreatePlaylist}>Create Playlist</Button>
                <Button id="button-logout" variant="contained" color="secondary" size="medium" onClick={handleLogout}>Logout</Button>
            </div>
        </div>
    );
}

export default Home;
