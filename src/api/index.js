import axios from "axios";

const instance = axios.create({
    baseURL: 'https://rapid-translate-multi-traduction.p.rapidapi.com',
    headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': process.env.REACT_APP_RAPID_API_KEY,
        'X-RapidAPI-Host': 'rapid-translate-multi-traduction.p.rapidapi.com'
    },
})

export default instance;