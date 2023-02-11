function accesButton() {
    document.getElementById("form-register").style.display = "none"
    document.getElementById("form-login").style.display = "flex"            
}
function registerButton() {
    document.getElementById("form-register").style.display = "flex"
    document.getElementById("form-login").style.display = "none"
}
function filterLetter(e) {
    var text = e.key
    let pattern = /[a-z A-Z 0-9]/
    if (!pattern.test(text)) {
        e.preventDefault()
    }
}
function registerAccount() {
    let pattern = /[0-9]/
    var nickValue = document.getElementById("regNick").value
    var passwValue = document.getElementById("passwNick").value
    var confPassw = document.getElementById("confPassword").value
    if (nickValue.length <3) {
        document.getElementById("regNick").style.animation = "error 0.25s linear"
        setTimeout(() => {
            document.getElementById("regNick").style.animation = ""
        }, 250);
        return
    }
    if (passwValue.length <8 || !pattern.test(passwValue)) {
        document.getElementById("passwNick").style.animation = "error 0.25s linear"
        setTimeout(() => {
            document.getElementById("passwNick").style.animation = ""
        }, 250);
        return
    }
    if (passwValue.length>0 && passwValue != confPassw) {
        document.getElementById("passwNick").style.animation = "error 0.25s linear"
        document.getElementById("confPassword").style.animation = "error 0.25s linear"
        setTimeout(() => {
            document.getElementById("passwNick").style.animation = ""
            document.getElementById("confPassword").style.animation = ""
        }, 250);
        return
    }
    socket.emit("registerData",nickValue,passwValue,function(err,nick,token) {
        setCookie("token",token,30)
        if (err) {
            $("#regNick").notify("Nickname già in uso!",{autoHideDelay: 2000},"error");
        }
        else{
            window.open("http://localhost:9999","_self")
        }
    })
}
function accessAccount() {
    var nick = document.getElementById("nickname").value
    var password = document.getElementById("password").value
    if (nick == "") {
        document.getElementById("nickname").style.animation = "error 0.25s linear"
        setTimeout(() => {
            document.getElementById("nickname").style.animation = ""
        }, 250);
        return
    }
    if (password == "") {
        document.getElementById("password").style.animation = "error 0.25s linear"
        setTimeout(() => {
            document.getElementById("password").style.animation = ""
        }, 250);
        return 
    }
    socket.emit("loginAccount",nick,password,(err,token)=>{
        if (err) {
            $("#nickname").notify("Nessun account trovato!",{autoHideDelay: 2000},"error");
        }
        else{
            setCookie("token",token,30)
            window.open("http://localhost:9999","_self")
        }
    }) 
}