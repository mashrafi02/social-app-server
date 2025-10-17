const mongoose = require('mongoose');
const {Schema} = mongoose;
const {ObjectId} = Schema;
const validator = require('validator');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');



const userSchema = new Schema({
    fName: {
        type: String,
        required: true,
        trim: true,
        minlength : [4, 'Lenght of first name cannot be less than 4 characters!'],
        maxlength : [40, 'Length of first name cannot be greater than 40 characters!']
    },
    lName:{
        type: String,
        required: true,
        trim: true,
        minlength : [4, 'Lenght of last name cannot be less than 4 characters!'],
        maxlength : [40, 'Length of last name cannot be greater than 40 characters!']
    },
    username: {
        type: String,
        unique: true,
        trim: true,
    },
    email: {
        type : String,
        required : [true, 'Please Enter your Email'],
        unique : true,
        trim:true,
        lowercase : true,
        validate : {
            validator : (value) => validator.isEmail(value),
            message : 'Please provide a valid email!'
        }
    },
    emailVerified : {
        type : Boolean,
        default : false,
    },
    age: {
        type: Number,
        required: [true, 'age is required'],
        min: [14, "age must be at least 14 years"],
        max: [100, "age cannot be greater than 100 years"]
    },
    gender : {
        type : String,
        enum : {
            values : ['male','female','other'],
            message : 'this gender does not exist in the world!'
        },
        required: true
    },
    password: {
        type : String,
        required : [true, 'password is required'],
        minlength: [8, "password cannot be less than 8 characters"],
        select: false
    },
    confirmPassword : {
        type : String,
        required : [true, 'Please confirm your password'],
        validate : {
            validator : function(value){
                return this.password === value;
            },
            message : 'Incorrect match!'
        }
    },
    bDay:{
        type: Number,
        required: true,
        trim: true,
    },
    bMonth:{
        type: Number,
        required: true,
        trim: true,
    },
    bYear:{
        type: Number,
        required: true,
        trim: true,
    },
    profilePic: {
        type: String,
        default : ""
    },
    coverPic: {
        type: String,
        default: ""
    },
    friends: [
        {
            type : ObjectId,
            ref: 'users'
        }
    ],
    followers: [
        {
            type : ObjectId,
            ref: 'users'
        }
    ],
    following: [
        {
            type : ObjectId,
            ref: 'users'
        }
    ],
    requests: [
        {
            type : ObjectId,
            ref: 'users'
        }
    ],
    search: [
        {
            user : {
                type: ObjectId,
                required: true,
                ref: 'users',
            },
            createdAt:{
                type : Date,
                required : true
            }
        }
    ],
    details:{
        othername : String,
        job: String,
        country: String,
        city: String,
        workplace: String,
        college: String,
        highSchool: String,
        bio: String,
        hometown: String,
        relationship: {
            type: String,
            enum: [
                "Single",
                "In A Relationship",
                "Married",
                "It's Complecated",
                "Divorced"
            ]
        },
        insta: String,
    },
    savePosts:[
        {
            post : {
                type : ObjectId,
                ref: 'posts',
                required: true
            },
            savedAt: {
                type: Date,
                required: true
            }
        }
    ],
    myPosts:[
        {
            post : {
                type : ObjectId,
                ref: 'posts',
                required: true
            },
            savedAt: {
                type: Date,
                required: true
            }
        }
    ],
    active : {
        type: Boolean,
        default: true,
        select: false
    },
    passwordChangedAt : {
        type:Date,
        select:false,
    },
    resetPasswordToken : {
        type:String,
        select:false,
    },
    resetPasswordTokenExpires : {
        type: Date,
        select: false,
    }

},{timestamps:true});


userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();

    if (this.isNew) {
        let username;
        let exists = true;

        while (exists) {
            username = `${this.fName}@so${nanoid(10)}`;
            const user = await this.constructor.findOne({ username });
            if (!user) exists = false;
        }

        this.username = username.toLowerCase();
    }

    this.password = await bcrypt.hash(this.password, 12);

    this.confirmPassword = undefined;

    next();
})

userSchema.pre(/^find/, function(next){
    this.find({active: {$ne : false}})
    next()
});

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.createResetPasswordToken = async function (){
    const resetToken = crypto.randomBytes(32).toString('hex');
    const encryptResetToken =  crypto.createHash('sha256').update(resetToken).digest('hex');

    this.resetPasswordToken = encryptResetToken;
    this.resetPasswordTokenExpires = Date.now() + 5 * 60 * 1000;

    return resetToken;
}

userSchema.methods.isPasswordChnaged = async function (JWTTimestamp) {
    let passwordChangedAt = this.passwordChangedAt;
    if(passwordChangedAt){
        passwordChangedAt = parseInt(passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < passwordChangedAt
    }
    return false
}


const User = mongoose.model('users', userSchema);


module.exports = User;