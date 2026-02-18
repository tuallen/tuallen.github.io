
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
            var dpr = window.devicePixelRatio || 1;
            const cw = videoMerge.width / dpr;
            const ch = videoMerge.height / dpr;

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

            // --- SPLIT LINE AND HANDLE ---
            mergeContext.save();

            // Shared shadow settings
            mergeContext.shadowColor = "rgba(12, 12, 12, 0.8)"; // Matches box-shadow: 0 0 10px rgb(12, 12, 12)
            mergeContext.shadowBlur = 10;
            mergeContext.shadowOffsetX = 0;
            mergeContext.shadowOffsetY = 0;

            // 1. Vertical Line (Top segment)
            const handleRadius = 20;
            const centerY = ch / 2;

            mergeContext.beginPath();
            mergeContext.moveTo(splitX, 0);
            mergeContext.lineTo(splitX, centerY - handleRadius);
            mergeContext.strokeStyle = "#FFFFFF";
            mergeContext.lineWidth = 2;
            mergeContext.stroke();

            // 1. Vertical Line (Bottom segment)
            mergeContext.beginPath();
            mergeContext.moveTo(splitX, centerY + handleRadius);
            mergeContext.lineTo(splitX, ch);
            mergeContext.stroke();

            // 2. Handle Circle

            mergeContext.beginPath();
            mergeContext.arc(splitX, centerY, handleRadius, 0, 2 * Math.PI);
            mergeContext.strokeStyle = "#FFFFFF";
            mergeContext.lineWidth = 2;
            mergeContext.stroke();
            // Optional: fill background so arrows pop? pup3dgs handle seems transparent but has shadows.
            // Let's keep it transparent for now as per reference CSS which lacks background-color.

            // 3. Arrows (remove shadow for crispness or keep consistent?)
            // pup3dgs arrows are just CSS borders. Let's draw filled triangles.
            mergeContext.fillStyle = "#FFFFFF";

            // Left Arrow (points left)
            // Centered vertically at centerY
            // CSS: left: 50%, margin-left: -17px. Handle width 41. Center is 20.5.
            // So arrow is roughly 3-4px to the left of center?
            // Let's assume arrows are offset by ~8px from center.
            const arrowSize = 6;
            const arrowOffset = 5;

            mergeContext.beginPath();
            // Tip
            mergeContext.moveTo(splitX - arrowOffset - arrowSize, centerY);
            // Top Right
            mergeContext.lineTo(splitX - arrowOffset, centerY - arrowSize);
            // Bottom Right
            mergeContext.lineTo(splitX - arrowOffset, centerY + arrowSize);
            mergeContext.closePath();
            mergeContext.fill();

            // Right Arrow (points right)
            mergeContext.beginPath();
            // Tip
            mergeContext.moveTo(splitX + arrowOffset + arrowSize, centerY);
            // Top Left
            mergeContext.lineTo(splitX + arrowOffset, centerY - arrowSize);
            // Bottom Left
            mergeContext.lineTo(splitX + arrowOffset, centerY + arrowSize);
            mergeContext.closePath();
            mergeContext.fill();

            mergeContext.restore();

            // --- LABEL OVERLAYS (Bulma-style) ---
            const container = videoMerge.parentElement;

            const labelLeft = container.dataset.leftLabel || null;
            const labelRight = container.dataset.rightLabel || null;

            if (labelLeft || labelRight) {
                const isMobile = window.innerWidth <= 960;
                const fontSize = Math.round(ch * (isMobile ? 0.06 : 0.04));   // scales with video height
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
                    drawBubble(labelLeft, 5, ch - fontSize * 1.2);
                }

                // Right bubble
                if (labelRight) {
                    drawBubble(labelRight, cw - 5, ch - fontSize * 1.2, true);
                }
            }
            requestAnimationFrame(drawLoop);
        }
        requestAnimationFrame(drawLoop);
    }
}

function resizeAndPlay(element) {
    var cv = document.getElementById(element.id + "Merge");

    // Use the section width (the same width the text uses)
    var container = element.parentElement;

    // Function to update canvas size
    const updateSize = () => {
        // Calculate available width based on container
        var containerWidth = parseFloat(window.getComputedStyle(container).width);

        // Calculate available height based on viewport (e.g., 80% of window height)
        var maxViewportHeight = window.innerHeight * 0.8;

        // Video frame: left half only (source dimensions)
        var halfWidth = element.videoWidth / 2;
        var aspectRatio = element.videoHeight / halfWidth;

        // Ideal height based on full container width
        var idealHeight = containerWidth * aspectRatio;

        var finalWidth, finalHeight;

        if (idealHeight > maxViewportHeight) {
            // Height constrained
            finalHeight = maxViewportHeight;
            finalWidth = finalHeight / aspectRatio;
        } else {
            // Width constrained
            finalWidth = containerWidth;
            finalHeight = idealHeight;
        }

        // Set canvas internal resolution handling high DPI
        var dpr = window.devicePixelRatio || 1;
        cv.width = finalWidth * dpr;
        cv.height = finalHeight * dpr;

        // Center the canvas if it's narrower than the container via CSS styles
        cv.style.width = finalWidth + "px";
        cv.style.height = finalHeight + "px";
        cv.style.objectFit = "contain";
        cv.style.margin = "0 auto";
        cv.style.display = "block";

        // Scale the context to match the internal resolution
        var ctx = cv.getContext("2d");
        ctx.scale(dpr, dpr);
    };

    // Initial size update
    updateSize();

    element.play();
    element.style.height = "0px";  // Hide the video, only canvas draws it

    playVids(element.id);

    // Add resize listener if not already attached
    if (!element.dataset.resizeListenerAttached) {
        window.addEventListener('resize', updateSize);
        element.dataset.resizeListenerAttached = "true";
    }
}