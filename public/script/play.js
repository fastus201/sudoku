var newCampo = []
var focusedElem
var errori = 0
var currentId = -1
var time = 0
var timer
/*0 = facile -> 37 num
1 = medio -> 31 num
2 = difficile -> 27 num
3 = esperto -> 22 num
*/


document.getElementById("body").addEventListener("click",()=>{
    if(currentId!= -1)
        document.getElementById(currentId).focus()
})

function generateSudoku() {
    newCampo = JSON.parse(sessionStorage.getItem("campo"))
    for (let i = 0; i < 9; i++) {
        for (let k = 0; k < 9; k++) {
            let div = document.createElement("div")
            div.setAttribute("class", "cella")
            div.setAttribute("onclick","selectCella(this)")
            div.setAttribute("tabindex","0")
            div.setAttribute("id", i * 9 + k)
            div.style.setProperty("--color","var(--mainColor)")
            document.getElementById("sudoku" + i).append(div)
        }
    }
    drawMatrix()
}

function drawMatrix() {
    for (let i = 0; i < 9; i++) {
        for (let k = 0; k < 9; k++) {
            if (newCampo[i][k] != 0) 
                document.getElementById(i + "" + k - parseInt(i % 9)).setAttribute("num", newCampo[i][k])
        }

    }
}
function selectCella(elem) {
    let num = elem.getAttribute("num")
    currentId = elem.id
    let numQuadrato = parseInt(currentId/9)
    let numRiga = parseInt((currentId%9)/3) + numQuadrato - (numQuadrato%3)
    let numColonna = currentId%3 + 3*numQuadrato - 9*parseInt(numQuadrato/3)   
    removeSelected()
    for (let i = 0; i < 3; i++) {   
        for (let k = 0; k < 3; k++) {
            document.getElementById((i*27+k*3) + numColonna + 6*(parseInt(numQuadrato%3))).classList.add("selected")//disegnare la colonna in cui clicchi
            document.getElementById(i*9+k + 3*numRiga+18*(parseInt(numQuadrato/3))).classList.add("selected")   //disegnare sulla riga in cui clicchi
        }
    }
    for (let i = 0; i < 9; i++)
        document.getElementById(i+numQuadrato*9).classList.add("selected")//disegnare sul quadrato        
    if(num == null){    //se hai cliccato il vuoto
        elem.addEventListener("keydown",async function writeNum(e){
            if( e.key>0 && e.key<=9 && currentId != -1){
                const result = await checkNumberValidity(e.key,currentId) //verifichiamo se il numero va bene
                if(result){
                    checkForAllNumbers()
                    this.removeEventListener('keydown',arguments.callee,false)
                }
            }
        })
    }
    else{
        for (let i = 0; i < 81; i++) 
            if (document.getElementById(i).getAttribute("num") == num)
                document.getElementById(i).classList.add("selectedNum")
    }
    document.getElementById(elem.id).classList.add("selectedNum")   //seleziono la cella in cui premi, lo fai alla prima in modo che non lo tolga
}
async function checkNumberValidity(num,id) {
    let elem = document.getElementById(id)
    let playerId = sessionStorage.getItem("id")
    for (let i = 0; i < 81; i++){ //ti colora gli altri numeri
        document.getElementById(i).classList.remove("selectedNum")
        if (document.getElementById(i).getAttribute("num") == num || i == id)//colora gli altri numeri o quello dove sei te
            document.getElementById(i).classList.add("selectedNum")
    }  
    if(num == newCampo[parseInt(id/9)][id%9]){//se inserisci lo stesso numero
        elem.removeAttribute( "num")   // lo toglie
        newCampo[parseInt(id/9)][id%9] = 0
        for (let i = 0; i < 81; i++){
            if(i != currentId)  //non rimuove quella dove hai premuto
                document.getElementById(i).classList.remove("selectedNum")
        }
        document.getElementById(id).style.setProperty("--color","var(--mainColor)")
        return false
    }
    return new Promise(function(resolve,reject) {
        var check = false
        newCampo[parseInt(id/9)][id%9] = parseInt(num) 
        socket.emit("checkCella",num,id,JSON.stringify(newCampo),playerId,(result,errori)=>{
            if(result == "giusto" || result == "win"){
                check = true
                elem.setAttribute( "num", num )
                document.getElementById(id).style.setProperty("--color","var(--mainColor)")
                if (result == "win") {
                    socket.emit("gameOver","win",playerId)
                    document.getElementById("finish-message").style.color = "green";
                    document.getElementById("finish-message").innerHTML = "Hai vinto!"
                    document.getElementById("endFinish").style.display = "flex"
                    freezeGame()
                }
            }
            else if(result == "sbagliato" || result == "gameOver"){  
                check = false
                elem.setAttribute( "num", num )
                document.getElementById(id).style.setProperty("--color","var(--error)")
                document.getElementById("countErrorh1").innerHTML = "Errori "+errori+"/3"
                if (result == "gameOver") {
                    console.log("HAI PERSO!");
                    socket.emit("gameOver","lose",playerId)
                    document.getElementById("endFinish").style.display = "flex"
                    document.getElementById("countErrorh1").style.color = "red"
                    freezeGame()
                }
            }
            resolve(check)
        })
    })
}
function checkForAllNumbers() {
    var combination = [0,0,0,0,0,0,0,0,0]
    var buttons = document.getElementsByClassName("menu-num")
    for(i = 0; i < 9; i++){
        for (let k = 0; k < 9; k++){
            if(newCampo[i][k]!=0 && document.getElementById(i*9+k).style.getPropertyValue("--color")!="var(--error)")
                combination[newCampo[i][k]-1]++
        }
    }
    for (let i = 0; i < 9; i++) {
        if (combination[i] == 9)
            buttons.item(i).classList.add("frozenSudoku")
    }
}
function freezeGame() {
    clearInterval(timer)
    for (let i = 0; i < 81; i++)
        document.getElementById(i).classList.add("frozenSudoku")
    document.getElementById("nums").classList.add("frozenSudoku")
    currentId = -1
}
function removeSelected() {
    for (let i = 0; i < 81; i++) {
        document.getElementById(i).classList.remove("selected")
        document.getElementById(i).classList.remove("selectedNum")
    }
}
function addEvent() {
    const celle = document.getElementsByClassName("cella")
    const arrows = ["ArrowLeft"]
        document.getElementById("sudoku").addEventListener("keydown",(e)=>{
            let numQuadrato = parseInt(currentId/9)
            let numRiga = parseInt((currentId%9)/3) + numQuadrato - (numQuadrato%3)  //calcolare dove mi trovo
            let numColonna = currentId%3 + 3*numQuadrato - 9*parseInt(numQuadrato/3)   
            let newId = -1
            switch (e.keyCode) {
                case 37:
                    if(numColonna == 0)
                        break
                    if (currentId %3 == 0)
                        newId = currentId - 7;
                    else
                        newId = currentId - 1;
                    break;
                case 39:
                    if(numColonna == 8)
                        break
                    if ((currentId+1) % 3 == 0)
                        newId = parseInt(currentId) + 7;
                    else
                        newId = parseInt(currentId) + 1;
                    break;
                case 38:
                    var found = false;
                    if(numRiga == 0)
                        break
                    for(i=0;i<3;i++){
                        if((currentId - i )%9 == 0){
                            newId = currentId -21
                            found = true;
                        }
                    }
                    if (!found)
                        newId = currentId - 3;
                    break;
                case 40:
                    var found = false;
                    if(numRiga == 8)
                        break
                    for(i=1;i<4;i++){
                        if((currentId + i)%9 == 0){
                            newId = parseInt(currentId) +21
                            found = true
                        }
                    }
                    if (!found)
                        newId = parseInt(currentId) + 3;
                    break;
                               
                default:
                    break;
            }   
            if (newId > -1 && newId < 81)
                document.getElementById(newId).click()
        })

    const allButtons = document.getElementsByClassName("menu-num");
    for(let button of allButtons){
        button.addEventListener("click",function clickNumber(){
            if(currentId != -1)
                document.getElementById(currentId).dispatchEvent(new KeyboardEvent('keydown', {'key': button.innerHTML}))
        })
    }
    timer = setInterval(upgradeTimer,1000)
}
function upgradeTimer() {
    time++
    let minutes = Math.floor(time/ 60)
    let seconds = time%60 
    if(minutes.toString().length == 1)
        minutes = "0"+minutes
    if(seconds.toString().length == 1)
        seconds = "0"+seconds
    document.getElementById("timer1").innerHTML = minutes
    document.getElementById("timer2").innerHTML = seconds   
}
function backHome() {
    window.open("/","_self")
}

function playAgain() {
    let difficulty = parseInt(sessionStorage.getItem("diff"))
    let token = getCookie("token")
    let id = sessionStorage.getItem("id")
    socket.emit("checkForPossibleGame",token,id,(game)=>{
        if(game){
            return
        }
    })
    socket.emit("playGame",difficulty,token,id,(campo)=>{
        window.open("/play","_self")
        campo = JSON.stringify(campo)
        sessionStorage.setItem("campo",campo)
    })
}