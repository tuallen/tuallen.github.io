// Written by Dor Verbin, October 2021
// This is based on: http://thenewcode.com/364/Interactive-Before-and-After-Video-Comparison-in-HTML5-Canvas
// With additional modifications based on: https://jsfiddle.net/7sk5k4gp/13/

function playVids(videoId) {
    var videoMerge = document.getElementById(videoId + "Merge");
    var vid = document.getElementById(videoId);

    var position = 0.5;
    var vidWidth = vid.videoWidth / 2;
    var vidHeight = vid.videoHeight;

    var mergeContext = videoMerge.getContext("2d");


    if (vid.readyState > 3) {
        vid.play();

        function trackLocation(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.pageX - bcr.x) / bcr.width);
        }
        function trackLocationTouch(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.touches[0].pageX - bcr.x) / bcr.width);
        }

        videoMerge.addEventListener("mousemove", trackLocation, false);
        videoMerge.addEventListener("touchstart", trackLocationTouch, false);
        videoMerge.addEventListener("touchmove", trackLocationTouch, false);

        videoMerge.removeEventListener("click", videoMerge.togglePlayPause);

        videoMerge.togglePlayPause = function () {
            if (vid.paused) {
                vid.play();
            } else {
                vid.pause();
            }
        };

        videoMerge.addEventListener("click", videoMerge.togglePlayPause);


        function drawLoop() {
            const cw = videoMerge.width;
            const ch = videoMerge.height;

            // Clear canvas
            mergeContext.clearRect(0, 0, cw, ch);

            // --- LEFT HALF (scaled) ---
            mergeContext.drawImage(
                vid,
                0, 0, vidWidth, vidHeight,
                0, 0, cw, ch
            );

            const splitX = cw * position;

            // --- RIGHT HALF (scaled) ---
            const srcStart = vidWidth * position;
            const srcWidth = vidWidth - srcStart;
            const dstWidth = cw - splitX;

            mergeContext.drawImage(
                vid,
                vidWidth + srcStart, 0, srcWidth, vidHeight,
                splitX, 0, dstWidth, ch
            );

            // --- SPLIT LINE ---
            mergeContext.beginPath();
            mergeContext.moveTo(splitX, 0);
            mergeContext.lineTo(splitX, ch);
            mergeContext.strokeStyle = "#AAAAAA";
            mergeContext.lineWidth = 3;
            mergeContext.stroke();

            // --- CIRCLE / ARROW (optional — keep yours or remove) ---
            // (omit here for brevity; your original arrow code still works)

            // --- LABEL OVERLAYS (Bulma-style) ---
            const container = videoMerge.parentElement;

            const labelLeft = container.dataset.leftLabel || null;
            const labelRight = container.dataset.rightLabel || null;

            if (labelLeft || labelRight) {
                const fontSize = Math.round(ch * 0.04);   // scales with video height
                const paddingX = fontSize * 0.6;
                const paddingY = fontSize * 0.35;
                const radius = fontSize * 0.6;

                const computedFont = window.getComputedStyle(videoMerge).fontFamily;
                mergeContext.font = `${fontSize}px ${computedFont}`;
                mergeContext.textBaseline = "middle";

                // Helper to draw Bulma-style rounded box
                function drawBubble(text, x, y, alignRight = false) {
                    const textWidth = mergeContext.measureText(text).width;
                    const boxWidth = textWidth + paddingX * 2;
                    const boxHeight = fontSize + paddingY * 2;

                    const rectX = alignRight ? (x - boxWidth) : x;
                    const rectY = y - boxHeight / 2;

                    // Background bubble
                    mergeContext.fillStyle = "rgba(0, 0, 0, 0.55)";
                    mergeContext.beginPath();
                    mergeContext.roundRect(rectX, rectY, boxWidth, boxHeight, radius);
                    mergeContext.fill();

                    // Text
                    mergeContext.fillStyle = "white";
                    mergeContext.fillText(text,
                        rectX + paddingX,
                        rectY + boxHeight / 2
                    );
                }

                // Left bubble
                if (labelLeft) {
                    drawBubble(labelLeft, 15, ch - fontSize * 1.2);
                }

                // Right bubble
                if (labelRight) {
                    drawBubble(labelRight, cw - 15, ch - fontSize * 1.2, true);
                }
            }
            requestAnimationFrame(drawLoop);
        }
        requestAnimationFrame(drawLoop);
    }
}

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};


function resizeAndPlay(element) {
    var cv = document.getElementById(element.id + "Merge");

    // Use the section width (the same width the text uses)
    var container = element.closest("section");
    var containerWidth = container.offsetWidth;

    // Video frame: left half only
    var halfWidth = element.videoWidth / 2;
    var aspectRatio = element.videoHeight / halfWidth;

    // Resize canvas to match text width
    cv.width = containerWidth;
    cv.height = containerWidth * aspectRatio;

    element.play();
    element.style.height = "0px";  // Hide the video, only canvas draws it

    playVids(element.id);
}