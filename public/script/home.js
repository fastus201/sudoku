var difficulty = 0
function selectDifficulty(diff) {
    for (let i = 0; i < 3; i++) {
        if (i == diff) 
            document.getElementById("diff-btn-"+diff).style.backgroundColor = "var(--darksecondBackground)"
        else
            document.getElementById("diff-btn-"+i).style.backgroundColor = "var(--secondBackground)"
    }
    difficulty = diff   //imposto la difficolta
}

function playGame() {
    let token = getCookie("token")
    socket.emit("checkForPossibleGame",token,(game)=>{
        if(game){
            return
        }
    })
    socket.emit("playGame",difficulty,token,(campo)=>{
        window.open("/play","_self")
        campo = JSON.stringify(campo)
        sessionStorage.setItem("campo",campo)
        sessionStorage.setItem("diff",difficulty)
    })
}

function openAccount() {
    window.open("/account","_self")
}