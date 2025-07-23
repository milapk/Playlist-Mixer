import React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import UserForm from "../components/UserForm";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function Login() {

    return <UserForm type="LOGIN"></UserForm>;
}

export default Login;
