import * as CryptoJS from 'crypto-js';
import {useEffect, useState} from "react";

export const useFetchData = (params: {path: string; action: string; token: string; data: any}) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const {path, action, token, data} = params;
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(params), token, {}).toString();
        const reqData = {
            data: encryptedData,
            token,
        };

        fetch('https://api.jetcamer.com/scrud', {
            method: 'POST', // HTTP method
            headers: {
                'Content-Type': 'application/json' // Specify the content type
            },
            body: JSON.stringify(reqData) // Convert the data to a JSON string
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the JSON from the response
        })
        .then(data => {
            setLoading(false);
            setData(data);
        })
        .catch(error => {
            setLoading(false);
            setError(error);
        });
    }, [])

    return {
        loading,
        data,
        error
    }
}
