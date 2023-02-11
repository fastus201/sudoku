function backHome() {
    window.open("/","_self")
}

function getDataFromServer() {
    let token = getCookie("token")
    socket.emit("getDataFromServer",token,(data)=>{
        console.log(data);
        document.getElementById("nick").innerHTML = data.nick
        document.getElementById("data").innerHTML = data.date
        document.getElementById("games").innerHTML = data.games
        document.getElementById("wins").innerHTML = data.win
        document.getElementById("losses").innerHTML = data.lose
        if(data.games == 0)
            document.getElementById("victoryPerc").innerHTML ="0%"
        else
            document.getElementById("victoryPerc").innerHTML = ((data.win/data.games)* 100).toFixed(0)  + "%"
        document.getElementById("avgTime").innerHTML = data.avgTime
        document.getElementById("avgLoseTime").innerHTML = data.avgLoseTime
    })
}