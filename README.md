
<h1 align="center">
  <br>
  STREAMVIZ
  <br>
</h1>

<h4 align="center">A WebRTC based app to capture Live Video Stream.</h4>

## About The Project

**The tasks completed:**

* Capturing a 720p video feed at 30 frames per second from the device camera.
* On-the-fly uploading of captured frames to a web server.
* Before uploading on-the-fly, the original live feed was segmented into a number of self-contained 3-second-long MP4 segments.
* To deliver the segmented MP4 video feed to the server, use the HTTP POST method.
* Retrieve a list of the uploaded videos available from the web server.
* Streaming live video to the client device during a recording session and storing it on the server for on-demand playback.

## Prerequisites

* npm
  sh
  npm install npm@latest -g
  

* nodemon
  sh
  npm install -g nodemon
  

## Installation

To run the project, follow the below steps:

1. Open Terminal and run the below command.

   sh
   nodemon server.js

## Project File Details

* Index.html - Used bootstrap for styling the DOM elements, also contains two video element one showing the preview of the video and other displaying the recorded video. Also has the section for displaying upload status and database log of the uploaded chunks for the video.
* Script.js - The script.js file has multiple functions essential for the app, an onstart feature to the start button that captures the stream from the camera and configures the video in accordance with the given constrains, a onStop feature to the stop button that stops recording the video on user demand and startIntervalForSegments function for stream segmentation every three seconds using setInterval and also a sendFile function to send these chunks to the server, databaseLogger function to display the contents obtained from the SQLite3 database showing videos uploaded using the fetchUploadList function, messageLogger function which displays success message on screen on successfull upload of the file, getName function to return a unique videoID, and displayVideo function to display the uploaded video on the browser.  
* Server.js -  The Server.js file has the server side logic of Express JS server, also it has various API endpoints, one PUT API for uploading the video chunks to a uploads directory inside the unique videoID folder of that video and it also stores it in the database, two GET API one for retrieving databse log of the uploaded video from the database and other API which uses shell Script commands to run FFmpeg command for merging the video chunks stored in the unique videoID directory and merging it to one .mp4 file.
* Database.js - Contains the logic to connect to SQLite3 database. It intializes a connection to the database.

## Team Details
**Team Members:**
- Konark Shah - 40232277
- Het Jatin Dalal - 40200513

**Team Username:**
- Team12

## Tools and Technologies Used

<img align="left" alt="Node.js" width="46px" src="https://img.icons8.com/color/48/000000/nodejs.png" />
<img align="left" alt="Express.js" width="46px" src="https://img.icons8.com/color/48/000000/express.png" />
<img align="left" alt="FFmpeg" width="46px" src="https://img.icons8.com/color/48/000000/ffmpeg.png" />
<img align="left" alt="Bootstrap" width="46px" src="https://img.icons8.com/color/48/000000/bootstrap.png" />
<img align="left" alt="HTML5" width="46px" src="https://img.icons8.com/color/48/000000/html-5.png" />
<img align="left" alt="CSS3" width="46px" src="https://img.icons8.com/color/48/000000/css3.png" />
