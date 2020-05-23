
router.get('/lezioni', function (req, res, next) {
  let sqlQuery = "";
  executeQuery1(res, sqlQuery, next);
});