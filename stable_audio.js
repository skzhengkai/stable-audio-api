const axios = require('axios');
const fs = require('fs');
const path = require('path');

const downloadFile = async (url, filePath) => {
  try {
    // Read the token from the token.json file
    const tokenData = JSON.parse(fs.readFileSync(path.join(__dirname, 'token.json'), 'utf8'));
    const token = tokenData.token;
    let response;
    let retryCount = 0;
    const maxRetries = 50;
    const retryDelay = 3000; // 3 seconds

    while (retryCount < maxRetries) {
      response = await axios({
        url: url,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        responseType: 'stream'
      });

      if (response.status === 200) {
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        console.log('File downloaded successfully!');
        return;
      } else if (response.status === 202) {
        console.log('Generation in progress, retrying in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryCount++;
      } else {
        console.error('Error downloading file:', response.status);
        return;
      }
    }

    console.error('Maximum number of retries reached, unable to download file.');
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};

const generateAudio = async (prompt, lengthSeconds = 178, seed = 123) => {
  try {
    const tokenData = JSON.parse(fs.readFileSync(path.join(__dirname, 'token.json'), 'utf8'));
    const token = tokenData.token;
    const options = {
        method: 'POST',
        url: 'https://api.stableaudio.com/v1alpha/generations/stable-audio-audiosparx-v2-0/text-to-music',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        data: {
            "data": {
                "type": "generations",
                "attributes": {
                    "prompts": [
                    {
                        "text": prompt,
                        "weight": 1
                    }
                    ],
                    "length_seconds": lengthSeconds,
                    "seed": seed
                }
            }
        }
    };

    const response = await axios(options);
    console.log(`Status Code: ${response.status}`);

    // Extract the result URL from the response
    const resultUrl = response.data.data[0].links.result;

    // Download the result file
    const filePath = path.join(__dirname, 'audio_file.mp3');
    await downloadFile(resultUrl, filePath);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

module.exports = { generateAudio };