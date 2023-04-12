var sqlite3 = require('sqlite3').verbose()

const DBSOURCE = "/Users/konarkshah/Documents/GitHub/Video-Recorder/Database/streaming_database.db"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
    //    Error Opening a Database Connection
      console.log("Failed to connect to Database");
      throw err;
    }else{
        console.log('Successfully connected to the Database.');

        db.run(`CREATE TABLE videoDB (
            chunkId text,
            videoId text
        )`,
        (err) => {
            if (err) {
                console.log("Table already created")
            }
        });  
    }
});


module.exports = db