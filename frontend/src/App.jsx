import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import CreatePlaylist from "./pages/CreatePlaylist";
import JoinPlaylist from "./pages/JoinPlaylist";
import Playlist from "./pages/Playlist";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import SuggestSong from "./pages/SuggestSong";
import ViewSuggestSongs from "./pages/ViewSuggestedSongs";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./styles/theme";
import ErrorBoundary from "./components/ErrorBoundary";

function Logout() {
    localStorage.clear();
    sessionStorage.clear()
    return <Navigate to="/login"></Navigate>;
}

function RegisterAndLogout() {
    localStorage.clear();
    sessionStorage.clear()
    return <Register></Register>;
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                <ErrorBoundary>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<RegisterAndLogout />} />
                        <Route path="/logout" element={<Logout />} />
                        <Route path="/" element={<ProtectedRoute />}>
                            <Route index element={<Home />} />
                            <Route
                                path="/join-playlist"
                                element={<JoinPlaylist />}
                            />
                            <Route
                                path="/playlist/:playlistCode"
                                element={<Playlist />}
                            />
                            <Route
                                path="/create-playlist"
                                element={<CreatePlaylist />}
                            />
                            <Route
                                path="/playlist/:playlistCode/suggest-song"
                                element={<SuggestSong />}
                            />
                            <Route
                                path="/playlist/:playlistCode/vote-for-songs"
                                element={<ViewSuggestSongs />}
                            />
                        </Route>

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </ErrorBoundary>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
