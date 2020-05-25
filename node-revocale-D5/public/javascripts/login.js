function hashPWD(form) {
  var pwdObj = document.getElementById('password');
  var hashObj = new jsSHA("SHA-512", "TEXT", {numRounds: 1});
  hashObj.update(pwdObj.value);
  var hash = hashObj.getHash("HEX");
  pwdObj.value = hash;
}