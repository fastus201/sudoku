function setCookie(cname,cvalue,exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function checkCookie() {
  let token = getCookie("token");
  socket.emit("checkToken",token,function(err){
    if (err) {
        return
    }
    else{
        window.open("/","_self")
    }
  })
}
function checkCookie2() {
    let token = getCookie("token")
      socket.emit("checkToken",token,function(err,nick){
        if(err)
          window.open("/login","_self")
        else
          document.getElementById("game-user").innerHTML = nick
      })
}
function checkCookie3() {
    let token = getCookie("token")
    let id = sessionStorage.getItem("id")
    socket.emit("checkForPossibleGame",token,id,(game)=>{
        if (!game)
          window.open("/","_self")          
    })
}
function logGame() {
  socket.emit("logGame",(games)=>{
    console.log(games);
  })
}

socket.on("disconnect",()=>{
  let token = getCookie("token")
  socket.emit("playerDisconnected",token)
})
