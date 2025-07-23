import React, { captureOwnerStack, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/UserForm.css";
import { useNavigate } from "react-router-dom";
import api from "../api";

function UserForm({ type }) {
    const title = type === "LOGIN" ? "Login" : "Register";
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const usernameChange = (e) => {
        setUsername(e.target.value);
    };
    const passwordChange = (e) => {
        setPassword(e.target.value);
    };

    const login = async () => {
        const response = await api.post("/api/token/", {
            username,
            password,
        });
        if (response.status === 200) {
            localStorage.setItem(ACCESS_TOKEN, response.data.access);
            localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
            console.log(response.data);
            navigate("/");
        } else {
            console.log(response.data.detail);
        }
    };

    const handleSubmit = async (e) => {
        try {
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
            console.log(error);
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
