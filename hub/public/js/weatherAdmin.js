sendReport.addEventListener("click", function(){
  var day = document.getElementById("day").value.trim();
  var hour = document.getElementById("hour").value.trim();
  var desc = document.getElementById("desc").value.trim();

  if(!day || !hour || !desc) return;

  fetch('/weatherReport', {
    method: 'post',
    body: JSON.stringify({ day, hour, desc }),
    headers: {
      'Content-Type': 'application/json',
    }
  })
  .then(res => res.text())
  .then(function(response) {
    if(response == "Success")
      alert("Insert successful");
    else
      alert("Error during insert");

    location.reload();
  });
});