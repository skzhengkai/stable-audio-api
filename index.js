const { generateAudio } = require('./stable_audio');

const main = async () => {
    await generateAudio('electronic dance music', 180, 123);
};

main();