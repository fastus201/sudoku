const  express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const {Server} =require("socket.io")
const io = new Server(server) 
const  fs = require("fs")

var totGames = []
server.listen(process.env.PORT || 5000,()=>{
    console.log("listening on *:5000");
})

app.use("/public", express.static('./public/'));

app.get('/', (req, res) => {
  res.sendFile(__dirname+'/Pages/home.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname+'/Pages/login.html');
});
app.get('/play', (req, res) => {
  res.sendFile(__dirname+'/Pages/play.html');
});
app.get('/account', (req, res) => {
  res.sendFile(__dirname+'/Pages/account.html');
});


io.on("connection",(socket)=>{
    socket.on("disconnect",()=>{
        for (let i = 0; i < totGames.length; i++) {
            if (totGames[i].playerId == socket.id && totGames[i].inGame) {
                totGames.splice(i,1)
                break
            }
        }
    })
    socket.on("registerData",(nick,password,callback)=>{
        if (nick.length <3 || password.length < 8 || callback == undefined) 
            return
        fs.readFile("./Files/data.json",{encoding:"utf-8"},function(err,data) {
            if (!err) {
                let parsData = JSON.parse(data)
                if(checkForNick(parsData,nick)){
                    callback(1)
                    return
                }
                var classUser = new User(nick,password)
                parsData.push(
                    classUser
                )
                let newData = JSON.stringify(parsData,null,"\t")
                fs.writeFile("./Files/data.json",newData,"utf-8",function(err){
                    if (err) {
                        console.log(err);
                    }
                })
                callback(0,nick,classUser.token)
            }
            else
                console.log(err)
        })
    })
    socket.on("loginAccount",(nick,password,callback)=>{        
        fs.readFile("./Files/data.json",{encoding:"utf-8"},function(err,data) {
          if (!err) {
            let parsData = JSON.parse(data)
            for (let i = 0; i < parsData.length; i++) {
                if (parsData[i].nick == nick) {
                    var token = parsData[i].token
                }
            }
            if(checkPassword(parsData,nick,password)){
                callback(0,token)
                return
            }
            else{
                callback(1)
                return
            }
          }  
        })
    })
    socket.on("checkToken",(token,callback)=>{
        fs.readFile("./Files/data.json",{encoding:"utf-8"},function(err,data) {
            if (!err) {
                let parsData = JSON.parse(data)
                for (let i = 0; i < parsData.length; i++) {
                    if (parsData[i].token == token) {
                        callback(0,parsData[i].nick)
                        return
                    }
                }
                callback(1)
            }
        })
    })
    socket.on("logGame",(callback)=>{
        callback(totGames)
    })
    socket.on("checkForPossibleGame",(token,callback)=>{
        for (let i = 0; i < totGames.length; i++) {
            if (totGames[i].tokenId == token && !totGames[i].inGame){
                totGames[i].playerId = socket.id
                totGames[i].inGame = true
                callback(true)
            }
        }
        callback(false)

    })
    socket.on("checkCella",(num,id,oldCampo,callback)=>{
        var newCampo = JSON.parse(oldCampo)
        var campo = getCampoFromId(socket.id)
        let index
        for(let i=0;i<totGames.length;i++)  //ricavo l'index delle partita
            if(totGames[i].playerId == socket.id)
                index = i
        if (num == campo[parseInt(id/9)][id%9] ){   //controllo se ho inserito la cella correttamente
            let win = true
            for (let i = 0; i < 9; i++) {
                for(let k = 0;k<9;k++){
                    if (newCampo[i][k] != campo[i][k])
                        win = false
                }
            }
            if(win)
                callback("win")
            else
                callback("giusto")
        }
        else{
            totGames[index].errors++;   //se sbaglio aumento gli errori e controllo se ho perso
            if (totGames[index].errors == 3) {
                callback("gameOver",totGames[index].errors)
            }
            callback("sbagliato",totGames[index].errors)
        }
    })
    socket.on("gameOver",(res)=>{
        let dates = new Date()
        let index = getIndexFromId(socket.id)
        let gamesInfo = totGames[index]
        let currentTime = dates.getTime() - gamesInfo.time
        let unix_timestamp = currentTime
        var date = new Date(unix_timestamp * 1)
        var minutes = "0" + date.getMinutes()
        var seconds = "0" + date.getSeconds();
        var formattedTime = minutes.substr(-2) + ':' + seconds.substr(-2)
        fs.readFile("./Files/games.json",{encoding:"utf-8"},function(err,data) {   
            if(!err){
                let parsData = JSON.parse(data)
                parsData.push({
                    gameId : gamesInfo.gameId,
                    playerToken: gamesInfo.tokenId,
                    difficulty: gamesInfo.difficulty,
                    time: formattedTime,
                    result: res,
                })
                let newData = JSON.stringify(parsData,null,"\t")
                fs.writeFile("./Files/games.json",newData,"utf-8",function(err){
                    if (err)
                        console.log(err)
                })
            }
        })
        fs.readFile("./Files/data.json",{encoding:"utf-8"},function(err,data) {   
            if(!err){
                let parsData = JSON.parse(data)
                for(let i=0;i<parsData.length;i++)
                    if (parsData[i].token == gamesInfo.tokenId) {
                        let oldAvg
                        parsData[i].gamesPlayed.push(gamesInfo.gameId)
                        parsData[i].games++
                        if (res == "win"){
                            oldAvg = parseInt(parsData[i].avgTime.split(":")[0]) * 60 + parseInt(parsData[i].avgTime.split(":")[1])
                            parsData[i].wins++
                        }
                        else{
                            oldAvg = parseInt(parsData[i].avgLoseTime.split(":")[0]) * 60 + parseInt(parsData[i].avgLoseTime.split(":")[1])
                            parsData[i].losses++
                        }
                        let avgNums = parseInt(parsData[i].games)
                        let currentTime = parseInt(formattedTime.split(":")[0]) * 60 + parseInt(formattedTime.split(":")[1])
                        let tmpnewAvg = Math.ceil((oldAvg + currentTime)/avgNums)
                        let minutes = Math.floor(tmpnewAvg/ 60)
                        let seconds = tmpnewAvg%60 
                        if(minutes.toString().length == 1)
                            minutes = "0"+minutes
                        if(seconds.toString().length == 1)
                            seconds = "0"+seconds
                        var newAvg = minutes + ':' + seconds
                        if(res == "win")
                            parsData[i].avgTime = newAvg
                        else
                            parsData[i].avgLoseTime = newAvg
                        break
                    }
                let newData = JSON.stringify(parsData,null,"\t")
                fs.writeFile("./Files/data.json",newData,"utf-8",function(err){
                    if (err)
                        console.log(err)
                })
            }
        })
    })
    function getCampoFromId(id) {
        for (let i = 0; i < totGames.length; i++) {
            if(totGames[i].playerId == id)
                return totGames[i].campo
        }
    }
    function checkPassword(json,nick,password) {
        for (let i= 0; i < json.length; i++) {
            if (json[i].nick == nick && json[i].password == password) {
                return true
            }            
        }
        return false
    }
    function checkForNick(json,nick) {
        for (let i = 0; i < json.length; i++) {
            if (json[i].nick == nick) {
                return true
            }   
        }
        return false
    }
    function getIndexFromId(id) {
        for (let i = 0; i < totGames.length; i++) 
            if (totGames[i].playerId == id) 
                return i
    }
    socket.on("playGame",(difficulty,token,callback)=>{
        var campo = generateSudoku()
        let newCampo = genNewCampo(campo,difficulty)
        let date = new Date()
        let arrDiff = ["Facile","Medio","Difficile"]
        totGames.push({
            gameId: Math.random().toString(18).substr(2) + Math.random().toString(18).substr(2),
            playerId:socket.id,
            tokenId:token,
            inGame:false,
            difficulty:arrDiff[difficulty],
            errors:0,         
            campo:campo,
            time: date.getTime()
        }
        )
        callback(newCampo)
    })

    socket.on("getDataFromServer",(token,callback)=>{
      let backData = {nick:"",date:"",games:"",lose:"",win:"",avgTime:"",avgLoseTime:""}  
      fs.readFile("./Files/data.json",{encoding:"utf-8"},function(err,data) {   
            if(!err){
                let parsData = JSON.parse(data)
                let index = 0
                for(i=0;i<parsData.length;i++){
                    if(parsData[i].token == token){
                        index = i;
                        break;
                    }
                }
                backData.nick = parsData[index].nick
                backData.date = parsData[index].created
                backData.games = parsData[index].games
                backData.lose = parsData[index].losses
                backData.win = parsData[index].wins
                backData.avgTime = parsData[index].avgTime
                backData.avgLoseTime = parsData[index].avgLoseTime
                callback(backData)
            }
            else
                console.log(err);
        })
    })


})
class User{
    nick = ""
    password = ""
    token = ""
    friends = []
    constructor(nick,password){
        this.nick = nick
        this.password = password
        this.token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2) + this.nick
        this.created = new Date(Date.now()).toLocaleString().split(",")[0]
        this.wins = 0
        this.losses = 0
        this.games = 0
        this.avgTime = "00:00"
        this.avgLoseTime = "00:00"
        this.friends = []
        this.gamesPlayed = []
    }
}
function generateSudoku() {
    var campo = [[0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],]
    let array = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    let newArray = randomizeArray(array)
    campo[0] = newArray         //il primo quadrato lo generiamo subito
    for (let k = 0; k < 2; k++) {
        done = false
        while(!done){
            var arrayA = randomizeArray([1, 2, 3, 4, 5, 6, 7, 8, 9])
            for (let i = 0; i < 3; i++) {
                if (k==1) {
                    let arrayB2 = campo[0].slice(i*3,i*3+3).concat(campo[1].slice(i*3,i*3+3))
                    let newArray = check2Arrays(arrayA,arrayB2)
                    for (let j = 0; j < 3; j++) {
                        campo[k+1][j + 3*i] = newArray[j]
                    }
                    done = true
                }
                else{
                    let arrayB = campo[k].slice(i * 3, i * 3 + 3)
                    let arrayC = check2Arrays(arrayA,arrayB)
                    let newArray = randomizeArray(arrayC).slice(0,3)
                    arrayA = check2Arrays(arrayA,newArray)
                    for (let j = 0; j < 3; j++) {
                        campo[k+1][j + 3*i] = newArray[j]
                    }
                    if( newArray.length != 3 )
                        done = false
                    else
                        done = true
                }
            }
        }
    }
    for (let k = 0; k < 3; k++) {
        done = false
        cont = 0
        while(!done){
            let clearArray = randomizeArray([1,2,3,4,5,6,7,8,9])
            for (let i = 0; i < 3; i++) {
                let column = getColumn(k, i,campo)
                let columnA = check2Arrays( clearArray, column )
                let newArray = columnA.slice(0,3)
                for (let j = 0; j < 3; j++) {
                    campo[k+3][j*3+i] = newArray[j]
                }
                clearArray = check2Arrays( clearArray, newArray )
                if( columnA.length != 3 )
                    done = false
                else
                    done = true 
            }

            if( done ){
                for (let i = 0; i < 3; i++){
                    cont++
                    if( cont == 1000 ){
                        done = false
                        cont = 0
                        k = 0
                    }
                    if( k==1 && done ){
                        let rowLeft = campo[3].slice(i*3,i*3+3)
                        let rowMid = campo[4].slice(i*3,i*3+3)
                        if( areEqual(rowLeft,rowMid) ){
                            done = false
                            break
                        }
                        else
                            done = true
                    }
                    if( k==2 && done ){
                        let rowArray = campo[3].slice(i*3,i*3+3).concat(campo[4].slice(i*3,i*3+3))
                        let checkArray = check2Arrays( rowArray, campo[5].slice(i*3,i*3+3) )
                        if( checkArray.length < 6 ){
                            done = false
                            break
                        }
                        else
                            done = true
                    }
                }
            }
        }
    }

    //Ultima riga
    for (let k = 0; k < 3; k++) {
        done = false
        cont = 0
        while ( !done ){
            let clearArray = randomizeArray([1,2,3,4,5,6,7,8,9])
            for (let i = 0; i < 3; i++) {
                let column = getColumn(k, i,campo).concat( getColumn(k+3, i,campo) )
                let columnA = check2Arrays( clearArray, column )
                for (let j = 0; j < 3; j++) {
                    campo[k+6][j*3+i] = columnA[j]
                }
                done = true 
            }
            
            for (let i = 0; i < 3; i++){
                cont++
                if( cont == 1000 ){
                    done = false
                    cont = 0
                    k = 0
                }
                if( k==1 ){
                    let rowLeft = campo[6].slice(i*3,i*3+3)
                    let rowMid = campo[7].slice(i*3,i*3+3)
                    if( areEqual(rowLeft,rowMid) ){
                        done = false
                        break
                    }
                    else
                        done = true
                }

                if( k==2 && done ){
                    let rowArray = campo[6].slice(i*3,i*3+3).concat(campo[7].slice(i*3,i*3+3))
                    let checkArray = check2Arrays( rowArray, campo[8].slice(i*3,i*3+3) )
                    //console.log( rowArray, checkArray )
                    if( checkArray.length < 6 ){
                        done = false
                        break
                    }
                    else
                        done = true
                }
            }
        }
    }
    return campo
}
function areEqual(array1, array2) {          
    for(let i = 0; i < array1.length; i++) {
        for(let j = 0; j < array2.length; j++) {
            if(array1[i] === array2[j]) {                  
                return true;
            }
        }
    }
    return false; 
}

