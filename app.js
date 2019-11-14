
// RUN PACKAGES
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors')
const fs = require('fs')
const http = require('http')
const sha256 = require('sha256')

// SETUP APP
const app = express();
app.use(cors())
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', express.static(__dirname + '/front'));


// console.log(__dirname)

//MULTER CONFIG: to get file photos to temp server storage
const multerConfig = {

  //specify diskStorage (another option is memory)
  storage: multer.diskStorage({

    //specify destination
    destination: function (req, file, next) {
      next(null, __dirname + '/front/file-storage');
    },

    //specify the filename to be unique
    filename: function (req, file, next) {
      // console.log(file);
      //get the file mimetype ie 'image/jpeg' split and prefer the second value ie'jpeg'
      const ext = file.mimetype.split('/')[1];
      //set the file fieldname to a unique name containing the original name, current datetime and the extension.
      next(null, file.originalname);
    }
  }),

  // filter out and prevent non-image files.
  fileFilter: function (req, file, next) {
    //   if(!file){
    //     next();
    //   }

    // // only permit image mimetypes
    // const image = file.mimetype.startsWith('image/');
    // if(image){
    //   console.log('photo uploaded');
    req.body.file = file
    next(null, true);
    // }else{
    //   console.log("file not supported")
    //   //TODO:  A better message response to user on failure.
    //   return next();
    // }
  }
};


/* ROUTES
**********/
app.get('/', function (req, res) {
  res.render('index.html');
});

app.get('/test', function (req, res) {
  res.send('Ok');
});

app.post('/upload', multer(multerConfig).any(), async function (req, res, file) {

  let textFile = fs.readFileSync(__dirname + "/front/file-storage/" + req.body.file.originalname)
  let hashFile = sha256(textFile.toString('hex'))


  let body = JSON.stringify({
    walletBS: "BS2WURKA4Qhu9oiy6gSz9ahFzJCPLW",
    pubECDSA_hex: "044b3aeb814ae8cff06393d7f1e44ccf731ac4e21595ad95a4a3fae689817412870e019b25339a86d41081e7a406c436a64f376fd4f786ecb728db9094e5aa752a",
    sign: "{\"r\":\"e97da296e03e8ba35919fe4e7b00831c0b3beb4038787972ad957802c30215ec\",\"s\":\"8baa4fd9c60c69d543006c8c9809b3edffe2b08f0b92a63f5aeb52769f049b1a\",\"recoveryParam\":1}",
    msg: "d0f739baf2b85a8a752ac229f0fcb701a51e8f75c1116d9135e212dabbe47f42",
    productData: {
      name: req.body.file.originalname,
      hashFile,
      urlFile: __dirname + "/front/file-storage/" + req.body.file.originalname,
      idUser: req.body.idUser
    }
  })

  const options = {
    hostname: 'localhost',
    port: '8085',
    path: '/create-product-ibu',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length
    }
  }

  const request = await http.request(options, (resp) => {
    console.log(`statusCode: ${resp.statusCode}`)
    resp.on('data', (d) => {
      console.log(d.toString())
    })
  })


  await request.write(body)
  await request.end()

  res.redirect('localhost:3000/')

  
   //res.sendFile(__dirname + '/front/file-uploaded.html')
   

});

app.post('/hash-by-path', function (req, res) {

  let path = req.body.urlFile;
  let hashFile;
  try {
    let file = fs.readFileSync(path);
    hashFile = sha256(file.toString('hex'))
  } catch (error) {
    hashFile = '0'
  }
  

  let response = {
    hash: hashFile
  }

  res.json(response)

})

// RUN SERVER
app.listen(port, function () {
  console.log(`Server listening on port ${port}`);
});
