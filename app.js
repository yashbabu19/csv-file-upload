require('dotenv').config()
var express     = require('express');
var mongoose    = require('mongoose');
var multer      = require('multer');
var path        = require('path');
var csvModels    = require('./models/csv');
var csv         = require('csvtojson');
var bodyParser  = require('body-parser');
const cookieParser = require('cookie-parser')

// Google Auth
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = '1030681489772-0at8ugobcltb1gjid68vfch0cai15gl6.apps.googleusercontent.com'
const client = new OAuth2Client(CLIENT_ID);

const { stringify } = require('querystring');

var storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./public/uploads');
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname);
    }
});

var uploads = multer({storage:storage});

//connect to db
mongoose.connect('mongodb://localhost:27017/csvdemo',{useNewUrlParser:true})
.then(()=>console.log('connected to db'))
.catch((err)=>console.log(err))

//init app
var app = express();

//set the template engine
app.set('view engine','ejs');

//fetch data from the request
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());
//static folder
app.use(express.static(path.resolve(__dirname,'public')));
app.get('/', (req, res)=>{
    res.render('index')
})

app.get('/login', (req,res)=>{
    res.render('login');
})

app.post('/login', (req,res)=>{
    let token = req.body.token;

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
      }
      verify()
      .then(()=>{
          res.cookie('session-token', token);
          res.send('success')
      })
      .catch(console.error);

})

// app.get('/demo', checkAuthenticated, (req, res)=>{
//     let user = req.user;
//     res.render('demo', {user});
// })

app.get('/protectedRoute', checkAuthenticated, (req,res)=>{
    res.send('This route is protected')
})

app.get('/logout', (req, res)=>{
    res.clearCookie('session-token');
    res.redirect('/login')

})


function checkAuthenticated(req, res, next){

    let token = req.cookies['session-token'];

    let user = {};
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();
        user.name = payload.name;
        user.email = payload.email;
        user.picture = payload.picture;
      }
      verify()
      .then(()=>{
          req.user = user;
          next();
      })
      .catch(err=>{
          res.redirect('/login')
      })

}


//default pageload
app.get('/demo',(req,res)=>{
    let user = req.user;
    //     res.render('demo', {user});
    csvModels.find((err,data)=>{
         if(err){
             console.log(err);
         }else{
              if(data!=''){
                  res.render('demo',{data:data,user});
              }else{
                  res.render('demo',{data:'',user});
              }
         }
    });
});
//cb.csvModel.remove({});
var temp ;

app.post('/',uploads.single('csv'),(req,res)=>{
    csvModels.remove({});
 //convert csvfile to jsonArray   
csv()
.fromFile(req.file.path)
.then((jsonObj)=>{
    console.log(jsonObj);
    for(var x=0;x<jsonObj;x++){
       
         temp = stringify(jsonObj[x].States)
         jsonObj[x].States = temp; 
         temp = stringify(jsonObj[x].Capital)
         jsonObj[x].Capital = temp;
         temp = parseInt(jsonObj[x].Population)
         jsonObj[x].Population = temp;
         temp = parseInt(jsonObj[x].Sno)
         jsonObj[x].Sno = temp;
        //  temp = parseFloat(jsonObj[x].Test3)
        //  jsonObj[x].Test3 = temp;
        //  temp = parseFloat(jsonObj[x].Test4)
        //  jsonObj[x].Test4 = temp;
        //  temp = parseFloat(jsonObj[x].Final)
        //  jsonObj[x].Final = temp;
     }
    // cb.csvModel.remove(jsonObj);
     csvModels.insertMany(jsonObj,(err,data)=>{
            if(err){
                console.log(err);
            }else{
        
                res.redirect('/demo');
            }
     });
   });
});

//assign port
var port = process.env.PORT || 3000;
app.listen(port,()=>console.log('server run at port '+port));