var mongoose  =  require('mongoose');

var csSchema = new mongoose.Schema({
    Sno:{
     type:Number
    },
    States:{
        type:String
    },
    Capital:{
        type:String
    },
    Population:{
        type:Number
    }
});

module.exports = mongoose.model('staterecords',csSchema);