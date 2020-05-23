
router.get('/note', function (req, res, next) {
  let sqlQuery = "";
  executeQuery1(res, sqlQuery, next);
});