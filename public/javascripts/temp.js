
document.getElementById("editor").onkeyup = checkUpdate;
window.addEventListener("beforeunload", function (e) {
  alert();
})

window.onbeforeunload = function (event) {
  var message = 'Sure you want to leave?';
  if (typeof event == 'undefined') {
    event = window.event;
  }
  if (event) {
    event.returnValue = message;
  }
  return message;
  checkUpdate("close");
}

var updateTime = 0;
function checkUpdate(e){
  if (e != "close"){            //wait for 5 seconds before last update
    var currentTime = Math.floor( new Date().getTime()/1000 );
    if (updateTime - currentTime < -5){
      updateTime = currentTime;
      //update server
      updateServer();
    }
  } else{                     //disregard time on close and update server
      updateTime = currentTime;
      updateServer();
  }
}
var dd = document.getElementById("editor");

function updateServer(){
  dd.textarea();

  console.log("updating...");
  content = $("#editor").val();
  $.post( document.URL, {
    "content":  content
  });
}