
router.get('/comunicazioni', function (req, res, next) {
  let sqlQuery = "";
  executeQuery1(res, sqlQuery, next);
});