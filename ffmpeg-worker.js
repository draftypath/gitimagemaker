// DO NOT use importScripts() here. The FFmpeg library will be loaded dynamically.

// A placeholder for the ffmpeg instance.
let ffmpeg;

self.onmessage = async (event) => {
    const { file, layerId, originalHash } = event.data;

    try {
        // Lazily import the createFFmpeg function when the worker first receives a message.
        // This is a common pattern for libraries not designed as ES modules.
        if (typeof createFFmpeg === 'undefined') {
            // IMPORTANT: This path must be relative to the location of your index.html file.
            // It loads the main-thread script, but we only extract the createFFmpeg function
            // without running the rest of the script in the worker's global scope.
            self.importScripts('./ffmpeg.min.js');
        }

        // Initialize FFmpeg if it hasn't been already.
        if (!ffmpeg) {
            const { createFFmpeg, fetchFile } = self;
            ffmpeg = createFFmpeg({
                log: true,
                // The corePath points to where the worker can find the CORE scripts.
                // This path is relative to the worker file itself.
                corePath: new URL('./ffmpeg-core.js', self.location.href).href,
            });
            await ffmpeg.load();
        }

        const { fetchFile } = self;
        const inputFileName = file.name || 'input.tmp';
        const outputFileName = 'output.mp4';

        // Write the user's file to FFmpeg's virtual file system
        ffmpeg.FS('writeFile', inputFileName, await fetchFile(file));

        // Run the FFmpeg command to create a 720p proxy video
        await ffmpeg.run(
            '-i', inputFileName,
            '-vf', 'scale=w=720:h=-2', // Scale to 720p width
            '-c:v', 'libx264',
            '-preset', 'ultrafast',   // Prioritize speed for proxy creation
            '-crf', '28',             // Good balance of quality/size for previews
            '-an',                    // Remove audio track to reduce size
            outputFileName
        );

        const data = ffmpeg.FS('readFile', outputFileName);
        const optimizedBlob = new Blob([data.buffer], { type: 'video/mp4' });

        // Clean up the virtual file system
        ffmpeg.FS('unlink', inputFileName);
        ffmpeg.FS('unlink', outputFileName);

        // Only use the optimized version if it's actually smaller
        if (optimizedBlob.size < file.size) {
            self.postMessage({ status: 'success', blob: optimizedBlob, layerId, originalHash, wasOptimized: true });
        } else {
            self.postMessage({ status: 'success', blob: file, layerId, originalHash, wasOptimized: false });
        }

    } catch (error) {
        console.error("Error in ffmpeg-worker:", error);
        self.postMessage({ status: 'error', error: error.message, layerId, originalHash });
    }
};