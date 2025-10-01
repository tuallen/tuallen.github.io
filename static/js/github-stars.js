// Fetch GitHub stars for projects
fetch("https://api.github.com/repos/tuallen/speede3dgs")
    .then(response => response.json())
    .then(data => {
        document.getElementById("stars-tuallen-speede3dgs").textContent = `★ ${data.stargazers_count}`;
    })
    .catch(error => {
        console.error("Failed to fetch stars for tuallen/speede3dgs", error);
        document.getElementById("stars-tuallen-speede3dgs").textContent = "";
    });

fetch("https://api.github.com/repos/j-alex-hanson/speedy-splat")
    .then(response => response.json())
    .then(data => {
        document.getElementById("stars-j-alex-hanson-speedy-splat").textContent = `★ ${data.stargazers_count}`;
    })
    .catch(error => {
        console.error("Failed to fetch stars for j-alex-hanson/speedy-splat", error);
        document.getElementById("stars-j-alex-hanson-speedy-splat").textContent = "";
    });

fetch("https://api.github.com/repos/j-alex-hanson/gaussian-splatting-pup")
    .then(response => response.json())
    .then(data => {
        document.getElementById("stars-j-alex-hanson-gaussian-splatting-pup").textContent = `★ ${data.stargazers_count}`;
    })
    .catch(error => {
        console.error("Failed to fetch stars for j-alex-hanson/gaussian-splatting-pup", error);
        document.getElementById("stars-j-alex-hanson-gaussian-splatting-pup").textContent = "";
    });