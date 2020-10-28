require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();
const rounds = 11;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


const port = process.env.PORT || 3000;

mongoose.connect(process.env.DBCONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
});
mongoose.connection.on("error", () => {
    console.log("error");
});
mongoose.connection.once("ready", () => {
    console.log("DB connection is sucsus.");
});
const userSchema = {
    name: String,
    email: String,
    password: String,
    lists: Array,
    joind: Date,
}

const User = mongoose.model("User", userSchema);
app.get("/", (req, res) => {
    res.status(200).render("index", { date: new Date().getDate() });
});
app.get("/sign-up", (req, res) => {
    res.status(200).render("sign-up");
});

app.get("/sign-in-ui", (req, res) => {
    res.status(200).render("sign-in");
});

app.post("/sign-up", (req, res) => {
    const body = req.body;
    const name = body.name;
    const email = body.email;
    const password = body.password;
    const confirmPassword = body.confirmPassword;
    const error = false;
    for (input in body) {
        if (input === "") {
            error = true;
        }
    }
    if (!error) {
        if (password.length > 8 && password === confirmPassword) {
            User.findOne({ email: email }, (err, foundUser) => {
                if (err) {
                    res.json({ error: true });
                }
                else {
                    if (foundUser) {
                        res.json({ isPreUser: true, name: foundUser.name });
                    }
                    else {
                        bcrypt.hash(password, rounds, (err, hash) => {

                            if (err) {
                                res.json({ error: true });
                            }
                            else {
                                const data = {
                                    name, email, password: hash, lists: [], joind: new Date()
                                }
                                const newUser = new User(data);
                                newUser.save(errS => {
                                    if (errS) {
                                        res.json({ error: true });
                                    }
                                    else {
                                        res.render("user-home", {userName: data.name, lists: [].lists})
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
        else {
            res.json({ error: true, mes: "Password is not meuch." });
        }
    }

});
app.post("/create-new-list/:email", (req, res) => {
    const userEmail = req.parms.email;
    User.updateOne({email: userEmail},  { $push: { lists: {title:req.body} } });
});
app.post("/sign-in", (req, res) => {
    const body = req.body;
    const email = body.email;
    const password = body.password;
    const error = false;
    for (input in body) {
        if (input === "") {
            error = true;
        }
    }
    if (!error) {
        User.findOne({ email: email }, (err, foundUser) => {

            if (err) {
                res.json({ error: true, mes: "Errer in db." });
            }
            else {
                if (foundUser) {
                    bcrypt.compare(password, foundUser.password, (err, result) => {
                        console.log(foundUser, result);
                        if (err) {
                            res.json({ error: true, mes: "Errer in db." });
                        }
                        else {
                            console.log(result);
                            if (result) {
                                res.render("user-home", {userName: foundUser.name, lists: foundUser.lists})
                            }
                            else {
                                res.json({ error: true, mes: "Passowrd is not valid." });
                            }
                        }

                    });


                }
                else {
                    res.json({ error: true, mes: "User is not Found." });
                }
            }
        });
    }
});
app.use((req, res) => {
    res.status(404).render("not-found", { pageURL: req.url });
});
app.listen(port, () => console.log("Client side server is listening on port " + port));