function getColumn( x, y ,oldCampo) {
    let column = []
    for(let i = 0; i < 3; i++){
        column.push( oldCampo[x][y+3*i] )
    }
    return column
}

function check2Arrays(x, y) { //y è l'array che fa da filtro
    let a = x.slice()
    let b = y.slice()
    for (let i = 0; i < b.length; i++) {
        let index = a.indexOf(b[i])
        if (index != undefined && index != -1) {
            a.splice(index, 1)
        }
    }
    return a
}

function randomizeArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1))
        let k = array[i]
        array[i] = array[j]
        array[j] = k
    }
    return array
}


function genNewCampo(campo,difficulty) {
    let numbers = 0
    switch (difficulty) {
        case 0:
            numbers = 80
            break;
        case 1:
            numbers = 31
            break;
        case 2:
            numbers = 27
            break;
        case 3:
            numbers = 22
            break;
    }
    let done = false
    while(!done){
        newCampo=[[0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],]
        for (let i = 0; i < numbers; i++) {
            let random = Math.floor(Math.random()*81)
            
            while(newCampo[parseInt(random/9)][random%9] != 0)
                random = Math.floor(Math.random()*81)

            newCampo[parseInt(random/9)][random%9] = campo[parseInt(random/9)][random%9]
        }
        done = check0inArray( numbers , newCampo)
    }
    return newCampo
}
function check0inArray(n,newCampo) {
    let check
    let count
    for (let i = 0; i < 9; i++) {
        check = false
        count = 0
        for (let k = 0; k < 9; k++) {
            if (newCampo[i][k] != 0){
                count++ 
                check = true
            }
        }
        if( !check || count>parseInt(n/9)+1 )
            return false
    }
    return true
}