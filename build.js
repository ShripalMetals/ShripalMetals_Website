const express = require("express");
const fs = require("fs");
const path = require("path");
const reactDocs = require("react-docgen");

// The React components to load
const componentFolder = "./src/components/";
// Where the JSON file ends up
const componentJsonPath = "./docs/components.json";
const componentDataArray = [];

// Express setup
const app = express();

// Function to push component data to the array
function pushComponent(component) {
  componentDataArray.push(component);
}

// Function to create the components.json file
function createComponentFile() {
  const componentJsonArray = JSON.stringify(componentDataArray, null, 2);
  fs.writeFile(componentJsonPath, componentJsonArray, "utf8", (err) => {
    if (err) {
      throw err;
    }
    console.log("Created component file");
  });
}

// Function to parse a component using react-docgen
function parseComponent(component, filename) {
  const componentInfo = reactDocs.parse(component);
  const splitIndex = filename.indexOf("/src/");
  const shortname = filename.substring(splitIndex + 4);
  componentInfo.filename = shortname;
  pushComponent(componentInfo);
}

// Function to load a component file and parse it
function loadComponent(file, resolve) {
  fs.readFile(file, (err, data) => {
    if (err) {
      throw err;
    }
    resolve(parseComponent(data, file));
  });
}

// Recursive function to explore a directory and get all files
async function filewalker(dir) {
  const results = [];
  const list = await fs.promises.readdir(dir);

  for (const file of list) {
    const filePath = path.resolve(dir, file);
    const stat = await fs.promises.stat(filePath);

    if (stat && stat.isDirectory()) {
      const res = await filewalker(filePath);
      results.push(...res);
    } else if (
      filePath.endsWith(".js") &&
      !filePath.endsWith(".story.js") &&
      !filePath.endsWith(".test.js")
    ) {
      await new Promise((resolve) => {
        loadComponent(filePath, resolve);
      });
      results.push(filePath);
    }
  }

  return results;
}

// Function to start the Express server
function startServer() {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Serve the React build folder (if applicable)
app.use(express.static(path.join(__dirname, 'build')));

// Route to serve the components metadata JSON file
app.get("/components", (req, res) => {
  res.sendFile(path.resolve(componentJsonPath));
});

// Run the filewalker to parse components and then start the server
filewalker(componentFolder)
  .then(() => {
    createComponentFile();
    startServer(); // Start the server after creating the component file
  })
  .catch((err) => {
    console.error("Error processing components:", err);
  });
