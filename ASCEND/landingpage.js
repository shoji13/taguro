function showLoading() {
  // Show spinner
  document.getElementById("spinner").style.display = "flex";

  // Simulate loading (2 seconds), then redirect
  setTimeout(function() {
    window.location.href = "login.html";
  }, 2000);
}
