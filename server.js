const express = require('express');
const path = require('path');
var crypto = require('crypto');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
var db = require("./database.js")

var generate_key = function () {
  return crypto.randomBytes(16).toString('base64');
};

const fs = require('fs')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')

const app = express();

const { exec } = require("child_process");
const port = process.env.PORT || 3000;

app.use(express.static('static'));
app.use(cookieParser());
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded())
app.use(bodyParser.json())
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}))

// generates cookie and sets chunkID initally and then displays index.html
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

//PUT request of chunks and here we make the directory of each videoID name inside uploads directory
app.put('/api/upload', (req, res) => {
  const videoID = req.body.name;
  const file = req.files.file;
  const chunkID = req.body.chunk;

  let [directoryName, fileName] = UniqueDirectoryChunkCreator(req.body.name, req.body.chunk)

  db.all(`SELECT * FROM videoDB WHERE chunkID = ? AND videoID = ?`, [chunkID, videoID],
    (err, rows) => {

      if(err) {
        console.log(err)
      }
      
      if(rows.length==0) {
        db.run(`INSERT INTO videoDB (chunkID, videoID) VALUES (?, ?)`, [chunkID, videoID], (err) => {
          if (err) {
            console.log(err)
          }
        })
      }
    })

  directoryName = '.' + directoryName
  fileName = '.' + fileName

  fs.promises.mkdir(directoryName, { recursive: true })
    .then(
      file.mv(fileName)
    )
    .catch((err) => {
      console.log("In Catch Block");
      console.log(err);
    })

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end('Upload\n')
})

//is called once recording starts and pushes the chunks in uploads directory
const UniqueDirectoryChunkCreator = (name, chunk) => {
    const directoryName = `/uploads/${name}`
    const fileName = `${directoryName}/${chunk}.mp4`
    return [directoryName, fileName]
}

//to GET the list of uploaded videos from their chunkID and videoID
app.get('/api/list', (req, res) => {

  let chunkID = req.cookies.chunkID;

  db.all(`SELECT * FROM videoDB WHERE chunkID = ?`, [chunkID],
    (err, rows) => {
      if (err) {
        console.log(err)
      }

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.json(rows)
    }
  )
})

//to GET the uploaded list from videoDB table in SQL
app.get('/api/uploaded_list', (req, res) => {

  let chunkID = req.cookies.chunkID;

  db.all(`SELECT * FROM videoDB`,
    (err, rows) => {
      if (err) {
        console.log(err)
      }

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.json(rows)
    }
  )
})

//FFmpeg logic to retrieve all chunks from uploads directory using unique videoID and merge them in a single mp4 file
app.get('/api/run/:id', (req, res) => {
  const uniqueVideoID = req.params.id;

  var scriptCommand = `cd ./uploads/${uniqueVideoID} ;
  find . -name "*.mp4" -type f -print0 | sort -z |
  
  while IFS= read -r -d '' file; 
    do echo "file '$file' " >> fileList.txt;
  done`;

  var ffmpeg = `cd ./uploads/${uniqueVideoID} ; ffmpeg -f concat -safe 0 -i fileList.txt -c copy ${uniqueVideoID}.mp4`;

    exec(`${scriptCommand}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.send('some error happened: 😭');
    }

    exec(`${ffmpeg}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.send('some error happened: 😭');
      }

    });

    return res.status(200).send(stdout);
  });

});


//to GET the merged video and display in the browser
app.get('/api/:videoID', (req, res) => {
  const videoID = req.params.videoID;
  const filePath = `./uploads/${videoID}/${videoID}.mp4`;
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, headers);
    file.pipe(res);
  } else {
    const headers = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  }
});

app.get('/api/uploaded_list', (req, res) => {

    db.all(`SELECT * FROM videoDB`,
      (err, rows) => {
  
        if (err) {
          console.log(err);
        }
  
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(rows));
      }
    )
  })

app.listen(port);
console.log('Server started at http://localhost:' + port);