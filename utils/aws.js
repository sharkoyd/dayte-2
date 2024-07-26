const axios = require('axios');

async function fetchLandmarks(coordinates) {
    try {
        const response = await axios.post('https://1owdls1nxb.execute-api.eu-north-1.amazonaws.com/testing', {
            coordinates: coordinates,
            radius: 1000 // or whatever radius you need
        });
        console.log('Landmarks:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching landmarks:', error);
    }
}

module.exports = {
    fetchLandmarks
  };
  
