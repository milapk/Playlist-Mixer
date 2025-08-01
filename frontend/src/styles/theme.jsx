import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#1DB954",
        },
        secondary: {
            main: "#00BFA6",
        },
        background: {
            default: "#121212",
            paper: "#181818",
        },
        text: {
            primary: "#FFFFFF",
            secondary: "#B3B3B3",
        },
    },
    typography: {
        fontFamily: "Roboto, sans-serif",
    },
});

export default theme
