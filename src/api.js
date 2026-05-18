// JavaScript source code
import axios from "axios";

const API = axios.create({
    baseURL: "https://localhost:57650/api"
});

export default API;