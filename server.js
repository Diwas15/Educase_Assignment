const express = require('express');
const mysql = require('mysql2');


//---------------------------------------constants------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT||8080;

const db = mysql.createConnection({
    host:'database-1.cr802ueeyh50.ap-south-1.rds.amazonaws.com',
    port:'3306',
    user:'satidiwas',
    password:'RekhaSati##123',
    database:'my_DB'
});

db.connect((err)=>{
    if(err){
        console.log(err);
    }
    else{
        
        console.log("database connected successfully");

        var checkTable = "SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_schema = 'my_DB' AND table_name = 'schools')";
        db.query(checkTable, function(err,result){
            if(err) throw err;
            let key = Object.keys(result[0])[0];
            // console.log(result[0][key]);
            
            if(result[0][key])  console.log("table is already there");
            else{
                var sql = "CREATE TABLE schools (id INT AUTO_INCREMENT PRIMARY KEY , name VARCHAR(255), address VARCHAR(255), latitude FLOAT(17,14), longitude FLOAT(17,14))";
                db.query(sql, function (err, result) {
                    if (err) throw err;
                    console.log("Table created");
                });
            }
        });
        
    }
});


//-------------------------------------------middlewares----------------------------------------------------------


app.use(express.json());

//---------------------------------------api routes------------------------------------------------------------------


app.post('/addSchool',(req,res)=>{
    console.log(req.body);
    let school = req.body;
    for( let key in school){
        if( ((key == "name" || key == "address") && (typeof(school[key])!="string" || school[key]=="")) ||
        ((key == "latitude" || key == "longitude") && typeof(school[key])!="number") ){
            return res.status(401).send("Details are either empty or of incorrect type. Please recheck and try again!");
        }
    }

    console.log(typeof(parseFloat(school.latitude)));
    if(typeof(school.latitude)!="number" || typeof(school.longitude)!="number") return res.status(401).send("location should be numeric value");

    let addQuery = `INSERT INTO schools (name,address,latitude,longitude) VALUES ('${school.name}','${school.address}',${school.latitude},${school.longitude})`;

    db.query(addQuery, function(err, result){
        if(err){
            
            res.status(401).send("CANNOT UPDATE DUE TO :",err);
            throw err;
        }
        else{
            console.log("1 record added");
            return res.status(201).send("Database updated Successfully. Record has been added");
        }
    })
    
});


function distance(lat1, lon1, lat2, lon2) {
    const r = 6371; // km
    const p = Math.PI / 180;
  
    const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2
                  + Math.cos(lat1 * p) * Math.cos(lat2 * p) *
                    (1 - Math.cos((lon2 - lon1) * p)) / 2;
  
    return 2 * r * Math.asin(Math.sqrt(a));
  }

app.get('/listSchools',(req,res)=>{
    console.log(req.query)
    let userLatitude = req.query.latitude;
    let userLongitude = req.query.longitude;
    var getSchoolsQuery = "SELECT * FROM schools ";

    db.query(getSchoolsQuery, function(err,result){
        if(err){
            res.status(500).send(err);
            throw err;
        }
        else{
            result.sort(function(a,b){
                let dist_a = distance(a.latitude,a.longitude,userLatitude, userLongitude);
                let dist_b = distance(b.latitude, b.longitude, userLatitude, userLongitude);
                
                return dist_a - dist_b;
            });

            res.status(200).send(result);
        }
    })
})









// server listening ------------------------------------------------------------------------------------------------

app.listen(PORT,'0.0.0.0',(err)=>{
    if(err){
        console.log(err);
    }
    console.log(`listening on port ${PORT}`);
})