const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cors = require("cors");

const app = express();
const port = 5000;

// Enable CORS (Allows frontend to send requests)
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Ensure "uploads" folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Handle image upload
app.post("/upload", async (req, res) => {
    try {
        const { category, imageName, imageData } = req.body;

        if (!category || !imageName || !imageData) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const categoryPath = path.join(uploadDir, category);
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
        }

        // Decode Base64 and save image
        const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
        const filePath = path.join(categoryPath, `${imageName}.png`);

        fs.writeFileSync(filePath, base64Data, "base64");

        res.json({ message: "Image saved successfully!", filePath });
    } catch (error) {
        console.error("Error saving image:", error);
        res.status(500).json({ error: "Failed to save image" });
    }
});

// Start the server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
