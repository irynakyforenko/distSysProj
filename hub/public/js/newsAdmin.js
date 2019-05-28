sendNews.addEventListener("click", function(){
  var title = document.getElementById("title").value.trim();
  var desc = document.getElementById("desc").value.trim();

  if(!title || !desc) return;

  fetch('/news', {
    method: 'post',
    body: JSON.stringify({ title, desc }),
    headers: {
      'Content-Type': 'application/json',
    }
  }).then(function(response) {
    location.reload();
  });
});