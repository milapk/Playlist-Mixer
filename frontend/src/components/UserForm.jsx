import React, { captureOwnerStack, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/UserForm.css";
import { useNavigate } from "react-router-dom";
import api from "../api";
import AutoCloseAlert from "./AutoCloseAlert";

function UserForm({ type }) {
    const title = type === "LOGIN" ? "Login" : "Register";
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const navigate = useNavigate();

    const usernameChange = (e) => {
        setUsername(e.target.value);
    };
    const passwordChange = (e) => {
        setPassword(e.target.value);
    };

    const login = async () => {
        try {
            const response = await api.post("/api/token/", {
                username,
                password,
            });
            if (response.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, response.data.access);
                localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
                navigate("/");
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                setAlertMessage(
                    "Invalid Username or Password, please try again!"
                );
            } else {
                setAlertMessage("An error occurred. Please try again later.");
            }
        }
    };

    const handleSubmit = async (e) => {
        try {
            if (username === "" || password === "") {
                setAlertMessage("Username or Password cannot be empty!");
                return;
            }
            if (type === "LOGIN") {
                login();
            } else if (type === "REGISTER") {
                const response = await api.post("/api/register/", {
                    username,
                    password,
                });
                if (response.status === 201) {
                    login();
                } else {
                    console.log(response.data.detail);
                }
            }
        } catch (error) {
            if (error.response && error.response.data.username) {
                setAlertMessage(
                    "Username is already taken, please enter another one."
                );
            } else {
                setAlertMessage("An error occurred. Please try again later.");
            }
        }
    };

    const handlePageSwitch = () => {
        if (type === "LOGIN") {
            navigate("/register");
        } else if (type === "REGISTER") {
            navigate("/login");
        }
    };

    return (
        <div id="user-form-root">
            <AutoCloseAlert
                message={alertMessage}
                severity="error"
                duration={3000}
                onClose={() => setAlertMessage("")}
            />
            <div id="user-form-box">
                <div id="title">{title}</div>
                <div id="text-field-">
                    <TextField
                        id="filled-basic"
                        label="Username"
                        variant="filled"
                        size="small"
                        onChange={usernameChange}
                    />
                </div>
                <div id="text-field-">
                    <TextField
                        id="outlined-basic"
                        label="Password"
                        variant="filled"
                        size="small"
                        onChange={passwordChange}
                    />
                </div>

                <Button
                    id="buttons"
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={handleSubmit}
                >
                    {title}
                </Button>

                <Button
                    id="buttons"
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={handlePageSwitch}
                >
                    {type === "LOGIN" ? "No acccount?" : "Have an account?"}
                </Button>
            </div>
        </div>
    );
}

export default UserForm;
