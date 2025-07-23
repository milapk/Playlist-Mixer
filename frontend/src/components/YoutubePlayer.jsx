import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import YouTube from "react-youtube";

const YouTubePlayer = forwardRef(({ videoId, onPlayerReady }, ref) => {
    const playerRef = useRef(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false); // Track if the player is ready

    const opts = {
        width: "115",
        height: "100",
        playerVars: {
            autoplay: 1, // Auto play the video
            controls: 0, // Hides all controls
            disablekb: 1, // Disables keyboard controls
            modestbranding: 1, // Hides YouTube logo
            rel: 0, // Prevents related videos at end
            fs: 0, // Hides fullscreen button
        },
    };

    const handleReady = (event) => {
        playerRef.current = event.target; // Save the player instance
        setIsPlayerReady(true); // Mark the player as ready
        if (onPlayerReady) {
            onPlayerReady(event.target);
        }
    };

    const handleStateChange = (event) => {
        if (event.data === 5) {
            // State 5: Video cued but not playing
            if (playerRef.current) {
                playerRef.current.playVideo(); // Ensure playback starts
            }
        }
    };

    useImperativeHandle(ref, () => ({
        seekTo: (seconds) => {
            if (playerRef.current && isPlayerReady) {
                playerRef.current.seekTo(seconds, true); // Seek to the specified timestamp
            }
        },
        getDuration: () => {
            return playerRef.current && isPlayerReady
                ? playerRef.current.getDuration()
                : 1; // Get the video duration
        },
        getCurrentTime: () => {
            return playerRef.current && isPlayerReady
                ? playerRef.current.getCurrentTime()
                : 0; // Get the current playback time
        },
        pause: () => {
            if (playerRef.current && isPlayerReady) {
                playerRef.current.pauseVideo();
            }
        },
        play: () => {
            if (playerRef.current && isPlayerReady) {
                playerRef.current.playVideo();
            }
        },
    }));

    return (
        <YouTube
            videoId={videoId}
            opts={opts}
            onReady={handleReady}
            onStateChange={handleStateChange} // Handle state changes
        />
    );
});

export default YouTubePlayer;
