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
    let id = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)
    let token = getCookie("token")
    socket.emit("playGame",difficulty,token,id,(campo)=>{
        window.open("/play","_self")
        campo = JSON.stringify(campo)
        sessionStorage.setItem("campo",campo)
        sessionStorage.setItem("diff",difficulty)
        sessionStorage.setItem("id",id)
    })
}

function openAccount() {
    window.open("/account","_self")
}